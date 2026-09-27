import os
import re
import json
import random
import datetime
import pandas as pd
import psycopg2
import math

def slugify(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    if not s:
        s = 'category'
    return s

def clean_price(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    # String cleanup
    s = str(val).replace('₹', '').replace('$', '').replace(',', '').strip()
    try:
        return float(s)
    except ValueError:
        return None

def clean_int(val, default=0):
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    s = str(val).replace(',', '').strip()
    try:
        return int(float(s))
    except ValueError:
        return default

def get_or_create_category(cur, name_to_id, slug_to_id, name, parent_id=None):
    name = str(name).strip()[:255]
    if not name:
        name = "Others"
    
    # Category name is unique, so lookup by name only
    if name in name_to_id:
        return name_to_id[name]
    
    # Generate unique slug
    base_slug = slugify(name)[:255]
    slug = base_slug
    counter = 1
    while slug in slug_to_id:
        suffix = f"-{counter}"
        slug = base_slug[:255 - len(suffix)] + suffix
        counter += 1
    
    cur.execute(
        "INSERT INTO categories (name, slug, parent_id) VALUES (%s, %s, %s) RETURNING id",
        (name, slug, parent_id)
    )
    new_id = cur.fetchone()[0]
    name_to_id[name] = new_id
    slug_to_id[slug] = new_id
    return new_id

def insert_product_data(cur, product_dict, images_list):
    # Insert Product
    cur.execute(
        """
        INSERT INTO products (name, description, specifications, brand, color, size, price, discount_percent, 
                              average_rating, review_count, active, category_id, seller_id, created_at, updated_at) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
        RETURNING id
        """,
        (
            product_dict['name'][:255],
            product_dict['description'][:4000] if product_dict['description'] else None,
            product_dict['specifications'][:4000] if product_dict['specifications'] else None,
            product_dict['brand'][:100],
            product_dict['color'][:100],
            product_dict['size'][:100],
            product_dict['price'],
            product_dict['discount_percent'],
            product_dict['average_rating'],
            product_dict['review_count'],
            True,
            product_dict['category_id'],
            product_dict['seller_id'],
            product_dict['created_at'],
            product_dict['updated_at']
        )
    )
    product_id = cur.fetchone()[0]

    # Insert Images
    sort_order = 0
    for img_url in images_list:
        if not img_url or not isinstance(img_url, str):
            continue
        img_url = img_url.strip()[:255]
        if img_url.startswith("http") and len(img_url) <= 255:
            cur.execute(
                "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s)",
                (product_id, img_url, sort_order)
            )
            sort_order += 1
            if sort_order >= 4:
                break
                
    # If no images, insert placeholder
    if sort_order == 0:
        placeholder = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800"
        cur.execute(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s)",
            (product_id, placeholder, 0)
        )

    # Insert Inventory
    stock_qty = random.randint(20, 150)
    cur.execute(
        "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s)",
        (product_id, stock_qty, 5)
    )

    return product_id

def main():
    print("Connecting to database...")
    conn = psycopg2.connect(
        dbname="novacart",
        user="postgres",
        password="test@123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    # Load existing categories mapped by name only
    cur.execute("SELECT id, name, slug FROM categories")
    categories_db = cur.fetchall()
    name_to_id = {row[1]: row[0] for row in categories_db}
    slug_to_id = {row[2]: row[0] for row in categories_db}

    # Load existing sellers
    cur.execute("SELECT id FROM sellers")
    sellers = [row[0] for row in cur.fetchall()]
    if not sellers:
        print("No sellers found. Seeding default sellers...")
        sellers = [1, 2, 3, 4]

    now = datetime.datetime.now()

    # Define Datasets
    base_dir = "scratch/datasets_extracted"
    
    datasets = [
        # 1. Zepto Dataset (Groceries)
        {
            'file': 'archive/zepto dataset.xlsx',
            'type': 'excel',
            'limit': 2000,
            'name': 'Zepto Groceries'
        },
        # 2. Electronics
        {
            'file': 'archive1/electronics_product.csv',
            'type': 'csv',
            'limit': 2000,
            'name': 'Electronics'
        },
        # 3. Myntra (Fashion)
        {
            'file': 'archive2/myntra202305041052.csv',
            'type': 'csv',
            'limit': 2000,
            'name': 'Myntra Fashion'
        },
        # 4. Amazon Books
        {
            'file': 'archive3/Amazon_BooksDataset.csv',
            'type': 'csv',
            'limit': None, # all 320
            'name': 'Amazon Books'
        },
        # 5. Flipkard (Toys/General)
        {
            'file': 'archive4/flipkard.csv',
            'type': 'csv',
            'limit': 2000,
            'name': 'Flipkart Toys/General'
        },
        # 6. Nykaa Brands (Cosmetics)
        {
            'file': 'archive5/nyka_popular_brands_products_2022_10_16.csv',
            'type': 'csv',
            'limit': None, # all 3663
            'name': 'Nykaa Cosmetics Brands'
        },
        # 7. Nykaa Reviews (Makeup)
        {
            'file': 'archive7/Nykaa_Product_Review.csv',
            'type': 'csv',
            'limit': None, # all 625
            'name': 'Nykaa Makeup Reviews'
        }
    ]

    for ds in datasets:
        path = os.path.join(base_dir, ds['file'])
        if not os.path.exists(path):
            print(f"Skipping {ds['name']}: file not found at {path}")
            continue

        print(f"\nProcessing {ds['name']}...")
        try:
            if ds['type'] == 'excel':
                df = pd.read_excel(path)
            else:
                try:
                    df = pd.read_csv(path)
                except:
                    df = pd.read_csv(path, encoding='latin1')
            
            # Shuffle data to get a random distribution
            df = df.sample(frac=1, random_state=42).reset_index(drop=True)
            
            # Apply limit
            limit = ds['limit']
            if limit and len(df) > limit:
                df = df.iloc[:limit]
            
            print(f"Loaded {len(df)} rows to import.")
            
            imported_count = 0
            error_count = 0
            
            for idx, row in df.iterrows():
                # Use a Savepoint for each product record insertion
                cur.execute("SAVEPOINT prod_save")
                try:
                    # Initialize default values
                    prod_name = ""
                    description = ""
                    specifications = ""
                    brand = "NovaBrand"
                    color = "Standard"
                    size = "Default"
                    price = None
                    discount_percent = 0.0
                    rating = 0.0
                    reviews_count = 0
                    images = []
                    parent_category = "General"
                    child_category = None
                    
                    # Custom mapping based on dataset
                    if ds['name'] == 'Zepto Groceries':
                        prod_name = str(row.get('Name', ''))
                        price = clean_price(row.get('Price'))
                        orig_price = clean_price(row.get('Original Price'))
                        if price and orig_price and orig_price > price:
                            discount_percent = ((orig_price - price) / orig_price) * 100.0
                        rating = float(row.get('Ratings', 0.0))
                        reviews_count = clean_int(row.get('Review'))
                        
                        qty = str(row.get('Quantity', ''))
                        status = str(row.get('Status', ''))
                        specifications = f"Quantity: {qty}\nStatus: {status}\nPlatform: Zepto"
                        description = f"Fresh grocery item from {row.get('Sub-Category', 'Groceries')} section. Enjoy high quality products."
                        
                        img = row.get('Image')
                        if img:
                            images = [str(img)]
                        
                        # Categories
                        parent_category = str(row.get('Category', 'Groceries'))
                        child_category = str(row.get('Sub-Category', 'General'))
                        
                        # Brand
                        words = prod_name.split()
                        if words:
                            brand = words[0]
                        else:
                            brand = "Zepto"
                            
                    elif ds['name'] == 'Electronics':
                        prod_name = str(row.get('name', ''))
                        price = clean_price(row.get('discount_price'))
                        orig_price = clean_price(row.get('actual_price'))
                        if price and orig_price and orig_price > price:
                            discount_percent = ((orig_price - price) / orig_price) * 100.0
                        rating = float(row.get('ratings', 0.0))
                        reviews_count = clean_int(row.get('no_of_ratings'))
                        
                        specifications = f"Link: {row.get('link')}"
                        description = f"High quality electronics product listed under {row.get('sub_category')}. Durable and reliable."
                        
                        img = row.get('image')
                        if img:
                            images = [str(img)]
                            
                        # Categories
                        parent_category = str(row.get('main_category', 'Electronics'))
                        child_category = str(row.get('sub_category', 'All Electronics'))
                        
                        words = prod_name.split()
                        if words:
                            brand = words[0]
                            
                    elif ds['name'] == 'Myntra Fashion':
                        prod_name = str(row.get('name', ''))
                        price = clean_price(row.get('price'))
                        orig_price = clean_price(row.get('mrp'))
                        discount_percent = clean_price(row.get('discount', 0.0))
                        if not discount_percent and price and orig_price and orig_price > price:
                            discount_percent = ((orig_price - price) / orig_price) * 100.0
                        
                        rating = float(row.get('rating', 0.0))
                        reviews_count = clean_int(row.get('ratingTotal'))
                        
                        brand = str(row.get('seller', 'Myntra Brand'))
                        specifications = f"ASIN: {row.get('asin')}\nProduct URL: {row.get('purl')}"
                        description = f"Trendy fashion wear by {brand}. Premium material and modern style."
                        
                        img_str = str(row.get('img', ''))
                        if img_str:
                            images = [url.strip() for url in img_str.split(';') if url.strip()]
                            
                        parent_category = "Fashion & Apparel"
                        # Child category based on keyword
                        if "shirt" in prod_name.lower() or "tshirt" in prod_name.lower():
                            child_category = "T-shirts & Shirts"
                        elif "jeans" in prod_name.lower() or "trousers" in prod_name.lower():
                            child_category = "Pants & Jeans"
                        elif "saree" in prod_name.lower() or "kurta" in prod_name.lower():
                            child_category = "Ethnic Wear"
                        elif "shoe" in prod_name.lower() or "sneaker" in prod_name.lower():
                            child_category = "Footwear"
                        else:
                            child_category = "Apparel"
                            
                    elif ds['name'] == 'Amazon Books':
                        prod_name = str(row.get('Book Name', ''))
                        price = clean_price(row.get('Price'))
                        rating = float(row.get('Ratings', 0.0))
                        reviews_count = clean_int(row.get('Total Ratings'))
                        brand = str(row.get('Author', 'Author'))
                        
                        pages = row.get('Pages', '')
                        lang = row.get('Language', '')
                        specifications = f"Author: {brand}\nPages: {pages}\nLanguage: {lang}"
                        description = f"Must-read book: {prod_name}. Insightful and engaging content."
                        
                        # Category
                        parent_category = "Books & Literature"
                        child_category = str(row.get('Category', 'Books'))
                        
                        images = ["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800"]
                        
                    elif ds['name'] == 'Flipkart Toys/General':
                        prod_name = str(row.get('product_name', ''))
                        price = clean_price(row.get('final_price'))
                        orig_price = clean_price(row.get('price'))
                        discount_percent = float(row.get('discount_percent', 0.0))
                        
                        rating = float(row.get('rating', 0.0))
                        reviews_count = clean_int(row.get('review_count'))
                        brand = str(row.get('brand', 'NovaBrand'))
                        color = str(row.get('color', 'Standard'))
                        size = str(row.get('size', 'Default'))
                        
                        specifications = f"Warranty: {row.get('warranty_months')} months\nReturn Policy: {row.get('return_policy_days')} days\nWeight: {row.get('weight_g')}g"
                        description = f"Exciting product listed in the {row.get('category')} category. Perfect for all ages."
                        
                        # Category
                        parent_category = "Toys & General"
                        child_category = str(row.get('category', 'Toys'))
                        
                        images = ["https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800"]
                        
                    elif ds['name'] == 'Nykaa Cosmetics Brands':
                        prod_name = str(row.get('product_title', ''))
                        price = clean_price(row.get('price'))
                        orig_price = clean_price(row.get('mrp'))
                        if price and orig_price and orig_price > price:
                            discount_percent = ((orig_price - price) / orig_price) * 100.0
                            
                        rating = float(row.get('rating', 0.0))
                        reviews_count = clean_int(row.get('rating_count'))
                        brand = str(row.get('brand_name', 'Nykaa'))
                        
                        specifications = f"Tags: {row.get('tags')}\nNykaa Product Code: {row.get('product_id')}"
                        description = f"Premium beauty and personal care product from {brand}. Enhances skin health and aesthetic."
                        
                        img = row.get('image_url')
                        if img:
                            images = [str(img)]
                            
                        parent_category = "Beauty & Cosmetics"
                        child_category = brand
                        
                    elif ds['name'] == 'Nykaa Makeup Reviews':
                        prod_name = str(row.get('Product Name', ''))
                        price = clean_price(row.get('Product Price'))
                        rating = float(row.get('Product Rating', 0.0))
                        reviews_count = clean_int(row.get('Product Reviews Count'))
                        brand = str(row.get('Product Brand', 'Nykaa'))
                        
                        desc_val = row.get('Product Description', '')
                        contents_val = row.get('Product Contents', '')
                        description = str(desc_val)[:2000] if pd.notna(desc_val) else ""
                        specifications = f"Product Contents: {contents_val}\nBrand Code: {row.get('Product Brand Code')}"
                        
                        img_str = str(row.get('Product Image Url', ''))
                        if img_str:
                            images = [url.strip() for url in img_str.split('|') if url.strip()]
                            
                        # Category structure from tree
                        tree_cat = str(row.get('Product Category', 'Makeup'))
                        parts = [p.strip() for p in tree_cat.split('>') if p.strip()]
                        if len(parts) >= 2:
                            parent_category = parts[0]
                            child_category = parts[1]
                        elif parts:
                            parent_category = "Beauty & Makeup"
                            child_category = parts[0]
                        else:
                            parent_category = "Beauty & Makeup"
                            child_category = "Makeup"
                    
                    if not price or price <= 0:
                        cur.execute("RELEASE SAVEPOINT prod_save")
                        continue
                        
                    if not prod_name:
                        cur.execute("RELEASE SAVEPOINT prod_save")
                        continue
                        
                    # 1. Categories creation
                    parent_id = get_or_create_category(cur, name_to_id, slug_to_id, parent_category, None)
                    leaf_category_id = parent_id
                    if child_category:
                        leaf_category_id = get_or_create_category(cur, name_to_id, slug_to_id, child_category, parent_id)
                        
                    # 2. Assign Seller
                    seller_id = random.choice(sellers)
                    
                    # 3. Create Product Dict
                    prod_dict = {
                        'name': prod_name,
                        'description': description,
                        'specifications': specifications,
                        'brand': brand,
                        'color': color,
                        'size': size,
                        'price': price,
                        'discount_percent': discount_percent if not math.isnan(discount_percent) else 0.0,
                        'average_rating': rating if not math.isnan(rating) else 0.0,
                        'review_count': reviews_count,
                        'category_id': leaf_category_id,
                        'seller_id': seller_id,
                        'created_at': now,
                        'updated_at': now
                    }
                    
                    insert_product_data(cur, prod_dict, images)
                    cur.execute("RELEASE SAVEPOINT prod_save")
                    imported_count += 1
                    
                except Exception as row_error:
                    cur.execute("ROLLBACK TO SAVEPOINT prod_save")
                    if error_count < 5:
                        print(f"Error inserting row in {ds['name']}: {row_error}")
                        error_count += 1
                    continue
            
            # Commit dataset transactions
            conn.commit()
            print(f"Successfully imported {imported_count} products for {ds['name']}.")
            
        except Exception as e:
            conn.rollback()
            print(f"Error importing dataset {ds['name']}: {e}")
            
    cur.close()
    conn.close()
    print("\nAll dataset imports completed successfully!")

if __name__ == "__main__":
    main()
