import csv
import json
import re
import sys
import random
import psycopg2
from psycopg2.extras import execute_batch

DB_CONFIG = {
    'dbname': 'novacart',
    'user': 'postgres',
    'password': 'test@123',
    'host': 'localhost',
    'port': 5432
}

# Target categories configuration: Name -> Category ID
CATEGORY_MAPPING = {
    'groceries': 17,       # Groceries & Household
    'mobiles': 1,          # Mobiles
    'electronics': 8,      # Electronics
    'fashion': 23,         # Fashion
    'shoes': 28,           # Shoes & Footwear
    'books': 33,           # Books & Stationery
    'home-kitchen': 39,    # Home & Kitchen
    'beauty': 44,          # Beauty & Personal Care
    'furniture': 50,       # Furniture & Home Decor
    'toys-kids': 55,       # Toys & Kids
    'sports': 61,          # Sports & Fitness
}

# Seller mapping: Department -> Seller ID
SELLER_MAPPING = {
    'mobiles': 1,          # NovaTech Retail
    'electronics': 1,      # NovaTech Retail
    'sports': 2,           # Lifestyle Co.
    'books': 2,            # Lifestyle Co.
    'toys-kids': 2,        # Lifestyle Co.
    'home-kitchen': 3,     # Home Essentials
    'furniture': 3,        # Home Essentials
    'groceries': 3,        # Home Essentials
    'fashion': 4,          # FashionHub India
    'shoes': 4,            # FashionHub India
    'beauty': 4,           # FashionHub India
}

def parse_images(raw_image_str):
    if not raw_image_str or raw_image_str.strip() == '':
        return []
    try:
        # Many rows have format ["http...", "http..."]
        cleaned = raw_image_str.strip()
        if cleaned.startswith('[') and cleaned.endswith(']'):
            urls = json.loads(cleaned)
            return [u.strip() for u in urls if isinstance(u, str) and u.startswith('http')]
    except Exception:
        pass
    
    # Fallback regex search for http/https URLs
    matches = re.findall(r'https?://[^\s",\'\]]+', raw_image_str)
    return [m for m in matches if m.endswith(('.jpg', '.jpeg', '.png', '.webp')) or 'flixcart' in m or 'media' in m]

def classify_flipkart_row(row):
    cat_tree = row.get('product_category_tree', '')
    p_name = row.get('product_name', '')
    desc = row.get('description', '')
    
    # 1. Parse category tree string
    m = re.search(r'\[\"(.*?)\"\]', cat_tree)
    root = ''
    sub1 = ''
    if m:
        parts = [p.strip() for p in m.group(1).split('>>')]
        if len(parts) > 0:
            root = parts[0].strip().lower()
        if len(parts) > 1:
            sub1 = parts[1].strip().lower()

    # Classification rules
    if root in ['groceries', 'food & nutrition', 'household supplies', 'gourmet', 'food'] or 'grocery' in root:
        return 'groceries'
    
    if root in ['mobiles & accessories'] or 'mobile' in root or 'smartphone' in root:
        return 'mobiles'
        
    if root in ['footwear'] or 'shoe' in root or 'sandals' in root or 'heels' in root or 'boots' in root:
        return 'shoes'
        
    if root in ['clothing', 'jewellery', 'watches', 'bags, wallets & belts', 'sunglasses', 'eyewear'] or 'apparel' in root or 'dress' in root or 'kurta' in root or 'sari' in root or 'bra' in root or 'shirt' in root:
        return 'fashion'
        
    if root in ['beauty and personal care', 'beauty', 'makeup'] or 'cosmetic' in root or 'lipstick' in root or 'shampoo' in root:
        return 'beauty'
        
    if root in ['computers', 'cameras & accessories', 'home entertainment', 'gaming', 'electronics'] or 'laptop' in root or 'headphone' in root or 'camera' in root:
        return 'electronics'
        
    if root in ['furniture']:
        return 'furniture'
        
    if root in ['kitchen & dining', 'home decor & festive needs', 'home furnishing', 'home & kitchen', 'home improvement']:
        return 'home-kitchen'
        
    if root in ['toys & school supplies', 'baby care'] or 'toy' in root:
        return 'toys-kids'
        
    if root in ['pens & stationery', 'ebooks', 'books'] or 'book' in root or 'notebook' in root:
        return 'books'
        
    if root in ['sports & fitness', 'sports'] or 'fitness' in root or 'gym' in root or 'badminton' in root or 'cricket' in root:
        return 'sports'
        
    return None

def clean_price(val_str):
    if not val_str:
        return None
    try:
        cleaned = re.sub(r'[^\d.]', '', str(val_str))
        val = float(cleaned)
        return val if val > 0 else None
    except Exception:
        return None

def clean_rating(val_str):
    if not val_str or 'no' in str(val_str).lower():
        return round(random.uniform(4.0, 4.8), 1)
    try:
        cleaned = re.sub(r'[^\d.]', '', str(val_str))
        val = float(cleaned)
        if 1.0 <= val <= 5.0:
            return round(val, 1)
    except Exception:
        pass
    return round(random.uniform(4.0, 4.8), 1)

def main():
    print('=' * 70)
    print('Starting Flipkart Products Import into PostgreSQL (NovaCart)')
    print('=' * 70)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Preload existing product names to ensure strict deduplication
    cur.execute('SELECT LOWER(TRIM(name)) FROM products;')
    existing_names = set(r[0] for r in cur.fetchall())
    print(f'[1] Loaded {len(existing_names)} existing products from PostgreSQL database to prevent duplicates.')

    csv_path = 'data/flipkart_com-ecommerce_sample.csv'
    imported_count = 0
    skipped_duplicate = 0
    skipped_unclassified = 0
    skipped_invalid_price = 0
    category_imported_counts = {k: 0 for k in CATEGORY_MAPPING}

    print('[2] Reading and processing Flipkart dataset...')

    batch_products = []

    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_name = row.get('product_name', '').strip()
            if not raw_name:
                continue

            normalized_name = raw_name.lower().strip()
            if normalized_name in existing_names:
                skipped_duplicate += 1
                continue

            # Classify category
            cat_key = classify_flipkart_row(row)
            if not cat_key:
                skipped_unclassified += 1
                continue

            category_id = CATEGORY_MAPPING[cat_key]
            seller_id = SELLER_MAPPING[cat_key]

            # Parse prices
            retail_price = clean_price(row.get('retail_price'))
            discounted_price = clean_price(row.get('discounted_price'))

            if not discounted_price and not retail_price:
                skipped_invalid_price += 1
                continue

            if not discounted_price:
                discounted_price = retail_price
            if not retail_price or retail_price < discounted_price:
                retail_price = discounted_price

            # Calculate discount percent
            if retail_price > discounted_price:
                discount_percent = round(((retail_price - discounted_price) / retail_price) * 100, 2)
            else:
                discount_percent = 0.0

            # Rating and review count
            rating = clean_rating(row.get('product_rating'))
            review_count = random.randint(12, 380)

            # Description & Specifications
            description = (row.get('description') or '').strip()[:3900]
            specs = (row.get('product_specifications') or '').strip()[:3900]
            brand = (row.get('brand') or '').strip()[:90]

            # Product Name (limit 255)
            product_name = raw_name[:250]

            # Images
            images = parse_images(row.get('image'))
            if not images:
                # Default placeholder image by category
                images = [f'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80']

            batch_products.append({
                'name': product_name,
                'description': description,
                'specifications': specs,
                'brand': brand,
                'price': discounted_price,
                'discount_percent': discount_percent,
                'average_rating': rating,
                'review_count': review_count,
                'category_id': category_id,
                'seller_id': seller_id,
                'images': images,
                'cat_key': cat_key
            })
            existing_names.add(normalized_name)

    print(f'[3] Prepared {len(batch_products)} new products for batch database insertion.')
    print(f'    Skipped: {skipped_duplicate} duplicate products, {skipped_unclassified} unclassified, {skipped_invalid_price} invalid price.')

    # Batch Insert into PostgreSQL
    print('[4] Inserting products, images, and inventory records...')
    
    product_insert_sql = '''
        INSERT INTO products (
            name, description, specifications, brand, price, discount_percent,
            average_rating, review_count, category_id, seller_id, active, created_at, updated_at
        ) VALUES (
            %(name)s, %(description)s, %(specifications)s, %(brand)s, %(price)s, %(discount_percent)s,
            %(average_rating)s, %(review_count)s, %(category_id)s, %(seller_id)s, true, NOW(), NOW()
        ) RETURNING id;
    '''

    image_insert_sql = '''
        INSERT INTO product_images (product_id, url, sort_order)
        VALUES (%s, %s, %s);
    '''

    inventory_insert_sql = '''
        INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold)
        VALUES (%s, %s, %s);
    '''

    inserted = 0
    for p in batch_products:
        cur.execute(product_insert_sql, p)
        product_id = cur.fetchone()[0]

        # Insert images
        for idx, img_url in enumerate(p['images'][:5]):  # up to 5 images
            cur.execute(image_insert_sql, (product_id, img_url[:250], idx))

        # Insert inventory
        stock = random.randint(25, 120)
        low_stock = 10
        cur.execute(inventory_insert_sql, (product_id, stock, low_stock))

        category_imported_counts[p['cat_key']] += 1
        inserted += 1

        if inserted % 2000 == 0:
            conn.commit()
            print(f'    Committed {inserted}/{len(batch_products)} products...')

    conn.commit()
    print(f'\n[5] SUCCESSFULLY IMPORTED {inserted} REAL PRODUCTS INTO POSTGRESQL!')
    print('=' * 70)
    print('Breakdown of Newly Imported Products by Target Category:')
    for cat_name, cnt in sorted(category_imported_counts.items(), key=lambda x: -x[1]):
        print(f'  ✓ {cat_name:<15} (ID: {CATEGORY_MAPPING[cat_name]:<2}) : +{cnt:<5} products')

    cur.execute('SELECT COUNT(*) FROM products;')
    total_in_db = cur.fetchone()[0]
    print(f'\nTotal Live Products in PostgreSQL: {total_in_db}')
    print('=' * 70)

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
