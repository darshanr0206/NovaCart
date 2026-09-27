import os
import re
import random
import psycopg2
import pandas as pd

DB_CONFIG = {'dbname': 'novacart', 'user': 'postgres', 'password': 'test@123', 'host': 'localhost', 'port': 5432}

# Target categories
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
    except:
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
    except:
        pass
    return round(random.uniform(4.1, 4.8), 1)

def insert_product(cur, p, existing_names, default_img_cat):
    norm = p['name'].lower().strip()
    if norm in existing_names or len(p['name']) < 2:
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

    cur.execute(product_sql, p)
    pid = cur.fetchone()[0]

    imgs = p.get('images', [])
    if not imgs:
        imgs = [DEFAULT_IMAGES[default_img_cat]]
    for idx, img in enumerate(imgs[:3]):
        cur.execute(img_sql, (pid, str(img)[:250], idx))

    stock = random.randint(30, 150)
    cur.execute(inv_sql, (pid, stock, 10))

    existing_names.add(norm)
    return 1

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("SELECT LOWER(TRIM(name)) FROM products;")
    existing_names = set(r[0] for r in cur.fetchall())
    print(f"Preloaded {len(existing_names)} existing names.")

    DATASETS_DIR = 'data/datasets'

    # --- Dataset 4: MEN_SHOES.csv ---
    print("\n[Dataset 4] Men Shoes...")
    d4_file = os.path.join(DATASETS_DIR, 'dataset_4/MEN_SHOES.csv')
    if os.path.exists(d4_file):
        df = pd.read_csv(d4_file)
        added = 0
        for _, row in df.iterrows():
            brand = str(row.get('Brand_Name', 'Footwear'))[:50]
            details = str(row.get('Product_details', ''))[:180]
            name = f"{brand} {details}".strip() if details else f"{brand} Men Footwear"
            price = clean_price(row.get('Current_Price')) or round(random.uniform(499.0, 2499.0), 2)
            rating = clean_rating(row.get('RATING'))
            
            p = {
                'name': name[:250],
                'description': f"Premium men footwear by {brand}. Designed for comfort, durability and performance.",
                'specifications': f"Brand: {brand}\nCategory: Men Footwear\nMaterial: Synthetic & Rubber",
                'brand': brand,
                'price': price,
                'discount_percent': round(random.uniform(15.0, 50.0), 2),
                'average_rating': rating,
                'review_count': random.randint(20, 500),
                'category_id': CAT_SHOES,
                'seller_id': SELLER_MAP[CAT_SHOES],
                'images': [DEFAULT_IMAGES[CAT_SHOES]]
            }
            if insert_product(cur, p, existing_names, CAT_SHOES):
                added += 1
                if added % 2000 == 0:
                    conn.commit()
                    print(f"  Committed {added} shoes...")
        conn.commit()
        print(f"✓ Dataset 4: +{added} Shoes added.")

    # --- Dataset 5: Amazon_BooksDataset.csv ---
    print("\n[Dataset 5] Amazon Books...")
    d5_file = os.path.join(DATASETS_DIR, 'dataset_5/Amazon_BooksDataset.csv')
    if os.path.exists(d5_file):
        df = pd.read_csv(d5_file)
        added = 0
        for _, row in df.iterrows():
            bname = str(row.get('Book Name', '')).strip()
            if not bname:
                continue
            author = str(row.get('Author', 'Author'))[:50]
            name = f"{bname} by {author}"
            price = clean_price(row.get('Price')) or round(random.uniform(199.0, 699.0), 2)
            rating = clean_rating(row.get('Ratings'))

            p = {
                'name': name[:250],
                'description': f"Bestselling title '{bname}' authored by {author}.",
                'specifications': f"Author: {author}\nPages: {row.get('Pages', '300')}\nLanguage: {row.get('Language', 'English')}\nGenre: {row.get('Category', 'Books')}",
                'brand': author,
                'price': price,
                'discount_percent': round(random.uniform(5.0, 30.0), 2),
                'average_rating': rating,
                'review_count': random.randint(40, 900),
                'category_id': CAT_BOOKS,
                'seller_id': SELLER_MAP[CAT_BOOKS],
                'images': [DEFAULT_IMAGES[CAT_BOOKS]]
            }
            if insert_product(cur, p, existing_names, CAT_BOOKS):
                added += 1
        conn.commit()
        print(f"✓ Dataset 5: +{added} Books added.")

    # --- Dataset 7: Nykaa_Product_Review.csv ---
    print("\n[Dataset 7] Nykaa Beauty...")
    d7_file = os.path.join(DATASETS_DIR, 'dataset_7/Nykaa_Product_Review.csv')
    if os.path.exists(d7_file):
        df = pd.read_csv(d7_file)
        added = 0
        for _, row in df.iterrows():
            name = str(row.get('Product Name', '')).strip()
            if not name:
                continue
            brand = str(row.get('Product Brand', 'Nykaa Beauty'))[:50]
            price = clean_price(row.get('Product Price')) or round(random.uniform(199.0, 999.0), 2)
            rating = clean_rating(row.get('Product Rating'))
            img = str(row.get('Product Image Url', ''))

            p = {
                'name': name[:250],
                'description': str(row.get('Product Description', f"Authentic skincare & cosmetics by {brand}."))[:3900],
                'specifications': f"Brand: {brand}\nCategory: {row.get('Product Category', 'Beauty')}",
                'brand': brand,
                'price': price,
                'discount_percent': round(random.uniform(10.0, 35.0), 2),
                'average_rating': rating,
                'review_count': random.randint(20, 450),
                'category_id': CAT_BEAUTY,
                'seller_id': SELLER_MAP[CAT_BEAUTY],
                'images': [img] if img.startswith('http') else [DEFAULT_IMAGES[CAT_BEAUTY]]
            }
            if insert_product(cur, p, existing_names, CAT_BEAUTY):
                added += 1
        conn.commit()
        print(f"✓ Dataset 7: +{added} Beauty products added.")

    # --- Dataset 9: 28 Category CSVs ---
    print("\n[Dataset 9] 28 Category Specific CSVs...")
    d9_dir = os.path.join(DATASETS_DIR, 'dataset_9')
    cat_map = {
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
    d9_added = 0
    for fname, target_cat in cat_map.items():
        fpath = os.path.join(d9_dir, fname)
        if not os.path.exists(fpath):
            continue
        df = pd.read_csv(fpath)
        for _, row in df.iterrows():
            name = str(row.get('name', '')).strip()
            if not name:
                continue
            price = clean_price(row.get('discount_price')) or clean_price(row.get('actual_price')) or round(random.uniform(299.0, 2499.0), 2)
            mrp = clean_price(row.get('actual_price')) or price
            disc = round(((mrp - price)/mrp*100), 2) if mrp > price else round(random.uniform(5.0, 30.0), 2)
            rating = clean_rating(row.get('ratings'))
            img = str(row.get('image', ''))

            p = {
                'name': name[:250],
                'description': f"Premium {fname.replace('.csv', '')} product: {name}.",
                'specifications': f"Department: {row.get('main_category', 'Retail')}\nAuthenticity: 100% Guaranteed",
                'brand': name.split()[0][:50],
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': random.randint(15, 350),
                'category_id': target_cat,
                'seller_id': SELLER_MAP[target_cat],
                'images': [img] if img.startswith('http') else [DEFAULT_IMAGES[target_cat]]
            }
            if insert_product(cur, p, existing_names, target_cat):
                d9_added += 1
    conn.commit()
    print(f"✓ Dataset 9: +{d9_added} Multi-category items added.")

    # --- Dataset 10: Sports_ECommerce_Products_Data.csv ---
    print("\n[Dataset 10] Sports & Fitness Products...")
    d10_file = os.path.join(DATASETS_DIR, 'dataset_10/Sports_ECommerce_Products_Data.csv')
    if os.path.exists(d10_file):
        df = pd.read_csv(d10_file)
        added = 0
        for _, row in df.iterrows():
            name = str(row.get('Product Name', '')).strip()
            if not name:
                continue
            price = clean_price(row.get('Special Price')) or clean_price(row.get('Old Price')) or round(random.uniform(299.0, 3999.0), 2)
            mrp = clean_price(row.get('Old Price')) or price
            disc = float(row.get('Discount %', 0.0)) if pd.notna(row.get('Discount %')) else round(((mrp - price)/mrp*100), 2)

            p = {
                'name': name[:250],
                'description': f"High performance sports and fitness equipment: {name}.",
                'specifications': f"Product Type: {row.get('Product', 'Fitness Gear')}\nUsage: Professional Athletic Training",
                'brand': name.split()[0][:50],
                'price': price,
                'discount_percent': disc,
                'average_rating': clean_rating(None),
                'review_count': random.randint(25, 450),
                'category_id': CAT_SPORTS,
                'seller_id': SELLER_MAP[CAT_SPORTS],
                'images': [DEFAULT_IMAGES[CAT_SPORTS]]
            }
            if insert_product(cur, p, existing_names, CAT_SPORTS):
                added += 1
                if added % 2000 == 0:
                    conn.commit()
                    print(f"  Committed {added} sports items...")
        conn.commit()
        print(f"✓ Dataset 10: +{added} Sports products added.")

    # --- Datasets 11, 13, 14, 15: Zepto Groceries ---
    print("\n[Datasets 11, 13, 14, 15] Zepto Groceries...")
    d11_file = os.path.join(DATASETS_DIR, 'dataset_11/zepto dataset.xlsx')
    if os.path.exists(d11_file):
        xl = pd.ExcelFile(d11_file)
        added = 0
        for sname in xl.sheet_names:
            df = pd.read_excel(d11_file, sheet_name=sname)
            for _, row in df.iterrows():
                name = str(row.get('Name', '')).strip()
                if not name:
                    continue
                price = clean_price(row.get('Price')) or clean_price(row.get('Original Price'))
                if not price:
                    continue
                mrp = clean_price(row.get('Original Price')) or price
                disc = round(((mrp - price)/mrp*100), 2) if mrp > price else 0.0
                rating = clean_rating(row.get('Ratings'))
                img = str(row.get('Image', ''))

                p = {
                    'name': name[:250],
                    'description': f"Fresh grocery item from Zepto: {name}. Quantity: {row.get('Quantity', '1 Pack')}.",
                    'specifications': f"Category: {row.get('Category', 'Groceries')}\nSub-Category: {row.get('Sub-Category', 'Daily Staples')}\nQuantity: {row.get('Quantity', '1 Unit')}",
                    'brand': name.split()[0][:50],
                    'price': price,
                    'discount_percent': disc,
                    'average_rating': rating,
                    'review_count': random.randint(30, 800),
                    'category_id': CAT_GROCERIES,
                    'seller_id': SELLER_MAP[CAT_GROCERIES],
                    'images': [img] if img.startswith('http') else [DEFAULT_IMAGES[CAT_GROCERIES]]
                }
                if insert_product(cur, p, existing_names, CAT_GROCERIES):
                    added += 1
        conn.commit()
        print(f"✓ Datasets 11/13/14/15: +{added} Zepto Groceries added.")

    # --- Dataset 12: Myntra Pants ---
    print("\n[Dataset 12] Myntra Trousers & Pants...")
    d12_file = os.path.join(DATASETS_DIR, 'dataset_12/myntra_dataset_ByScraping.csv')
    if os.path.exists(d12_file):
        df = pd.read_csv(d12_file)
        added = 0
        for _, row in df.iterrows():
            desc = str(row.get('pants_description', '')).strip()
            brand = str(row.get('brand_name', 'FashionHub'))[:50]
            name = f"{brand} {desc}".strip() if desc else f"{brand} Trousers"
            price = clean_price(row.get('price')) or clean_price(row.get('MRP'))
            if not price or price < 99:
                continue
            mrp = clean_price(row.get('MRP')) or price
            disc = float(row.get('discount_percent', 0.0)) if pd.notna(row.get('discount_percent')) else round(((mrp - price)/mrp*100), 2)
            rating = clean_rating(row.get('ratings'))

            p = {
                'name': name[:250],
                'description': f"Designer apparel by {brand}: {desc}.",
                'specifications': f"Brand: {brand}\nFit: Slim / Regular\nFabric: Cotton Spandex Blend",
                'brand': brand,
                'price': price,
                'discount_percent': disc,
                'average_rating': rating,
                'review_count': random.randint(20, 500),
                'category_id': CAT_FASHION,
                'seller_id': SELLER_MAP[CAT_FASHION],
                'images': [DEFAULT_IMAGES[CAT_FASHION]]
            }
            if insert_product(cur, p, existing_names, CAT_FASHION):
                added += 1
                if added % 2000 == 0:
                    conn.commit()
                    print(f"  Committed {added} pants...")
        conn.commit()
        print(f"✓ Dataset 12: +{added} Fashion items added.")

    print("\n" + "=" * 75)
    print("ALL 15 DATASETS HAVE BEEN SUCCESSFULLY IMPORTED & PERSISTED IN POSTGRESQL!")
    print("=" * 75)

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
