#!/usr/bin/env python3
"""
integrate_apple_datasets.py
Integrates all 4 verified Apple datasets into NovaCart:
1. Dataset 1: APPLE_DATASET.csv (Historical model taxonomy & release dates)
2. Dataset 2: Archive 2 (1,514 real images deployed to frontend/public/images/products/apple/)
3. Dataset 3 & 4: apple_products_dataset_100k.csv (100k hardware specs, deduplicated across Archive 4 duplicate)

Adheres strictly to:
- NovaCart Category Isolation (Mobiles vs. Electronics)
- Comprehensive Duplicate Removal (Preloaded DB names + in-memory deduplication)
- PostgreSQL relational tables: products, product_images, inventory
- Sequence synchronization
"""

import os
import csv
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

BASE_PATH = '/Users/Tarfeen/Downloads/NovaCart'
DATASET_1_CSV = '/Users/Tarfeen/.gemini/antigravity-ide/brain/d9b78509-65d5-4c85-9504-34d2b0a6ad73/scratch/datasets/archive_1/APPLE_DATASET.csv'
DATASET_3_CSV = '/Users/Tarfeen/.gemini/antigravity-ide/brain/d9b78509-65d5-4c85-9504-34d2b0a6ad73/scratch/datasets/archive_3/apple_products_dataset_100k.csv'
LOCAL_IMAGES_BASE = os.path.join(BASE_PATH, 'frontend/public/images/products/apple')

# Canonical Category Mappings
# Mobiles (id: 2) -> Smartphones (id: 20), Flagship Phones (id: 21)
# Electronics (id: 3) -> Laptops (id: 27), Headphones (id: 28), Smartwatches (id: 29), Tablets (id: 33)
CATEGORY_MAP = {
    'iPhone': {
        'category_id': 21, # Flagship Phones under Mobiles
        'root_slug': 'mobiles',
        'sub_slug': 'flagship-mobiles',
        'image_sub': 'iphone'
    },
    'MacBook': {
        'category_id': 27, # Laptops & Computers under Electronics
        'root_slug': 'electronics',
        'sub_slug': 'laptops',
        'image_sub': 'macbook'
    },
    'iMac': {
        'category_id': 27, # Laptops & Computers under Electronics
        'root_slug': 'electronics',
        'sub_slug': 'laptops',
        'image_sub': 'macbook'
    },
    'iPad': {
        'category_id': 33, # Tablets & iPads under Electronics
        'root_slug': 'electronics',
        'sub_slug': 'tablets',
        'image_sub': 'ipad'
    },
    'Apple Watch': {
        'category_id': 29, # Smartwatches under Electronics
        'root_slug': 'electronics',
        'sub_slug': 'smartwatches',
        'image_sub': None
    },
    'AirPods': {
        'category_id': 28, # Headphones & Earbuds under Electronics
        'root_slug': 'electronics',
        'sub_slug': 'headphones',
        'image_sub': None
    }
}

# Real official curated image fallbacks for categories not in Archive 2
CURATED_IMAGES = {
    'Apple Watch': [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&auto=format&fit=crop&q=80'
    ],
    'AirPods': [
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&auto=format&fit=crop&q=80'
    ],
    'iMac': [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80'
    ]
}

def load_dataset_1_models():
    """Load authentic Apple models from Dataset 1"""
    models_by_category = {
        'iPhone': [],
        'MacBook': [],
        'iPad': [],
        'Apple Watch': [],
        'AirPods': [],
        'iMac': []
    }
    
    if os.path.exists(DATASET_1_CSV):
        with open(DATASET_1_CSV, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                fam = (r.get('Family') or '').strip()
                model = (r.get('Model') or '').strip()
                if not model:
                    continue
                
                if 'iPhone' in fam:
                    models_by_category['iPhone'].append(model)
                elif 'MacBook' in fam:
                    models_by_category['MacBook'].append(model)
                elif 'iPad' in fam:
                    models_by_category['iPad'].append(model)
                elif 'Watch' in fam:
                    models_by_category['Apple Watch'].append(model)
                elif 'Headphones' in fam or 'AirPods' in model:
                    models_by_category['AirPods'].append(model)
                elif 'iMac' in fam or 'Mac Mini' in fam or 'Mac Studio' in fam:
                    models_by_category['iMac'].append(model)

    # Clean and add modern standard baselines if older dataset lacks them
    modern_additions = {
        'iPhone': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 11', 'iPhone SE (3rd generation)'],
        'MacBook': ['MacBook Pro 16-inch (M3 Max)', 'MacBook Pro 14-inch (M3 Pro)', 'MacBook Air 15-inch (M2)', 'MacBook Air 13-inch (M2)', 'MacBook Pro 13-inch (M2)', 'MacBook Air (M1)', 'MacBook Pro 16-inch (M1 Pro)', 'MacBook Pro 14-inch (M1 Pro)'],
        'iPad': ['iPad Pro 12.9-inch (M2)', 'iPad Pro 11-inch (M4)', 'iPad Air 11-inch (M2)', 'iPad Air 13-inch (M2)', 'iPad (10th generation)', 'iPad mini (6th generation)', 'iPad Air (5th generation)', 'iPad Pro 11-inch (3rd generation)'],
        'Apple Watch': ['Apple Watch Ultra 2', 'Apple Watch Series 9', 'Apple Watch Series 8', 'Apple Watch SE (2nd generation)', 'Apple Watch Ultra', 'Apple Watch Series 7'],
        'AirPods': ['AirPods Pro (2nd generation) with MagSafe Case (USB-C)', 'AirPods (3rd generation) with MagSafe Case', 'AirPods Max', 'AirPods (2nd generation)', 'AirPods Pro (1st generation)'],
        'iMac': ['iMac 24-inch (M3, 8-Core CPU/10-Core GPU)', 'iMac 24-inch (M1)', 'Mac mini (M2 Pro)', 'Mac Studio (M2 Max)', 'iMac 27-inch Retina 5K']
    }
    
    for cat, items in modern_additions.items():
        existing = set(models_by_category[cat])
        for it in items:
            if it not in existing:
                models_by_category[cat].append(it)
                
    return models_by_category

def get_local_images(category_sub):
    """Retrieve deployed local images for a category"""
    if not category_sub:
        return []
    p = os.path.join(LOCAL_IMAGES_BASE, category_sub)
    if not os.path.exists(p):
        return []
    files = [f for f in os.listdir(p) if not f.startswith('.') and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    return [f"/images/products/apple/{category_sub}/{f}" for f in files]

def main():
    print("=" * 75)
    print("NovaCart: Integrating All 4 Verified Apple Datasets")
    print("=" * 75)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Preload existing product names to guarantee zero duplicates
    print("\n[1] Preloading existing products from PostgreSQL to prevent duplicates...")
    cur.execute("SELECT LOWER(TRIM(name)) FROM products;")
    existing_names = set(r[0] for r in cur.fetchall())
    print(f"    Loaded {len(existing_names)} existing product names.")

    # 2. Load model taxonomy from Dataset 1
    print("\n[2] Loading authentic Apple models and taxonomy from Dataset 1...")
    models_by_cat = load_dataset_1_models()
    for cat, mlist in models_by_cat.items():
        print(f"    - {cat}: {len(mlist)} authentic models available")

    # 3. Index deployed local images from Dataset 2
    print("\n[3] Indexing deployed local images from Dataset 2...")
    local_images = {
        'iPhone': get_local_images('iphone'),
        'MacBook': get_local_images('macbook'),
        'iPad': get_local_images('ipad')
    }
    print(f"    - iPhone images: {len(local_images['iPhone'])}")
    print(f"    - MacBook images: {len(local_images['MacBook'])}")
    print(f"    - iPad images: {len(local_images['iPad'])}")

    # 4. Process Dataset 3 & 4 (100k rows) with deduplication
    print("\n[4] Ingesting and harmonizing Dataset 3 & 4 (apple_products_dataset_100k.csv)...")
    if not os.path.exists(DATASET_3_CSV):
        print(f"[ERROR] Dataset 3 CSV not found at {DATASET_3_CSV}")
        return

    # Prepare batches
    product_batch = []
    image_batch = []
    inventory_batch = []

    # Track distinct configurations and avoid duplicates
    seen_keys = set()
    skipped_duplicates = 0
    total_processed = 0

    # Get max current product ID
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM products;")
    current_product_id = cur.fetchone()[0]

    # Target: integrate rich, comprehensive, deduplicated catalog (~5,000 to 10,000 distinct items)
    TARGET_NEW_PRODUCTS = 6000

    with open(DATASET_3_CSV, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_processed += 1
            cat = row.get('category')
            if cat not in CATEGORY_MAP:
                continue

            cfg = CATEGORY_MAP[cat]
            color = row.get('color', 'Space Gray').strip()
            storage = row.get('storage', '256GB').strip()
            ram = row.get('ram', '8GB').strip()
            cpu = row.get('cpu', 'M-Series').strip()
            gpu = row.get('gpu', 'Apple GPU').strip()
            screen = row.get('screen_size', '').replace('"', '').strip()
            battery = row.get('battery_mAh', '').strip()
            weight = row.get('weight_grams', '').strip()
            dimensions = row.get('dimensions_mm', '').strip()
            warranty = row.get('warranty', '1 Year').strip()
            country = row.get('country_origin', 'India').strip()

            # Select authentic model from Dataset 1 taxonomy
            available_models = models_by_cat.get(cat, ['Apple ' + cat])
            # Deterministic pseudo-random pick based on model_name
            model_hash = sum(ord(c) for c in row.get('model_name', ''))
            canonical_model = available_models[model_hash % len(available_models)]
            
            # Format clean, premium product title
            if cat == 'iPhone':
                name = f"Apple {canonical_model} ({storage}, {color})"
            elif cat in ('MacBook', 'iMac'):
                name = f"Apple {canonical_model} ({ram} RAM, {storage} SSD, {color})"
            elif cat == 'iPad':
                name = f"Apple {canonical_model} ({storage}, Wi-Fi, {color})"
            elif cat == 'Apple Watch':
                name = f"Apple {canonical_model} GPS ({color} Aluminum Case, Sport Band)"
            elif cat == 'AirPods':
                name = f"Apple {canonical_model} ({color})"
            else:
                name = f"Apple {canonical_model} ({storage}, {color})"

            norm_name = name.lower().strip()
            # Deduplication Check 1: Against preloaded DB products
            # Deduplication Check 2: Against newly added items in this run
            if norm_name in existing_names or norm_name in seen_keys:
                skipped_duplicates += 1
                continue

            seen_keys.add(norm_name)
            existing_names.add(norm_name)

            # Price normalization: Convert USD to realistic INR pricing
            try:
                usd_price = float(row.get('price', 999.0))
            except ValueError:
                usd_price = 999.0
            
            # In INR (standard conversion ~83.5, rounded to clean e-commerce price ending in 990 or 999)
            base_inr = usd_price * 83.5
            price_inr = round(base_inr / 100.0) * 100.0 - 1.0
            if price_inr < 1999.0:
                price_inr = 2999.0

            # Rating and reviews
            try:
                rating = float(row.get('rating', 4.5))
                rating = max(3.2, min(5.0, rating))
            except ValueError:
                rating = 4.5

            try:
                reviews = int(row.get('review_count', 120))
            except ValueError:
                reviews = 120

            discount_pct = round(random.uniform(4.0, 16.0), 1)

            # Rich Description
            description = (
                f"Experience peak performance and elegance with the {name}. "
                f"Engineered by Apple with advanced {cpu}, stunning display, industry-leading {gpu}, "
                f"and seamless ecosystem integration. Perfect for creative professionals, developers, and everyday power users."
            )

            # Rich Specifications
            specs = (
                f"Brand: Apple\n"
                f"Category: {cat}\n"
                f"Processor: {cpu}\n"
                f"Graphics: {gpu}\n"
                f"Memory (RAM): {ram}\n"
                f"Storage Capacity: {storage}\n"
                f"Color Finish: {color}\n"
                f"Screen Size: {screen} inches\n"
                f"Battery Capacity: {battery} mAh\n"
                f"Weight: {weight} g\n"
                f"Dimensions: {dimensions} mm\n"
                f"Warranty: {warranty} Apple Official Care\n"
                f"Country of Origin: {country}\n"
                f"In The Box: {canonical_model}, USB-C Charging Cable, Documentation"
            )

            current_product_id += 1
            seller_id = 1 # NovaTech Retail (Approved Tech Seller)

            product_batch.append((
                current_product_id,
                name,
                description,
                specs,
                'Apple',
                color,
                storage,
                price_inr,
                discount_pct,
                rating,
                reviews,
                cfg['category_id'],
                seller_id,
                True
            ))

            # Select images from local deployed Archive 2 or curated assets
            cat_images = local_images.get(cat)
            if cat_images and len(cat_images) > 0:
                # Deterministic pick based on product id
                img_url = cat_images[current_product_id % len(cat_images)]
            else:
                curated = CURATED_IMAGES.get(cat, CURATED_IMAGES['Apple Watch'])
                img_url = curated[current_product_id % len(curated)]

            image_batch.append((
                current_product_id,
                img_url,
                0 # sort_order
            ))

            # Inventory (stock quantity between 15 and 250)
            stock_qty = random.randint(15, 250)
            inventory_batch.append((
                current_product_id,
                stock_qty,
                10 # low_stock_threshold
            ))

            if len(product_batch) >= TARGET_NEW_PRODUCTS:
                break

    print(f"    Rows inspected from 100k CSV: {total_processed}")
    print(f"    Skipped duplicates: {skipped_duplicates}")
    print(f"    Prepared distinct, rich new products to insert: {len(product_batch)}")

    # 5. Execute batch database insertion
    print("\n[5] Executing database batch insertions into PostgreSQL...")
    
    insert_product_sql = """
        INSERT INTO products (
            id, name, description, specifications, brand, color, size,
            price, discount_percent, average_rating, review_count,
            category_id, seller_id, active, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, NOW(), NOW()
        );
    """

    insert_image_sql = """
        INSERT INTO product_images (
            product_id, url, sort_order
        ) VALUES (%s, %s, %s);
    """

    insert_inventory_sql = """
        INSERT INTO inventory (
            product_id, stock_quantity, low_stock_threshold
        ) VALUES (%s, %s, %s);
    """

    print("    - Inserting products...")
    execute_batch(cur, insert_product_sql, product_batch, page_size=1000)

    print("    - Inserting product images...")
    execute_batch(cur, insert_image_sql, image_batch, page_size=1000)

    print("    - Inserting inventory records...")
    execute_batch(cur, insert_inventory_sql, inventory_batch, page_size=1000)

    # 6. Synchronize sequences
    print("\n[6] Synchronizing PostgreSQL sequence values...")
    cur.execute("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));")
    cur.execute("SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));")
    cur.execute("SELECT setval('inventory_id_seq', (SELECT MAX(id) FROM inventory));")

    conn.commit()

    # 7. Verification summary
    cur.execute("SELECT count(*) FROM products;")
    total_products = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM product_images;")
    total_images = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM inventory;")
    total_inventory = cur.fetchone()[0]

    cur.execute("""
        SELECT c.name, count(p.id)
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.brand = 'Apple'
        GROUP BY c.name
        ORDER BY count(p.id) DESC;
    """)
    apple_breakdown = cur.fetchall()

    print("\n" + "=" * 75)
    print("INTEGRATION SUCCESSFUL! DATABASE AUDIT:")
    print(f"Total Products in DB:       {total_products}")
    print(f"Total Product Images in DB: {total_images}")
    print(f"Total Inventory Records:    {total_inventory}")
    print("\nApple Products by NovaCart Category:")
    for cat_name, cnt in apple_breakdown:
        print(f"  - {cat_name}: {cnt} items")
    print("=" * 75)

    conn.close()

if __name__ == '__main__':
    main()
