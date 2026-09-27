import os
import re
import json
import random
import datetime
import zipfile
import psycopg2
import pandas as pd

def extract_produce_images(zip_path, target_dirs):
    print("Extracting produce images from archivezip3.zip...")
    categories = ['fresh_apple', 'fresh_banana', 'fresh_orange', 'fresh_tomato', 'fresh_capsicum', 'fresh_bitter_gourd']
    
    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
        
    extracted_counts = {}
    with zipfile.ZipFile(zip_path, 'r') as z:
        for cat in categories:
            files = [f for f in z.namelist() if f.startswith(cat + '/') and (f.endswith('.png') or f.endswith('.jpg') or f.endswith('.jpeg'))]
            extracted_counts[cat] = len(files)
            for idx, filename in enumerate(files[:8]):
                ext = os.path.splitext(filename)[1]
                out_name = f"{cat}_{idx+1}{ext}"
                data = z.read(filename)
                for d in target_dirs:
                    with open(os.path.join(d, out_name), 'wb') as f_out:
                        f_out.write(data)
                        
    print(f"Extracted produce images for {len(categories)} categories into target directories.")
    return extracted_counts

def get_commodity_category(commodity_name):
    c = commodity_name.lower()
    
    # Flowers
    if any(k in c for k in ['rose', 'carnation', 'flower', 'jaffri', 'jarbara', 'lilly', 'lotus', 'orchid', 'patti calcutta', 'raibel', 'gladiolus', 'betal leaves']):
        return 141 # Flower Bouquets, Bunches
        
    # Spices & Masalas
    if any(k in c for k in ['cardamom', 'clove', 'jeera', 'cummin', 'pepper', 'turmeric', 'corriander seed', 'chilli', 'chillies', 'soanf', 'suva', 'tamarind', 'nutmeg', 'methi seed', 'isabgul']):
        return 17 # Spices & Masalas
        
    # Salt, Sugar & Jaggery
    if any(k in c for k in ['sugar', 'gur', 'jaggery']):
        return 115 # Salt, Sugar & Jaggery
        
    # Grains, Dals, Pulses, Oils, Ghee
    if any(k in c for k in ['wheat', 'rice', 'paddy', 'dhan', 'maize', 'bajra', 'jowar', 'ragi', 'millet', 'barley', 'dal', 'gram', 'lentil', 'moong', 'chana', 'urd', 'tur', 'arhar', 'masur', 'oil', 'ghee', 'soyabean', 'mustard', 'sesamum', 'til', 'castor', 'groundnut', 'copra']):
        return 12 # Atta, Rice, Oil & Dals
        
    # Herbs & Seasonings
    if any(k in c for k in ['coriander(leaves)', 'mint', 'pudina', 'season leaves', 'methi(leaves)']):
        return 111 # Herbs & Seasonings
        
    # Fresh Fruits
    if any(k in c for k in ['apple', 'banana', 'orange', 'mango', 'pomegranate', 'mousambi', 'lime', 'lemon', 'papaya', 'plum', 'pineapple', 'melon', 'pear', 'litchi', 'grapes', 'guava', 'peach', 'chikoo', 'sapota', 'jamun', 'cherry', 'apricot', 'coconut', 'amla']):
        return 142 # Fresh Fruits
        
    # Default to Fresh Vegetables
    return 143 # Fresh Vegetables

COMMODITY_IMAGES = {
    'fresh_apple': [f'/images/products/produce/fresh_apple_{i}.png' for i in range(1, 9)],
    'fresh_banana': [f'/images/products/produce/fresh_banana_{i}.png' for i in range(1, 9)],
    'fresh_orange': [f'/images/products/produce/fresh_orange_{i}.png' for i in range(1, 9)],
    'fresh_tomato': [f'/images/products/produce/fresh_tomato_{i}.jpg' for i in range(1, 9)],
    'fresh_capsicum': [f'/images/products/produce/fresh_capsicum_{i}.jpg' for i in range(1, 9)],
    'fresh_bitter_gourd': [f'/images/products/produce/fresh_bitter_gourd_{i}.jpg' for i in range(1, 9)],
    'potato': ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'],
    'onion': ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800'],
    'brinjal': ['https://images.unsplash.com/photo-1628773822503-930a8ea0852d?w=800'],
    'green_chilli': ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800'],
    'bhindi': ['https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800'],
    'cucumber': ['https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800'],
    'pumpkin': ['https://images.unsplash.com/photo-1506917728037-b6af01a7d403?w=800'],
    'cabbage': ['https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=800'],
    'cauliflower': ['https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=800'],
    'carrot': ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800'],
    'spinach': ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800'],
    'garlic': ['https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800'],
    'ginger': ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800'],
    'pomegranate': ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800'],
    'mango': ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=800'],
    'grapes': ['https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800'],
    'watermelon': ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
    'papaya': ['https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800'],
    'rice': ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
    'wheat': ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800'],
    'dal': ['https://images.unsplash.com/photo-1585994192700-093f18544c05?w=800'],
    'spices': ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'],
    'cardamom': ['https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800'],
    'cloves': ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800'],
    'flowers': ['https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800'],
    'rose': ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'],
    'oil': ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'],
    'ghee': ['https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800'],
    'default_produce': ['https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800']
}

def get_images_for_commodity(c_name):
    c = c_name.lower()
    if 'apple' in c:
        return COMMODITY_IMAGES['fresh_apple']
    if 'banana' in c:
        return COMMODITY_IMAGES['fresh_banana']
    if 'orange' in c or 'mousambi' in c:
        return COMMODITY_IMAGES['fresh_orange']
    if 'tomato' in c:
        return COMMODITY_IMAGES['fresh_tomato']
    if 'capsicum' in c:
        return COMMODITY_IMAGES['fresh_capsicum']
    if 'bitter gourd' in c or 'karela' in c:
        return COMMODITY_IMAGES['fresh_bitter_gourd']
    if 'potato' in c:
        return COMMODITY_IMAGES['potato']
    if 'onion' in c:
        return COMMODITY_IMAGES['onion']
    if 'brinjal' in c:
        return COMMODITY_IMAGES['brinjal']
    if 'green chilli' in c:
        return COMMODITY_IMAGES['green_chilli']
    if 'bhindi' in c or 'finger' in c:
        return COMMODITY_IMAGES['bhindi']
    if 'cucumbar' in c or 'kheera' in c:
        return COMMODITY_IMAGES['cucumber']
    if 'pumpkin' in c:
        return COMMODITY_IMAGES['pumpkin']
    if 'cabbage' in c:
        return COMMODITY_IMAGES['cabbage']
    if 'cauliflower' in c:
        return COMMODITY_IMAGES['cauliflower']
    if 'carrot' in c:
        return COMMODITY_IMAGES['carrot']
    if 'spinach' in c or 'palak' in c:
        return COMMODITY_IMAGES['spinach']
    if 'garlic' in c:
        return COMMODITY_IMAGES['garlic']
    if 'ginger' in c:
        return COMMODITY_IMAGES['ginger']
    if 'pomegranate' in c:
        return COMMODITY_IMAGES['pomegranate']
    if 'mango' in c:
        return COMMODITY_IMAGES['mango']
    if 'grapes' in c:
        return COMMODITY_IMAGES['grapes']
    if 'watermelon' in c or 'water melon' in c:
        return COMMODITY_IMAGES['watermelon']
    if 'papaya' in c:
        return COMMODITY_IMAGES['papaya']
    if 'rice' in c or 'paddy' in c:
        return COMMODITY_IMAGES['rice']
    if 'wheat' in c:
        return COMMODITY_IMAGES['wheat']
    if 'dal' in c or 'gram' in c or 'lentil' in c:
        return COMMODITY_IMAGES['dal']
    if 'cardamom' in c:
        return COMMODITY_IMAGES['cardamom']
    if 'clove' in c:
        return COMMODITY_IMAGES['cloves']
    if 'rose' in c:
        return COMMODITY_IMAGES['rose']
    if any(k in c for k in ['flower', 'carnation', 'lilly', 'lotus', 'orchid', 'jaffri']):
        return COMMODITY_IMAGES['flowers']
    if 'oil' in c:
        return COMMODITY_IMAGES['oil']
    if 'ghee' in c:
        return COMMODITY_IMAGES['ghee']
    if any(k in c for k in ['jeera', 'cummin', 'pepper', 'turmeric', 'corriander', 'methi', 'soanf']):
        return COMMODITY_IMAGES['spices']
        
    return COMMODITY_IMAGES['default_produce']

def calculate_consumer_price(commodity_name, modal_price):
    c = commodity_name.lower()
    
    # Flowers are per stem / piece
    if any(k in c for k in ['rose', 'carnation', 'tube rose', 'gladiolus', 'jaffri', 'jarbara', 'lilly', 'lotus', 'orchid', 'patti calcutta', 'raibel']):
        raw_price = max(float(modal_price) * 8.0, 15.0)
        price = round(raw_price, 0)
        mrp = round(price * 1.25, 0)
        return price, mrp, '1 Bunch / 10 Stems'
        
    # High-value spices (priced per kg or 250g in dataset)
    if 'cardamom' in c:
        # e.g. modal ~110000/quintal = 1100/kg
        price = 280.0 # 250g pack
        mrp = 350.0
        return price, mrp, '250 g'
    if 'clove' in c:
        price = 195.0 # 250g pack
        mrp = 250.0
        return price, mrp, '250 g'
    if 'jeera' in c or 'cummin' in c:
        price = 145.0 # 250g pack
        mrp = 180.0
        return price, mrp, '250 g'
    if 'black pepper' in c or 'pepper' in c:
        price = 135.0 # 250g pack
        mrp = 170.0
        return price, mrp, '250 g'
        
    # General conversion from quintal (100kg) to consumer kg
    # In dataset modal price is ₹/quintal. So price per kg = modal / 100.
    # Add retail markup for sorting, packaging, transport
    if modal_price and modal_price > 0:
        base_kg = float(modal_price) / 100.0
        # If price per kg is too low (e.g. wholesale raw), set reasonable floor
        if base_kg < 15:
            base_kg = max(base_kg * 1.5, 25.0)
        elif base_kg > 400:
            base_kg = min(base_kg, 350.0)
            
        price = round(base_kg * 1.15, 0) # consumer price
        mrp = round(price * random.choice([1.15, 1.20, 1.25, 1.30]), 0)
        return price, mrp, '1 kg'
    else:
        return 49.0, 65.0, '1 kg'

def main():
    print("=== NovaCart Dataset Ingestion ===")
    
    # 1. Connect to Database
    conn = psycopg2.connect(
        dbname="novacart",
        user="postgres",
        password="test@123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()
    
    # 2. Get existing product names (lowercase) to strictly prevent duplicates
    cur.execute("SELECT LOWER(TRIM(name)) FROM products;")
    existing_product_names = set(r[0] for r in cur.fetchall())
    print(f"Loaded {len(existing_product_names)} existing products to check for duplicates.")
    
    # 3. Get existing sellers
    cur.execute("SELECT id FROM sellers;")
    sellers = [r[0] for r in cur.fetchall()]
    if not sellers:
        sellers = [1]
    print(f"Available seller IDs: {sellers}")
    
    now = datetime.datetime.now()
    
    # 4. Extract Images from archivezip3.zip
    zip3_path = "/Users/Tarfeen/Downloads/archivezip3.zip"
    target_dirs = [
        "frontend/public/images/products/produce",
        "novacart-admin/public/images/products/produce"
    ]
    extract_produce_images(zip3_path, target_dirs)
    
    # 5. Extract & Ingest BigBasket Products from archivezip1.zip
    print("\n--- Processing Dataset 1: archivezip1.zip (BigBasket) ---")
    with open('/Users/Tarfeen/Downloads/archivezip1.zip', 'r', encoding='utf-8') as f:
        nb1 = json.load(f)
        
    bb_products = []
    for cell in nb1['cells']:
        for out in cell.get('outputs', []):
            if 'data' in out and 'text/html' in out['data']:
                html = ''.join(out['data']['text/html'])
                if '<table' in html:
                    import io
                    try:
                        dfs = pd.read_html(io.StringIO(html))
                        for df in dfs:
                            if 'product' in df.columns:
                                for _, r in df.iterrows():
                                    p_name = str(r.get('product', '')).strip()
                                    if p_name and p_name != '...':
                                        bb_products.append(r.to_dict())
                    except Exception as e:
                        pass
                        
    # Deduplicate within BigBasket extracted items
    bb_unique = {}
    for p in bb_products:
        name = str(p.get('product', '')).strip()
        if name and name not in bb_unique:
            bb_unique[name] = p
            
    print(f"Found {len(bb_unique)} products in archivezip1 outputs.")
    
    # Category mapping for BigBasket products
    bb_category_map = {
        'Beauty & Hygiene': 8,          # Beauty & Personal Care
        'Kitchen, Garden & Pets': 7,    # Home & Kitchen
        'Cleaning & Household': 15,     # Cleaning & Household Essentials
        'Gourmet & World Food': 14,     # Snacks & Beverages
        'Foodgrains, Oil & Masala': 17, # Spices & Masalas
        'Beverages': 14                 # Snacks & Beverages
    }
    
    bb_images_map = {
        'Water Bottle - Orange': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
        'Brass Angle Deep - Plain, No.2': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
        'Cereal Flip Lid Container/Storage Jar - Assort...': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
        'Creme Soft Soap - For Hands & Body': 'https://images.unsplash.com/photo-1608248597359-58b211d2797e?w=800',
        'Germ - Removal Multipurpose Wipes': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800',
        'Wheat Grass Powder - Raw': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        'Dove Plastic Soap Case - Assorted Colour': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
        'Organic Powder - Garam Masala': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
        'Wottagirl! Perfume Spray - Heaven, Classic': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800',
        'Rosemary': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800',
        'Green Tea - Pure Original': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',
        'United Dreams Go Far Deodorant': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800',
        'Scrub Pad - Anti- Bacterial, Regular': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800',
        'Face Wash - Oil Control, Active': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
        'Just Spray - Mosquito Repellent Room Spray': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800'
    }
    
    imported_bb_count = 0
    for name, item in bb_unique.items():
        if name.lower() in existing_product_names:
            print(f"Skipping duplicate BigBasket product: '{name}'")
            continue
            
        brand = str(item.get('brand', 'NovaCart Essentials'))
        sale_price = float(item.get('sale_price', 99.0))
        mkt_price = float(item.get('market_price', sale_price * 1.15))
        discount = round(((mkt_price - sale_price) / mkt_price * 100.0), 1) if mkt_price > sale_price else 0.0
        rating = float(item.get('rating', 4.2)) if pd.notna(item.get('rating')) else 4.2
        desc = str(item.get('description', f'Premium quality {name} by {brand}.'))
        cat_str = str(item.get('category', 'Cleaning & Household'))
        cat_id = bb_category_map.get(cat_str, 1)
        sub_cat = str(item.get('sub_category', 'General'))
        
        spec = f"Brand: {brand}\nCategory: {cat_str}\nSub-Category: {sub_cat}\nType: {item.get('type', 'Standard')}"
        seller_id = random.choice(sellers)
        
        # Insert product
        cur.execute(
            """
            INSERT INTO products (name, description, specifications, brand, color, size, price, discount_percent,
                                  average_rating, review_count, active, category_id, seller_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (name[:255], desc[:4000], spec[:4000], brand[:100], "Standard", "Standard", sale_price, discount, rating, random.randint(25, 450), True, cat_id, seller_id, now, now)
        )
        prod_id = cur.fetchone()[0]
        
        # Insert Image
        img_url = bb_images_map.get(name, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800')
        cur.execute(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);",
            (prod_id, img_url, 0)
        )
        
        # Insert Inventory
        cur.execute(
            "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);",
            (prod_id, random.randint(30, 200), 5)
        )
        
        existing_product_names.add(name.lower())
        imported_bb_count += 1
        
    print(f"Successfully imported {imported_bb_count} products from BigBasket dataset.")
    
    # 6. Extract & Ingest Agricultural & Grocery Commodities from archivezip2.zip
    print("\n--- Processing Dataset 2: archivezip2.zip (Commodities & Daily Prices) ---")
    with open('/Users/Tarfeen/Downloads/archivezip2.zip', 'r', encoding='utf-8') as f:
        nb2 = json.load(f)
        
    # Extract all commodities and counts
    commodity_counts = {}
    for out in nb2['cells'][21]['outputs']:
        for k, v in out.get('data', {}).items():
            s = ''.join(v) if isinstance(v, list) else str(v)
            if 'labels' in s:
                m_labels = re.search(r'\"labels\":(\[.*?\])', s)
                m_vals = re.search(r'\"values\":(\[.*?\])', s)
                if m_labels and m_vals:
                    labels = json.loads(m_labels.group(1))
                    vals = json.loads(m_vals.group(1))
                    for l, count in zip(labels, vals):
                        commodity_counts[l] = count
                        
    print(f"Extracted {len(commodity_counts)} commodities from archivezip2.")
    
    # Extract prices table from Cell 28
    commodity_prices = {}
    for out in nb2['cells'][28]['outputs']:
        if 'data' in out and 'text/html' in out['data']:
            html = ''.join(out['data']['text/html'])
            if '<table' in html:
                import io
                try:
                    dfs = pd.read_html(io.StringIO(html))
                    for df in dfs:
                        if 'Commodity' in df.columns:
                            for _, r in df.iterrows():
                                c_name = str(r['Commodity']).strip()
                                modal_p = float(r.get('Modal Price', 3000.0))
                                commodity_prices[c_name] = modal_p
                except Exception:
                    pass
                    
    # Ingest commodities into NovaCart
    imported_commodities_count = 0
    skipped_count = 0
    
    for comm_name, count in commodity_counts.items():
        # Title clean up
        display_name = f"Fresh {comm_name} - Premium Mandi Harvest"
        
        # Check if already in database
        if display_name.lower() in existing_product_names or comm_name.lower() in existing_product_names:
            skipped_count += 1
            continue
            
        cat_id = get_commodity_category(comm_name)
        modal_price = commodity_prices.get(comm_name, 3500.0)
        price, mrp, unit_str = calculate_consumer_price(comm_name, modal_price)
        discount = round(((mrp - price) / mrp * 100.0), 1) if mrp > price else 0.0
        
        brand = "Kisan Mandi Direct" if cat_id in [142, 143] else ("Organic Harvest" if cat_id in [12, 17] else "Bloom & Fresh")
        rating = round(random.uniform(4.2, 4.9), 1)
        review_count = random.randint(15, 380)
        
        desc = (
            f"Farm fresh {comm_name} sourced directly from local agricultural mandis. "
            f"Carefully graded for optimum freshness, vibrant flavor, and premium quality. "
            f"Perfect for daily home culinary use and healthy nutrition."
        )
        spec = (
            f"Commodity: {comm_name}\n"
            f"Net Quantity: {unit_str}\n"
            f"Harvest Source: Certified Mandi Direct\n"
            f"Quality Grade: A Grade / FAQ\n"
            f"Storage: Keep in a cool, dry place."
        )
        
        images = get_images_for_commodity(comm_name)
        seller_id = random.choice(sellers)
        
        cur.execute(
            """
            INSERT INTO products (name, description, specifications, brand, color, size, price, discount_percent,
                                  average_rating, review_count, active, category_id, seller_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (display_name[:255], desc[:4000], spec[:4000], brand[:100], "Natural", unit_str[:100], price, discount, rating, review_count, True, cat_id, seller_id, now, now)
        )
        prod_id = cur.fetchone()[0]
        
        # Insert Images (up to 3 images per product)
        for order_idx, img_url in enumerate(images[:3]):
            cur.execute(
                "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);",
                (prod_id, img_url, order_idx)
            )
            
        # Insert Inventory
        cur.execute(
            "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);",
            (prod_id, random.randint(40, 250), 10)
        )
        
        existing_product_names.add(display_name.lower())
        imported_commodities_count += 1
        
    # Also add variety variants for key staple items with images
    staple_varieties = [
        ("Fresh Apple - Royal Gala Crisp", 142, "Royal Gala Apple from Himachal orchards. Crisp, sweet and juicy.", COMMODITY_IMAGES['fresh_apple'], 159.0, 199.0, "1 kg", "Himachal Orchards"),
        ("Fresh Banana - Robusta Golden", 142, "Naturally ripened Robusta bananas rich in potassium and energy.", COMMODITY_IMAGES['fresh_banana'], 55.0, 70.0, "1 kg (4-6 Pcs)", "Green Fields"),
        ("Fresh Orange - Nagpur Mandarin", 142, "Sweet and tangy Nagpur mandarins bursting with Vitamin C.", COMMODITY_IMAGES['fresh_orange'], 89.0, 110.0, "1 kg", "Nagpur Mandi"),
        ("Fresh Tomato - Desi Farm Pick", 143, "Juicy red desi tomatoes with rich tangy flavor for curries and salads.", COMMODITY_IMAGES['fresh_tomato'], 38.0, 48.0, "1 kg", "Farm Fresh"),
        ("Fresh Capsicum - Crisp Green Bell Pepper", 143, "Crispy, glossy bell peppers packed with vitamins.", COMMODITY_IMAGES['fresh_capsicum'], 65.0, 85.0, "500 g", "Valley Fresh"),
        ("Fresh Bitter Gourd (Karela) - Tender Green", 143, "Tender farm-picked bitter gourds known for health and detox benefits.", COMMODITY_IMAGES['fresh_bitter_gourd'], 45.0, 60.0, "500 g", "Kisan Direct"),
        ("Desi Cardamoms (Green Elaichi) - Extra Bold", 17, "Aromatic whole green cardamom pods from the hills of Idukki.", [COMMODITY_IMAGES['cardamom'][0]], 299.0, 380.0, "100 g", "Kerala Spices"),
        ("Whole Cloves (Laung) - Premium Aromatic", 17, "Handpicked premium aromatic whole cloves.", [COMMODITY_IMAGES['cloves'][0]], 185.0, 230.0, "100 g", "Malabar Spices"),
        ("Cummin Seed (Jeera) - Unpolished Fragrant", 17, "Pure unpolished cumin seeds with essential oils intact.", [COMMODITY_IMAGES['spices'][0]], 140.0, 175.0, "250 g", "Pure Roots")
    ]
    
    variety_count = 0
    for name, cat_id, desc, imgs, price, mrp, unit_str, brand in staple_varieties:
        if name.lower() in existing_product_names:
            continue
        discount = round(((mrp - price) / mrp * 100.0), 1)
        cur.execute(
            """
            INSERT INTO products (name, description, specifications, brand, color, size, price, discount_percent,
                                  average_rating, review_count, active, category_id, seller_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (name, desc, f"Origin: Mandi Certified\nNet Quantity: {unit_str}\nQuality: Premium Grade A", brand, "Natural", unit_str, price, discount, 4.8, 120, True, cat_id, random.choice(sellers), now, now)
        )
        prod_id = cur.fetchone()[0]
        for idx, img in enumerate(imgs[:3]):
            cur.execute("INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);", (prod_id, img, idx))
        cur.execute("INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);", (prod_id, 150, 10))
        existing_product_names.add(name.lower())
        variety_count += 1
        
    conn.commit()
    cur.close()
    conn.close()
    
    print("\n================ IMPORT SUMMARY ================")
    print(f"BigBasket Products Imported: {imported_bb_count}")
    print(f"Indian Commodities Imported: {imported_commodities_count}")
    print(f"Staple Variety Products Added: {variety_count}")
    print(f"Total New Unique Products Ingested: {imported_bb_count + imported_commodities_count + variety_count}")
    print(f"Duplicates / Existing Products Skipped: {skipped_count}")
    print("Database transaction committed successfully!")

if __name__ == '__main__':
    main()
