import os
import re
import json
import random
import datetime
import pandas as pd
import psycopg2

def slugify(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    if not s:
        s = 'category'
    return s

def parse_categories(cat_tree_str):
    if not isinstance(cat_tree_str, str) or not cat_tree_str.strip():
        return ["Others"]
    try:
        cats = json.loads(cat_tree_str)
        if isinstance(cats, list) and len(cats) > 0:
            path = cats[0]
            parts = [c.strip() for c in path.split(">>") if c.strip()]
            if parts:
                return parts
    except Exception:
        pass
    
    cleaned = cat_tree_str.replace('[', '').replace(']', '').replace('"', '').replace("'", "")
    parts = [c.strip() for c in cleaned.split(">>") if c.strip()]
    if parts:
        return parts
    return ["Others"]

def parse_specifications(specs_str):
    if not isinstance(specs_str, str) or not specs_str.strip():
        return ""
    pairs = []
    blocks = re.findall(r'\{([^\}]+)\}', specs_str)
    for block in blocks:
        key_match = re.search(r'"key"\s*=>\s*"([^"]*)"', block)
        val_match = re.search(r'"value"\s*=>\s*"([^"]*)"', block)
        if key_match and val_match:
            pairs.append(f"{key_match.group(1)}: {val_match.group(1)}")
        elif val_match:
            pairs.append(val_match.group(1))
            
    if pairs:
        return "\n".join(pairs)[:4000]
        
    cleaned = specs_str.replace('{"product_specification"=>', '').replace('[{', '').replace('}]}', '')
    cleaned = re.sub(r'["\{\}\[\]]', '', cleaned)
    return cleaned[:4000]

def parse_rating(rating_str):
    if not isinstance(rating_str, str):
        return 0.0
    rating_str = rating_str.strip()
    if rating_str == "No rating available":
        return 0.0
    try:
        return float(rating_str)
    except Exception:
        return 0.0

def parse_images(image_str):
    if not isinstance(image_str, str) or not image_str.strip():
        return []
    try:
        urls = json.loads(image_str)
        if isinstance(urls, list):
            return [url.strip() for url in urls if isinstance(url, str) and url.strip()]
    except Exception:
        pass
    # fallback regex
    urls = re.findall(r'https?://[^\s",\]\}]+', image_str)
    return urls

def main():
    csv_path = "/Users/Tarfeen/Downloads/flipkart_com-ecommerce_sample.csv"
    print(f"Loading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows.")

    print("Connecting to database...")
    conn = psycopg2.connect(
        dbname="novacart",
        user="postgres",
        password="test@123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    # Load existing categories
    cur.execute("SELECT id, name, slug FROM categories")
    categories_db = cur.fetchall()
    name_to_id = {row[1]: row[0] for row in categories_db}
    slug_to_id = {row[2]: row[0] for row in categories_db}

    # Load existing sellers
    cur.execute("SELECT id FROM sellers")
    sellers = [row[0] for row in cur.fetchall()]
    if not sellers:
        print("No sellers found in the database. Please seed sellers first.")
        return

    print(f"Starting import of {len(df)} products...")
    
    products_inserted = 0
    categories_inserted = 0
    images_inserted = 0
    
    # We will wrap everything in a transaction
    try:
        for idx, row in df.iterrows():
            # 1. Parse categories and create hierarchy
            cat_list = parse_categories(row.get('product_category_tree'))
            parent_id = None
            for cat_name in cat_list:
                cat_name = cat_name[:255]
                if cat_name in name_to_id:
                    parent_id = name_to_id[cat_name]
                else:
                    # Generate a unique slug
                    base_slug = slugify(cat_name)[:255]
                    slug = base_slug
                    counter = 1
                    while slug in slug_to_id:
                        suffix = f"-{counter}"
                        slug = base_slug[:255 - len(suffix)] + suffix
                        counter += 1
                    
                    cur.execute(
                        "INSERT INTO categories (name, slug, parent_id) VALUES (%s, %s, %s) RETURNING id",
                        (cat_name, slug, parent_id)
                    )
                    new_id = cur.fetchone()[0]
                    name_to_id[cat_name] = new_id
                    slug_to_id[slug] = new_id
                    parent_id = new_id
                    categories_inserted += 1

            leaf_category_id = parent_id
            if leaf_category_id is None:
                # Assign to a default Category or Others
                if "Others" in name_to_id:
                    leaf_category_id = name_to_id["Others"]
                else:
                    cur.execute(
                        "INSERT INTO categories (name, slug, parent_id) VALUES (%s, %s, %s) RETURNING id",
                        ("Others", "others", None)
                    )
                    new_id = cur.fetchone()[0]
                    name_to_id["Others"] = new_id
                    slug_to_id["others"] = new_id
                    leaf_category_id = new_id
                    categories_inserted += 1

            # 2. Parse price and discount
            retail_price = row.get('retail_price')
            discounted_price = row.get('discounted_price')
            
            # check numeric
            try:
                retail_price = float(retail_price) if pd.notna(retail_price) else None
            except:
                retail_price = None
                
            try:
                discounted_price = float(discounted_price) if pd.notna(discounted_price) else None
            except:
                discounted_price = None

            if retail_price is None and discounted_price is None:
                continue # Skip row
            elif retail_price is None:
                retail_price = discounted_price
            elif discounted_price is None:
                discounted_price = retail_price

            price = retail_price
            discount_percent = 0.0
            if retail_price > 0:
                discount_percent = ((retail_price - discounted_price) / retail_price) * 100.0
                if discount_percent < 0:
                    discount_percent = 0.0
                elif discount_percent > 100:
                    discount_percent = 100.0

            # 3. Product metadata
            name = str(row.get('product_name', 'Unnamed Product'))[:255]
            description = str(row.get('description', ''))[:4000]
            specifications = parse_specifications(row.get('product_specifications'))
            brand = str(row.get('brand', 'NovaBrand'))[:100]
            if not brand or brand == "nan":
                brand = "NovaBrand"
                
            rating = parse_rating(row.get('product_rating'))
            review_count = 0
            if rating > 0:
                review_count = random.randint(5, 250)
            else:
                # Give some products random ratings and reviews to look realistic
                if random.random() < 0.6:
                    rating = round(random.uniform(3.5, 4.9), 1)
                    review_count = random.randint(5, 180)

            seller_id = random.choice(sellers)
            now = datetime.datetime.now()

            # Insert product
            cur.execute(
                """
                INSERT INTO products (name, description, specifications, brand, price, discount_percent, 
                                      average_rating, review_count, active, category_id, seller_id, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING id
                """,
                (name, description, specifications, brand, price, discount_percent, 
                 rating, review_count, True, leaf_category_id, seller_id, now, now)
            )
            product_id = cur.fetchone()[0]
            products_inserted += 1

            # 4. Insert Images
            images = parse_images(row.get('image'))
            sort_order = 0
            for img_url in images:
                img_url = img_url[:255]
                # Check url is valid length and starts with http
                if img_url.startswith("http") and len(img_url) <= 255:
                    cur.execute(
                        "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s)",
                        (product_id, img_url, sort_order)
                    )
                    sort_order += 1
                    images_inserted += 1
                if sort_order >= 4: # limit to 4 images
                    break

            # 5. Insert Inventory
            stock_qty = random.randint(20, 150)
            cur.execute(
                "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s)",
                (product_id, stock_qty, 5)
            )

            if products_inserted % 1000 == 0:
                print(f"Processed {products_inserted} products...")

        # Commit everything
        conn.commit()
        print("Import completed successfully!")
        print(f"Inserted Categories: {categories_inserted}")
        print(f"Inserted Products: {products_inserted}")
        print(f"Inserted Product Images: {images_inserted}")

    except Exception as e:
        conn.rollback()
        print("Error during import, rolling back changes.", e)
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
