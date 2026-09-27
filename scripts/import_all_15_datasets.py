import os
import re
import random
import psycopg2
import pandas as pd
from psycopg2.extras import execute_batch

DB_CONFIG = {
    'dbname': 'novacart',
    'user': 'postgres',
    'password': 'test@123',
    'host': 'localhost',
    'port': 5432
}

# Category IDs
CAT_GROCERIES = 17
CAT_MOBILES = 1
CAT_ELECTRONICS = 8
CAT_FASHION = 23
CAT_SHOES = 28
CAT_BOOKS = 33
CAT_HOME_KITCHEN = 39
CAT_BEAUTY = 44
CAT_FURNITURE = 50
CAT_TOYS_KIDS = 55
CAT_SPORTS = 61

# Seller mapping: Department -> Seller ID
# 1: NovaTech Retail (Tech/Mobiles/Electronics)
# 2: Lifestyle Co. (Sports/Books/Toys)
# 3: Home Essentials (Groceries/Home/Furniture)
# 4: FashionHub India (Fashion/Shoes/Beauty)
SELLER_MAP = {
    CAT_MOBILES: 1,
    CAT_ELECTRONICS: 1,
    CAT_SPORTS: 2,
    CAT_BOOKS: 2,
    CAT_TOYS_KIDS: 2,
    CAT_GROCERIES: 3,
    CAT_HOME_KITCHEN: 3,
    CAT_FURNITURE: 3,
    CAT_FASHION: 4,
    CAT_SHOES: 4,
    CAT_BEAUTY: 4
}

DEFAULT_IMAGES = {
    CAT_GROCERIES: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    CAT_MOBILES: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
    CAT_ELECTRONICS: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    CAT_FASHION: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    CAT_SHOES: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    CAT_BOOKS: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    CAT_HOME_KITCHEN: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    CAT_BEAUTY: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
    CAT_FURNITURE: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    CAT_TOYS_KIDS: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
    CAT_SPORTS: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80'
}

def clean_price(val):
    if val is None or pd.isna(val):
        return None
    try:
        s = str(val).replace('₹', '').replace(',', '').replace('Rs.', '').replace('$', '').strip()
        m = re.search(r'(\d+(?:\.\d+)?)', s)
        if m:
            v = float(m.group(1))
            return v if v > 0 else None
    except Exception:
        pass
    return None

def clean_rating(val):
    if val is None or pd.isna(val):
        return round(random.uniform(4.1, 4.8), 1)
    try:
        s = str(val).strip()
        m = re.search(r'(\d+(?:\.\d+)?)', s)
        if m:
            v = float(m.group(1))
            if 1.0 <= v <= 5.0:
                return round(v, 1)
    except Exception:
        pass
    return round(random.uniform(4.1, 4.8), 1)

def clean_url(u):
    if not u or pd.isna(u) or not isinstance(u, str):
        return None
    u = u.strip()
    if u.startswith('http://') or u.startswith('https://'):
        return u
    return None

def process_batch(products_list, existing_names, cur, conn):
    if not products_list:
        return 0

    product_sql = """
        INSERT INTO products (
            name, description, specifications, brand, price, discount_percent,
            average_rating, review_count, category_id, seller_id, active, created_at, updated_at
        ) VALUES (
            %(name)s, %(description)s, %(specifications)s, %(brand)s, %(price)s, %(discount_percent)s,
            %(average_rating)s, %(review_count)s, %(category_id)s, %(seller_id)s, true, NOW(), NOW()
        ) RETURNING id;
    """
    img_sql = "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);"
    inv_sql = "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);"

    inserted = 0
    for p in products_list:
        norm = p['name'].lower().strip()
        if norm in existing_names:
            continue

        cur.execute(product_sql, p)
        pid = cur.fetchone()[0]

        # Images
        imgs = p.get('images', [])
        if not imgs:
            imgs = [DEFAULT_IMAGES.get(p['category_id'], DEFAULT_IMAGES[CAT_GROCERIES])]
        for idx, img in enumerate(imgs[:4]):
            cur.execute(img_sql, (pid, img[:250], idx))

        # Stock
        stock = random.randint(30, 150)
        cur.execute(inv_sql, (pid, stock, 10))

        existing_names.add(norm)
        inserted += 1

    conn.commit()
    return inserted

def main():
    print("=" * 75)
    print("STARTING FULL INGESTION PIPELINE: ALL 15 DATASETS -> NOVACART")
    print("=" * 75)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("SELECT LOWER(TRIM(name)) FROM products;")
    existing_names = set(r[0] for r in cur.fetchall())
    print(f"Preloaded {len(existing_names)} existing products for deduplication.\n")

    DATASETS_DIR = '/Users/Tarfeen/Downloads/NovaCart /data/datasets'
    total_added = 0
    summary_by_category = {}

    # =========================================================================
    # 1. Dataset 1: Amazon All Electronics (amazon_all_electronics_data.csv)
    # =========================================================================
    print("▶ Processing Dataset 1: Amazon All Electronics...")
    d1_file = os.path.join(DATASETS_DIR, 'dataset_1/amazon_all_electronics_data.csv')
    if os.path.exists(d1_file):
        df = pd.read_csv(d1_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('Product_Name', '')).strip()
            if not name or len(name) < 3:
                continue
            price = clean_price(row.get('Price'))
            if not price or price < 50:
                continue
            rating = clean_rating(row.get('Rating'))
            reviews = random.randint(15, 350)
            disc = round(random.uniform(5.0, 35.0), 2)
            brand = name.split()[0][:50] if name else "NovaTech"

            batch.append({
                'name': name[:250],
                'description': f"High performance electronics: {name}. Premium quality audio, visual, and computing equipment.",
                'specifications': f"Model: {name[:50]}\nRating: {rating} Stars\nWarranty: 1 Year Manufacturer Warranty",
                'brand': brand,
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': reviews,
                'category_id': CAT_ELECTRONICS,
                'seller_id': SELLER_MAP[CAT_ELECTRONICS],
                'images': [DEFAULT_IMAGES[CAT_ELECTRONICS]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Electronics'] = summary_by_category.get('Electronics', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Electronics'] = summary_by_category.get('Electronics', 0) + count
        print(f"  ✓ Dataset 1 complete.")

    # =========================================================================
    # 2. Dataset 2: Electronics Products (electronics_product.csv)
    # =========================================================================
    print("▶ Processing Dataset 2: Electronics & Gadgets...")
    d2_file = os.path.join(DATASETS_DIR, 'dataset_2/electronics_product.csv')
    if os.path.exists(d2_file):
        df = pd.read_csv(d2_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            if not name or len(name) < 3:
                continue
            price = clean_price(row.get('discount_price')) or clean_price(row.get('actual_price'))
            if not price or price < 50:
                continue
            mrp = clean_price(row.get('actual_price')) or price
            disc = round(((mrp - price) / mrp * 100), 2) if mrp > price else 0.0
            rating = clean_rating(row.get('ratings'))
            img = clean_url(row.get('image'))

            subcat = str(row.get('sub_category', '')).lower()
            cat_id = CAT_MOBILES if ('mobile' in subcat or 'phone' in subcat) else CAT_ELECTRONICS

            batch.append({
                'name': name[:250],
                'description': f"Top rated tech gear: {name}. Engineered for durability and high performance.",
                'specifications': f"Category: {row.get('main_category', 'Electronics')}\nSubcategory: {row.get('sub_category', 'Accessories')}",
                'brand': name.split()[0][:50] if name else "NovaTech",
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': random.randint(20, 450),
                'category_id': cat_id,
                'seller_id': SELLER_MAP[cat_id],
                'images': [img] if img else [DEFAULT_IMAGES[cat_id]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                cat_name = 'Mobiles' if cat_id == CAT_MOBILES else 'Electronics'
                summary_by_category[cat_name] = summary_by_category.get(cat_name, 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Electronics'] = summary_by_category.get('Electronics', 0) + count
        print(f"  ✓ Dataset 2 complete.")

    # =========================================================================
    # 3. Dataset 3: Myntra Fashion Products (Myntra_fashion_products.csv)
    # =========================================================================
    print("▶ Processing Dataset 3: Myntra Fashion & Apparel...")
    d3_file = os.path.join(DATASETS_DIR, 'dataset_3/Myntra_fashion_products.csv')
    if os.path.exists(d3_file):
        df = pd.read_csv(d3_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            if not name or len(name) < 3:
                continue
            price = clean_price(row.get('price'))
            if not price or price < 99:
                continue
            brand = str(row.get('brand', 'FashionHub'))[:50]
            desc = str(row.get('description', f"Trendy designer wear from {brand}."))[:3900]
            imgs_raw = str(row.get('images', ''))
            imgs = re.findall(r'https?://[^\s",\'\]]+', imgs_raw)

            batch.append({
                'name': name[:250],
                'description': desc,
                'specifications': f"Brand: {brand}\nGender: {row.get('gender', 'Unisex')}\nFit: Regular Fit\nFabric: Premium Blend",
                'brand': brand,
                'price': price,
                'discount_percent': round(random.uniform(10.0, 50.0), 2),
                'average_rating': clean_rating(None),
                'review_count': random.randint(10, 300),
                'category_id': CAT_FASHION,
                'seller_id': SELLER_MAP[CAT_FASHION],
                'images': imgs if imgs else [DEFAULT_IMAGES[CAT_FASHION]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Fashion'] = summary_by_category.get('Fashion', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Fashion'] = summary_by_category.get('Fashion', 0) + count
        print(f"  ✓ Dataset 3 complete.")

    # =========================================================================
    # 4. Dataset 4: Men Shoes (MEN_SHOES.csv)
    # =========================================================================
    print("▶ Processing Dataset 4: Men's Shoes & Footwear...")
    d4_file = os.path.join(DATASETS_DIR, 'dataset_4/MEN_SHOES.csv')
    if os.path.exists(d4_file):
        df = pd.read_csv(d4_file)
        batch = []
        for _, row in df.iterrows():
            details = str(row.get('Product_details', '')).strip()
            brand = str(row.get('Brand_Name', 'Footwear Co.'))[:50]
            name = f"{brand} {details}" if details else f"{brand} Casual Footwear"
            price = clean_price(row.get('Current_Price'))
            if not price or price < 150:
                continue
            rating = clean_rating(row.get('RATING'))

            batch.append({
                'name': name[:250],
                'description': f"Premium men's footwear by {brand}. Designed for superior comfort, durability, and bold style.",
                'specifications': f"Brand: {brand}\nMaterial: Breathable Mesh & Leather\nSole: Anti-Skid Rubber",
                'brand': brand,
                'price': price,
                'discount_percent': round(random.uniform(15.0, 55.0), 2),
                'average_rating': rating,
                'review_count': random.randint(25, 600),
                'category_id': CAT_SHOES,
                'seller_id': SELLER_MAP[CAT_SHOES],
                'images': [DEFAULT_IMAGES[CAT_SHOES]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Shoes'] = summary_by_category.get('Shoes', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Shoes'] = summary_by_category.get('Shoes', 0) + count
        print(f"  ✓ Dataset 4 complete.")

    # =========================================================================
    # 5. Dataset 5: Amazon Books (Amazon_BooksDataset.csv)
    # =========================================================================
    print("▶ Processing Dataset 5: Amazon Books...")
    d5_file = os.path.join(DATASETS_DIR, 'dataset_5/Amazon_BooksDataset.csv')
    if os.path.exists(d5_file):
        df = pd.read_csv(d5_file)
        batch = []
        for _, row in df.iterrows():
            bname = str(row.get('Book Name', '')).strip()
            if not bname or len(bname) < 2:
                continue
            author = str(row.get('Author', 'Renowned Author'))[:50]
            name = f"{bname} by {author}"
            price = clean_price(row.get('Price')) or round(random.uniform(199.0, 799.0), 2)
            rating = clean_rating(row.get('Ratings'))

            batch.append({
                'name': name[:250],
                'description': f"Bestselling book '{bname}' written by {author}. Essential reading for personal growth and entertainment.",
                'specifications': f"Author: {author}\nPages: {row.get('Pages', '320')}\nLanguage: {row.get('Language', 'English')}\nGenre: {row.get('Category', 'Literature')}",
                'brand': author,
                'price': price,
                'discount_percent': round(random.uniform(5.0, 30.0), 2),
                'average_rating': rating,
                'review_count': random.randint(50, 1200),
                'category_id': CAT_BOOKS,
                'seller_id': SELLER_MAP[CAT_BOOKS],
                'images': [DEFAULT_IMAGES[CAT_BOOKS]]
            })
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Books'] = summary_by_category.get('Books', 0) + count
        print(f"  ✓ Dataset 5 complete.")

    # =========================================================================
    # 6 & 8. Dataset 6 & 8: Flipkart Catalog (flipkard.csv)
    # =========================================================================
    print("▶ Processing Dataset 6 & 8: Flipkart Multi-Category Products...")
    d6_file = os.path.join(DATASETS_DIR, 'dataset_6/flipkard.csv')
    if os.path.exists(d6_file):
        df = pd.read_csv(d6_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('product_name', '')).strip()
            if not name or len(name) < 3:
                continue
            price = clean_price(row.get('final_price')) or clean_price(row.get('price'))
            if not price or price < 50:
                continue
            mrp = clean_price(row.get('price')) or price
            disc = float(row.get('discount_percent', 0.0)) if pd.notna(row.get('discount_percent')) else round(((mrp - price)/mrp*100), 2)
            rating = clean_rating(row.get('rating'))
            cat_str = str(row.get('category', '')).lower()

            # Classify category
            if any(k in cat_str for k in ['furniture', 'bed', 'sofa', 'table', 'chair', 'desk', 'wardrobe']):
                cat_id = CAT_FURNITURE
            elif any(k in cat_str for k in ['kitchen', 'home', 'cookware', 'decor', 'dining']):
                cat_id = CAT_HOME_KITCHEN
            elif any(k in cat_str for k in ['electronic', 'tv', 'headphone', 'speaker', 'laptop', 'camera']):
                cat_id = CAT_ELECTRONICS
            elif any(k in cat_str for k in ['phone', 'mobile', 'smartphone']):
                cat_id = CAT_MOBILES
            elif any(k in cat_str for k in ['shoe', 'footwear', 'sandal', 'boot', 'sneaker']):
                cat_id = CAT_SHOES
            elif any(k in cat_str for k in ['clothing', 'apparel', 'fashion', 'shirt', 'dress', 'saree']):
                cat_id = CAT_FASHION
            elif any(k in cat_str for k in ['toy', 'baby', 'kid', 'game']):
                cat_id = CAT_TOYS_KIDS
            elif any(k in cat_str for k in ['beauty', 'cosmetic', 'makeup', 'skin', 'perfume']):
                cat_id = CAT_BEAUTY
            elif any(k in cat_str for k in ['sport', 'fitness', 'gym', 'cricket']):
                cat_id = CAT_SPORTS
            elif any(k in cat_str for k in ['grocery', 'food', 'snack']):
                cat_id = CAT_GROCERIES
            else:
                cat_id = CAT_HOME_KITCHEN

            batch.append({
                'name': name[:250],
                'description': f"Premium {row.get('brand', 'NovaBrand')} product from Flipkart catalog: {name}.",
                'specifications': f"Brand: {row.get('brand', 'NovaBrand')}\nColor: {row.get('color', 'Standard')}\nWarranty: {row.get('warranty_months', 12)} Months",
                'brand': str(row.get('brand', 'NovaBrand'))[:50],
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': int(row.get('review_count', random.randint(15, 250))),
                'category_id': cat_id,
                'seller_id': SELLER_MAP[cat_id],
                'images': [DEFAULT_IMAGES.get(cat_id, DEFAULT_IMAGES[CAT_HOME_KITCHEN])]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Multi-Category'] = summary_by_category.get('Multi-Category', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Multi-Category'] = summary_by_category.get('Multi-Category', 0) + count
        print(f"  ✓ Dataset 6/8 complete.")

    # =========================================================================
    # 7. Dataset 7: Nykaa Beauty (Nykaa_Product_Review.csv)
    # =========================================================================
    print("▶ Processing Dataset 7: Nykaa Beauty & Personal Care...")
    d7_file = os.path.join(DATASETS_DIR, 'dataset_7/Nykaa_Product_Review.csv')
    if os.path.exists(d7_file):
        df = pd.read_csv(d7_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('Product Name', '')).strip()
            if not name or len(name) < 2:
                continue
            price = clean_price(row.get('Product Price')) or round(random.uniform(299.0, 1499.0), 2)
            brand = str(row.get('Product Brand', 'Nykaa Cosmetics'))[:50]
            rating = clean_rating(row.get('Product Rating'))
            img = clean_url(row.get('Product Image Url'))

            batch.append({
                'name': name[:250],
                'description': str(row.get('Product Description', f"Authentic skincare & cosmetics from {brand}."))[:3900],
                'specifications': f"Brand: {brand}\nCategory: {row.get('Product Category', 'Beauty & Personal Care')}\nTags: {row.get('Product Tags', 'Authentic, Dermatologist Tested')}",
                'brand': brand,
                'price': price,
                'discount_percent': round(random.uniform(10.0, 40.0), 2),
                'average_rating': rating,
                'review_count': random.randint(30, 800),
                'category_id': CAT_BEAUTY,
                'seller_id': SELLER_MAP[CAT_BEAUTY],
                'images': [img] if img else [DEFAULT_IMAGES[CAT_BEAUTY]]
            })
            if len(batch) >= 500:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Beauty'] = summary_by_category.get('Beauty', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Beauty'] = summary_by_category.get('Beauty', 0) + count
        print(f"  ✓ Dataset 7 complete.")

    # =========================================================================
    # 9. Dataset 9: 28 Category CSVs
    # =========================================================================
    print("▶ Processing Dataset 9: 28 Category-Specific Datasets...")
    d9_dir = os.path.join(DATASETS_DIR, 'dataset_9')
    if os.path.exists(d9_dir):
        cat_file_mapping = {
            'Phones.csv': CAT_MOBILES,
            'Cameras.csv': CAT_ELECTRONICS,
            'Headphones.csv': CAT_ELECTRONICS,
            'Speakers.csv': CAT_ELECTRONICS,
            'Televisions.csv': CAT_ELECTRONICS,
            'T-shirts and Polos.csv': CAT_FASHION,
            'Mens Shirts.csv': CAT_FASHION,
            'Mens Innerwear.csv': CAT_FASHION,
            'Womens Innerwear.csv': CAT_FASHION,
            'WesternWear.csv': CAT_FASHION,
            'WomensFashion.csv': CAT_FASHION,
            'Handbags and Clutches.csv': CAT_FASHION,
            'Mens Watches.csv': CAT_FASHION,
            'Womens Watches.csv': CAT_FASHION,
            'Kids Clothing.csv': CAT_FASHION,
            'Mens Formal Shoes.csv': CAT_SHOES,
            'Mens Sports Shoes.csv': CAT_SHOES,
            'Womens Sandals.csv': CAT_SHOES,
            'Womens Shoes.csv': CAT_SHOES,
            'Make-up.csv': CAT_BEAUTY,
            'Toys and Games.csv': CAT_TOYS_KIDS,
            'Baby Products.csv': CAT_TOYS_KIDS,
            'School Bags.csv': CAT_TOYS_KIDS,
            'Strength Training.csv': CAT_SPORTS,
            'Motorbike Accessories.csv': CAT_SPORTS,
            'Home Improvement.csv': CAT_HOME_KITCHEN,
            'Refrigerators.csv': CAT_HOME_KITCHEN,
            'Musical Instruments.csv': CAT_ELECTRONICS
        }

        for fname, target_cat_id in cat_file_mapping.items():
            fpath = os.path.join(d9_dir, fname)
            if not os.path.exists(fpath):
                continue
            df = pd.read_csv(fpath)
            batch = []
            for _, row in df.iterrows():
                name = str(row.get('name', '')).strip()
                if not name or len(name) < 3:
                    continue
                price = clean_price(row.get('discount_price')) or clean_price(row.get('actual_price')) or round(random.uniform(299.0, 3999.0), 2)
                mrp = clean_price(row.get('actual_price')) or price
                disc = round(((mrp - price)/mrp*100), 2) if mrp > price else round(random.uniform(5.0, 30.0), 2)
                rating = clean_rating(row.get('ratings'))
                img = clean_url(row.get('image'))

                batch.append({
                    'name': name[:250],
                    'description': f"Top rated {fname.replace('.csv', '')}: {name}.",
                    'specifications': f"Department: {row.get('main_category', 'Retail')}\nVerified Authenticity: 100%",
                    'brand': name.split()[0][:50],
                    'price': price,
                    'discount_percent': disc,
                    'average_rating': rating,
                    'review_count': random.randint(15, 450),
                    'category_id': target_cat_id,
                    'seller_id': SELLER_MAP[target_cat_id],
                    'images': [img] if img else [DEFAULT_IMAGES[target_cat_id]]
                })
            if batch:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category[fname] = count
        print(f"  ✓ Dataset 9 complete.")

    # =========================================================================
    # 10. Dataset 10: Sports Products (Sports_ECommerce_Products_Data.csv)
    # =========================================================================
    print("▶ Processing Dataset 10: Sports & Fitness Equipment...")
    d10_file = os.path.join(DATASETS_DIR, 'dataset_10/Sports_ECommerce_Products_Data.csv')
    if os.path.exists(d10_file):
        df = pd.read_csv(d10_file)
        batch = []
        for _, row in df.iterrows():
            name = str(row.get('Product Name', '')).strip()
            if not name or len(name) < 2:
                continue
            price = clean_price(row.get('Special Price')) or clean_price(row.get('Old Price'))
            if not price or price < 50:
                continue
            mrp = clean_price(row.get('Old Price')) or price
            disc = float(row.get('Discount %', 0.0)) if pd.notna(row.get('Discount %')) else round(((mrp - price)/mrp*100), 2)

            batch.append({
                'name': name[:250],
                'description': f"High performance sports and fitness equipment: {name}. Built for rigorous athletic training.",
                'specifications': f"Product Type: {row.get('Product', 'Fitness Gear')}\nMaterial: Professional Grade",
                'brand': name.split()[0][:50],
                'price': price,
                'discount_percent': disc,
                'average_rating': clean_rating(None),
                'review_count': random.randint(20, 350),
                'category_id': CAT_SPORTS,
                'seller_id': SELLER_MAP[CAT_SPORTS],
                'images': [DEFAULT_IMAGES[CAT_SPORTS]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Sports'] = summary_by_category.get('Sports', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Sports'] = summary_by_category.get('Sports', 0) + count
        print(f"  ✓ Dataset 10 complete.")

    # =========================================================================
    # 11, 13, 14, 15. Datasets 11, 13, 14, 15: Zepto Groceries (zepto dataset.xlsx)
    # =========================================================================
    print("▶ Processing Datasets 11/13/14/15: Zepto Groceries & Essentials...")
    d11_file = os.path.join(DATASETS_DIR, 'dataset_11/zepto dataset.xlsx')
    if os.path.exists(d11_file):
        xl = pd.ExcelFile(d11_file)
        batch = []
        for sname in xl.sheet_names:
            df = pd.read_excel(d11_file, sheet_name=sname)
            for _, row in df.iterrows():
                name = str(row.get('Name', '')).strip()
                if not name or len(name) < 2:
                    continue
                price = clean_price(row.get('Price')) or clean_price(row.get('Original Price'))
                if not price or price <= 0:
                    continue
                mrp = clean_price(row.get('Original Price')) or price
                disc = round(((mrp - price)/mrp*100), 2) if mrp > price else 0.0
                rating = clean_rating(row.get('Ratings'))
                img = clean_url(row.get('Image'))

                batch.append({
                    'name': name[:250],
                    'description': f"Fresh daily grocery staple from Zepto: {name}. Quantity: {row.get('Quantity', 'Standard Pack')}.",
                    'specifications': f"Category: {row.get('Category', 'Groceries')}\nSub-Category: {row.get('Sub-Category', 'Daily Essentials')}\nQuantity: {row.get('Quantity', '1 Unit')}",
                    'brand': name.split()[0][:50],
                    'price': price,
                    'discount_percent': disc,
                    'average_rating': rating,
                    'review_count': random.randint(30, 950),
                    'category_id': CAT_GROCERIES,
                    'seller_id': SELLER_MAP[CAT_GROCERIES],
                    'images': [img] if img else [DEFAULT_IMAGES[CAT_GROCERIES]]
                })
                if len(batch) >= 1000:
                    count = process_batch(batch, existing_names, cur, conn)
                    total_added += count
                    summary_by_category['Groceries (Zepto)'] = summary_by_category.get('Groceries (Zepto)', 0) + count
                    batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Groceries (Zepto)'] = summary_by_category.get('Groceries (Zepto)', 0) + count
        print(f"  ✓ Datasets 11/13/14/15 complete.")

    # =========================================================================
    # 12. Dataset 12: Myntra Pants Scraping (myntra_dataset_ByScraping.csv)
    # =========================================================================
    print("▶ Processing Dataset 12: Myntra Pants & Trousers...")
    d12_file = os.path.join(DATASETS_DIR, 'dataset_12/myntra_dataset_ByScraping.csv')
    if os.path.exists(d12_file):
        df = pd.read_csv(d12_file)
        batch = []
        for _, row in df.iterrows():
            desc = str(row.get('pants_description', '')).strip()
            brand = str(row.get('brand_name', 'FashionHub'))[:50]
            name = f"{brand} {desc}" if desc else f"{brand} Casual Trousers"
            price = clean_price(row.get('price')) or clean_price(row.get('MRP'))
            if not price or price < 99:
                continue
            mrp = clean_price(row.get('MRP')) or price
            disc = float(row.get('discount_percent', 0.0)) if pd.notna(row.get('discount_percent')) else round(((mrp - price)/mrp*100), 2)
            rating = clean_rating(row.get('ratings'))

            batch.append({
                'name': name[:250],
                'description': f"Authentic {brand} apparel: {desc}. Designed for modern comfort and style.",
                'specifications': f"Brand: {brand}\nFabric: Cotton Spandex Blend\nFit: Slim / Regular Fit",
                'brand': brand,
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': random.randint(20, 500),
                'category_id': CAT_FASHION,
                'seller_id': SELLER_MAP[CAT_FASHION],
                'images': [DEFAULT_IMAGES[CAT_FASHION]]
            })
            if len(batch) >= 1000:
                count = process_batch(batch, existing_names, cur, conn)
                total_added += count
                summary_by_category['Fashion (Myntra)'] = summary_by_category.get('Fashion (Myntra)', 0) + count
                batch = []
        if batch:
            count = process_batch(batch, existing_names, cur, conn)
            total_added += count
            summary_by_category['Fashion (Myntra)'] = summary_by_category.get('Fashion (Myntra)', 0) + count
        print(f"  ✓ Dataset 12 complete.")

    print("\n" + "=" * 75)
    print(f"SUCCESSFULLY INTEGRATED ALL 15 DATASETS: +{total_added} NEW PRODUCTS ADDED!")
    print("=" * 75)

    cur.execute("SELECT COUNT(*) FROM products;")
    grand_total = cur.fetchone()[0]
    print(f"Grand Total Active Products in PostgreSQL: {grand_total}")
    print("=" * 75)

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
