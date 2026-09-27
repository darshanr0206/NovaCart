import os
import re
import random
import json
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

# 11 Canonical Root Categories
CATEGORIES_DEF = [
    {
        'id': 1,
        'name': 'Groceries & Household Essentials',
        'slug': 'groceries-household',
        'icon_url': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        'description': 'Daily groceries, fresh staples, dairy, beverages, and home essentials',
        'subcategories': [
            ('Atta, Rice, Oil & Dals', 'atta-rice-oil-dals', 'Flours, organic grains, basmati rice, lentils, and cooking oils'),
            ('Dairy, Bread & Eggs', 'dairy-bread-eggs', 'Fresh milk, artisanal breads, butter, paneer, cheese, and farm eggs'),
            ('Snacks & Beverages', 'snacks-beverages', 'Crispy snacks, tea, premium coffee, fruit juices, and cold drinks'),
            ('Cleaning & Household Essentials', 'cleaning-household', 'Detergents, floor cleaners, dishwash liquids, and paper towels'),
            ('Personal Hygiene', 'personal-hygiene', 'Soaps, handwashes, sanitary care, and oral hygiene products'),
            ('Spices & Masalas', 'spices-dry-fruits', 'Whole spices, blended masalas, premium dry fruits, and nuts'),
            ('Breakfast & Sauces', 'breakfast-sauces', 'Cereals, jams, peanut butter, honey, ketchups, and spreads'),
            ('Packaged & Instant Foods', 'packaged-foods', 'Noodles, pasta, ready-to-eat meals, soups, and baking mixes')
        ]
    },
    {
        'id': 2,
        'name': 'Mobiles',
        'slug': 'mobiles',
        'icon_url': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
        'description': 'Flagship smartphones, 5G mobiles, budget phones, and mobile accessories',
        'subcategories': [
            ('Smartphones', 'smartphones', 'High performance 5G & 4G smartphones from top brands'),
            ('Flagship Phones', 'flagship-mobiles', 'Premium flagship smartphones with cutting-edge camera & processor'),
            ('Budget Phones', 'budget-smartphones', 'Feature-packed affordable everyday smartphones'),
            ('Cases & Covers', 'cases-covers', 'Protective phone covers, rugged cases, and designer skins'),
            ('Chargers & Cables', 'chargers-cables', 'Fast chargers, USB-C cables, wireless pads, and adapters'),
            ('Power Banks', 'power-banks', 'High capacity fast charging portable power banks'),
            ('Mobile Accessories', 'mobile-accessories', 'Screen protectors, phone mounts, selfie sticks, and OTG adapters')
        ]
    },
    {
        'id': 3,
        'name': 'Electronics',
        'slug': 'electronics',
        'icon_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'description': 'Laptops, headphones, smartwatches, cameras, TVs, and audio gear',
        'subcategories': [
            ('Laptops & Computers', 'laptops', 'Gaming laptops, ultra-books, MacBooks, and work computers'),
            ('Headphones & Earbuds', 'headphones', 'Noise-cancelling wireless headphones, earbuds, and headsets'),
            ('Smartwatches', 'smartwatches', 'Fitness trackers, AMOLED smartwatches, and luxury wearables'),
            ('Cameras & Photography', 'cameras', 'DSLRs, mirrorless cameras, vlogging lenses, and tripods'),
            ('Televisions & Home Audio', 'tvs', '4K Smart OLED/QLED TVs, home theater systems, and soundbars'),
            ('Speakers & Soundbars', 'speakers', 'Bluetooth portable speakers, party sound systems, and studio monitors'),
            ('Tablets & iPads', 'tablets', 'iPads, Android graphics tablets, and e-readers'),
            ('Computer Accessories', 'computer-accessories', 'Keyboards, gaming mice, monitors, hubs, and webcams')
        ]
    },
    {
        'id': 4,
        'name': 'Clothing & Fashion',
        'slug': 'fashion',
        'icon_url': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
        'description': "Trendy men's and women's apparel, ethnic wear, dresses, and western wear",
        'subcategories': [
            ("Men's T-Shirts & Polos", 'mens-tshirts', "Casual crew necks, graphic tees, polo t-shirts, and oversized tops"),
            ("Men's Shirts", 'mens-shirts', "Formal office shirts, casual linen shirts, and denim shirts"),
            ("Men's Jeans & Trousers", 'mens-jeans', "Slim fit denim, chinos, track pants, and cargo trousers"),
            ("Women's Ethnic & Sarees", 'traditional-wear', "Silk sarees, designer kurtis, lehengas, and anarkali sets"),
            ("Women's Western & Dresses", 'womens-fashion', "Maxi dresses, tops, denim jeans, blazers, and skirts"),
            ("Kids Fashion", 'kids-fashion', "Comfortable cotton clothes, sets, and party outfits for boys and girls"),
            ("Jackets & Hoodies", 'jackets-hoodies', "Winter jackets, leather jackets, bomber jackets, and cozy hoodies"),
            ("Innerwear & Sleepwear", 'innerwear-sleepwear', "Comfortable lounge wear, sleepwear, vests, and briefs"),
            ("Handbags & Clutches", 'handbags-clutches', "Tote bags, crossbody bags, leather wallets, and clutches"),
            ("Watches & Accessories", 'watches-accessories', "Classic analog watches, sunglasses, belts, and ties")
        ]
    },
    {
        'id': 5,
        'name': 'Shoes & Footwear',
        'slug': 'shoes-footwear',
        'icon_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        'description': "Men's and women's sports shoes, casual sneakers, formal shoes, and sandals",
        'subcategories': [
            ("Men's Sports Shoes", 'sports-shoes', "Running shoes, training footwear, gym sneakers, and cleats"),
            ("Men's Casual Sneakers", 'mens-shoes', "Everyday lifestyle sneakers, high-tops, and canvas shoes"),
            ("Men's Formal Shoes", 'mens-formal-shoes', "Leather oxfords, derbys, monk straps, and formal loafers"),
            ("Women's Flats & Heels", 'womens-shoes', "Block heels, stilettos, ballerina flats, and ethnic juttis"),
            ("Women's Sandals & Wedges", 'womens-sandals', "Comfortable open sandals, wedge heels, and gladiator flats"),
            ("Sandals & Slippers", 'sandals-slippers', "Casual flip-flops, slide sandals, and indoor house slippers")
        ]
    },
    {
        'id': 6,
        'name': 'Books & Stationery',
        'slug': 'books-stationery',
        'icon_url': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
        'description': 'Bestselling novels, self-help, business, academic books, and school supplies',
        'subcategories': [
            ('Fiction & Literature', 'fiction', 'Novels, thrillers, fantasy, romance, and mystery bestsellers'),
            ('Self-Help & Personal Growth', 'self-help', 'Mindset, productivity, personal growth, and leadership guides'),
            ('Business & Finance', 'business-finance', 'Investing, wealth creation, entrepreneurship, and economics'),
            ('Academic & Reference', 'academic-reference', 'Competitive exam guides, engineering, medical, and science books'),
            ("Children's Books", 'children-books', 'Fairy tales, activity books, early learning, and illustrated stories'),
            ('Stationery & Pens', 'stationery', 'Executive rollerball pens, notebooks, sketch pads, and desk accessories'),
            ('School Bags & Supplies', 'school-bags', 'Ergonomic backpacks, geometry boxes, pencil cases, and craft kits')
        ]
    },
    {
        'id': 7,
        'name': 'Home & Kitchen',
        'slug': 'home-kitchen',
        'icon_url': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
        'description': 'Cookware, kitchen appliances, refrigerators, storage, and home tools',
        'subcategories': [
            ('Cookware & Non-Stick', 'cookware', 'Pressure cookers, fry pans, granite non-stick sets, and kadhais'),
            ('Kitchen Appliances', 'kitchen-appliances', 'Mixer grinders, air fryers, microwaves, kettles, and toasters'),
            ('Refrigerators & Freezers', 'refrigerators', 'Single door, double door, and frost-free smart refrigerators'),
            ('Storage & Organisation', 'storage-organisation', 'Airtight container sets, spice racks, and pantry organizers'),
            ('Dinnerware & Cutlery', 'dinnerware', 'Ceramic dinner sets, glassware, stainless steel cutlery, and mugs'),
            ('Bedding & Pillows', 'bedding-pillows', 'Cotton bedsheets, microfiber pillows, comforters, and blankets'),
            ('Home Improvement & Tools', 'home-improvement', 'Power drills, tool kits, bathroom fixtures, and hardware essentials')
        ]
    },
    {
        'id': 8,
        'name': 'Beauty & Personal Care',
        'slug': 'beauty-personal-care',
        'icon_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
        'description': 'Skincare, haircare, makeup, fragrances, bath & body, and grooming',
        'subcategories': [
            ('Face Care & Serums', 'skincare', 'Hydrating serums, face creams, anti-aging solutions, and night gels'),
            ('Cleansers & Face Wash', 'cleansers', 'Gentle foaming face washes, scrubs, micellar water, and toners'),
            ('Hair Care & Shampoos', 'haircare', 'Nourishing shampoos, keratin conditioners, hair oils, and masks'),
            ('Makeup & Cosmetics', 'makeup', 'Liquid foundations, concealers, matte lipsticks, kajal, and palettes'),
            ('Fragrances & Perfumes', 'fragrances', 'Luxury Eau de Parfum, long-lasting body mists, and deos'),
            ("Men's Grooming", 'mens-grooming', 'Beard oils, shaving foams, trimmers, aftershaves, and face washes'),
            ('Bath & Body', 'bath-body', 'Shower gels, body yogurts, deep moisturizing body lotions, and scrubs')
        ]
    },
    {
        'id': 9,
        'name': 'Furniture & Home Decor',
        'slug': 'furniture-home-decor',
        'icon_url': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
        'description': 'Sofas, study tables, beds, wall decor, ambient lamps, and furnishings',
        'subcategories': [
            ('Sofas & Seating', 'seating-sofas', 'L-shaped sofas, velvet recliners, armchairs, and bean bags'),
            ('Tables & Desks', 'tables-chairs', 'Solid wood study desks, coffee tables, dining sets, and ergonomic chairs'),
            ('Beds & Mattresses', 'beds-mattresses', 'Queen & King size wooden beds, memory foam mattresses, and storage beds'),
            ('Home Decor & Wall Art', 'home-decor-items', 'Framed canvas paintings, wooden wall clocks, brass showpieces, and mirrors'),
            ('Lighting & Lamps', 'lighting', 'Modern pendant ceiling lights, table lamps, floor lamps, and fairy lights'),
            ('Curtains & Rugs', 'curtains-rugs', 'Blackout door curtains, bohemian area rugs, door mats, and cushion covers')
        ]
    },
    {
        'id': 10,
        'name': 'Toys & Kids',
        'slug': 'toys-kids',
        'icon_url': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
        'description': 'Educational toys, action figures, board games, baby care, and outdoor toys',
        'subcategories': [
            ('Action Figures & Dolls', 'action-figures', 'Superheroes, anime figures, fashion dolls, and playsets'),
            ('Board Games & Puzzles', 'board-games', 'Strategy board games, Monopoly, Chess, and jigsaw puzzles'),
            ('Educational & STEM Toys', 'learning-toys', 'Science experiment kits, robotics sets, building blocks, and flashcards'),
            ('Remote Control Toys', 'rc-toys', 'RC cars, stunt drones, helicopters, and racing tracks'),
            ('Baby Toys & Toddlers', 'baby-toys', 'Rattles, soft plush toys, musical activity centers, and teethers'),
            ('Baby Care & Essentials', 'baby-care', 'Baby diapers, wipes, feeding bottles, gentle lotions, and baby strollers')
        ]
    },
    {
        'id': 11,
        'name': 'Sports & Fitness',
        'slug': 'sports-fitness',
        'icon_url': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
        'description': 'Cricket bats, footballs, badminton, gym weights, yoga mats, and sports gear',
        'subcategories': [
            ('Cricket Equipment', 'cricket-gear', 'English willow bats, leather balls, batting pads, gloves, and kit bags'),
            ('Football & Team Sports', 'football-sports', 'Match footballs, goalkeeper gloves, shin guards, and basketballs'),
            ('Badminton & Tennis', 'badminton-sports', 'Graphite badminton racquets, nylon/feather shuttles, tennis racquets, and grips'),
            ('Gym & Strength Training', 'gym-fitness', 'Hex dumbbells, kettlebells, Olympic barbell plates, and weight benches'),
            ('Resistance & Core Fitness', 'resistance-fitness', 'Loop resistance bands, ab rollers, push-up bars, and skipping ropes'),
            ('Yoga & Meditation', 'yoga-meditation', 'Eco-friendly non-slip yoga mats, yoga blocks, straps, and meditation cushions'),
            ('Sports Accessories', 'sports-accessories', 'Gym shaker bottles, wrist wraps, knee braces, gym gloves, and duffle bags')
        ]
    }
]

SELLER_MAP = {
    1: 3,  # Groceries -> Home Essentials
    2: 1,  # Mobiles -> NovaTech Retail
    3: 1,  # Electronics -> NovaTech Retail
    4: 4,  # Fashion -> FashionHub India
    5: 4,  # Shoes -> FashionHub India
    6: 2,  # Books -> Lifestyle Co.
    7: 3,  # Home & Kitchen -> Home Essentials
    8: 4,  # Beauty -> FashionHub India
    9: 3,  # Furniture -> Home Essentials
    10: 2, # Toys & Kids -> Lifestyle Co.
    11: 2  # Sports -> Lifestyle Co.
}

AUTOMOTIVE_KEYWORDS = [
    'speedwav', 'car ', 'cars ', 'bike ', 'bikes ', 'motorbike', 'bicycle', 'cycle',
    'tyre', 'tire', 'rear view mirror', 'wiper blade', 'car cover', 'bike cover',
    'helmet', 'car perfume', 'automotive', 'brake pad', 'exhaust', 'clutch plate',
    'chain lube', 'handlebar', 'spark plug', 'motorcycle', 'horn for bajaj', 'bajaj pulsar',
    'royal enfield', 'ktm duke', 'hero honda', 'yamaha r15', 'scooter'
]

# Sport and Book high-res fallback image pools by sub-type
BOOK_COVERS = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e37b29?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80'
]

SPORTS_IMAGES_MAP = {
    'cricket': [
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&auto=format&fit=crop&q=80'
    ],
    'football': [
        'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80'
    ],
    'badminton': [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1613918431703-aa503e913a52?w=800&auto=format&fit=crop&q=80'
    ],
    'gym': [
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'
    ],
    'yoga': [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80'
    ],
    'default': [
        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
    ]
}

def get_sports_image(title):
    t = title.lower()
    if 'cricket' in t or 'bat' in t or 'ball' in t or 'wicket' in t or 'pad' in t or 'glove' in t:
        return random.choice(SPORTS_IMAGES_MAP['cricket'])
    elif 'football' in t or 'soccer' in t or 'goal' in t:
        return random.choice(SPORTS_IMAGES_MAP['football'])
    elif 'badminton' in t or 'racket' in t or 'racquet' in t or 'shuttle' in t or 'tennis' in t:
        return random.choice(SPORTS_IMAGES_MAP['badminton'])
    elif 'yoga' in t or 'mat' in t or 'meditation' in t:
        return random.choice(SPORTS_IMAGES_MAP['yoga'])
    elif 'gym' in t or 'dumbbell' in t or 'barbell' in t or 'weight' in t or 'bench' in t or 'band' in t:
        return random.choice(SPORTS_IMAGES_MAP['gym'])
    return random.choice(SPORTS_IMAGES_MAP['default'])

def is_automotive(text):
    if not text:
        return False
    t = str(text).lower()
    return any(k in t for k in AUTOMOTIVE_KEYWORDS)

def clean_price(val, default_val=999.0):
    if val is None or pd.isna(val):
        return default_val
    try:
        s = str(val).replace('₹', '').replace(',', '').replace('Rs.', '').replace('$', '').strip()
        m = re.search(r'(\d+(?:\.\d+)?)', s)
        if m:
            v = float(m.group(1))
            if v > 0:
                return round(v, 2)
    except Exception:
        pass
    return default_val

def clean_rating(val):
    if val is None or pd.isna(val):
        return round(random.uniform(4.0, 4.8), 1)
    try:
        s = str(val).strip()
        m = re.search(r'(\d+(?:\.\d+)?)', s)
        if m:
            v = float(m.group(1))
            if 1.0 <= v <= 5.0:
                return round(v, 1)
    except Exception:
        pass
    return round(random.uniform(4.0, 4.8), 1)

def clean_review_count(val):
    if val is None or pd.isna(val):
        return random.randint(25, 450)
    try:
        s = str(val).replace(',', '').strip()
        m = re.search(r'(\d+)', s)
        if m:
            v = int(m.group(1))
            if v > 0:
                return min(v, 5000)
    except Exception:
        pass
    return random.randint(25, 450)

def clean_url(u):
    if not u or pd.isna(u) or not isinstance(u, str):
        return None
    u = u.strip()
    if u.startswith('http://') or u.startswith('https://'):
        return u.replace('http://', 'https://')
    return None

def normalize_title(name):
    if not name:
        return ""
    name = re.sub(r'[\r\n\t]+', ' ', str(name))
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def init_database(conn, cur):
    print("\n--- 1. Resetting Catalog & Category Structure ---")
    # Truncate old catalog tables
    cur.execute("""
        TRUNCATE TABLE wishlist_items, cart_items, order_items, reviews, 
                       product_images, inventory, products, categories 
        RESTART IDENTITY CASCADE;
    """)
    conn.commit()

    # Category Mapping Lookup: (root_id, sub_slug) -> cat_id
    cat_lookup = {}

    for cat in CATEGORIES_DEF:
        # Insert Root Category
        cur.execute("""
            INSERT INTO categories (id, name, slug, icon_url, description, parent_id)
            VALUES (%s, %s, %s, %s, %s, NULL)
            RETURNING id;
        """, (cat['id'], cat['name'], cat['slug'], cat['icon_url'], cat['description']))
        root_id = cur.fetchone()[0]
        cat_lookup[(root_id, 'root')] = root_id
        cat_lookup[(root_id, cat['slug'])] = root_id

    # Sync sequence to avoid collision with manual IDs 1-11
    cur.execute("SELECT setval('categories_id_seq', 11);")

    for cat in CATEGORIES_DEF:
        root_id = cat['id']
        # Insert Subcategories
        for sub_name, sub_slug, sub_desc in cat['subcategories']:
            cur.execute("""
                INSERT INTO categories (name, slug, icon_url, description, parent_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """, (sub_name, sub_slug, cat['icon_url'], sub_desc, root_id))
            sub_id = cur.fetchone()[0]
            cat_lookup[(root_id, sub_slug)] = sub_id
            cat_lookup[(root_id, sub_name.lower())] = sub_id

    conn.commit()
    print(f"Successfully initialized 11 canonical root categories and {len(cat_lookup)} subcategory mappings.")
    return cat_lookup

def insert_batch(conn, cur, product_batch):
    if not product_batch:
        return 0

    product_sql = """
        INSERT INTO products (
            name, description, specifications, brand, color, size, price, discount_percent,
            average_rating, review_count, category_id, seller_id, active, created_at, updated_at
        ) VALUES (
            %(name)s, %(description)s, %(specifications)s, %(brand)s, %(color)s, %(size)s,
            %(price)s, %(discount_percent)s, %(average_rating)s, %(review_count)s,
            %(category_id)s, %(seller_id)s, true, NOW(), NOW()
        ) RETURNING id;
    """
    img_sql = "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);"
    inv_sql = "INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES (%s, %s, %s);"

    inserted = 0
    for p in product_batch:
        try:
            cur.execute(product_sql, p)
            pid = cur.fetchone()[0]

            # Product images
            images = p.get('images', [])
            if not images:
                images = [CATEGORIES_DEF[p['category_id'] - 1]['icon_url']]
            for idx, img in enumerate(images[:4]):
                cur.execute(img_sql, (pid, img[:300], idx))

            # Stock quantity
            stock = random.randint(30, 150)
            cur.execute(inv_sql, (pid, stock, 10))
            inserted += 1
        except Exception as e:
            # Skip invalid rows
            pass

    conn.commit()
    return inserted

def run_ingestion():
    print("=" * 80)
    print("NOVACART COMPLETE PRODUCT CATALOG NORMALIZATION & INGESTION")
    print("=" * 80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cat_lookup = init_database(conn, cur)
    seen_titles = set()
    total_imported = 0

    # -------------------------------------------------------------
    # 1. GROCERIES & HOUSEHOLD ESSENTIALS (Zepto dataset)
    # -------------------------------------------------------------
    print("\n--- Ingesting Groceries & Household Essentials (Zepto Dataset) ---")
    zepto_path = 'data/datasets/dataset_11/zepto dataset.xlsx'
    if os.path.exists(zepto_path):
        df = pd.read_excel(zepto_path)
        batch = []
        for _, row in df.iterrows():
            name = normalize_title(row.get('Name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('Price'), 149.0)
            orig_price = clean_price(row.get('Original Price'), price * 1.15)
            discount = round(max(0, (orig_price - price) / orig_price * 100), 1) if orig_price > price else 0

            img = clean_url(row.get('Image'))
            images = [img] if img else [CATEGORIES_DEF[0]['icon_url']]

            # Subcategory routing
            sub_cat_str = str(row.get('Sub-Category', '')).lower()
            cat_str = str(row.get('Category', '')).lower()
            comb = sub_cat_str + ' ' + cat_str

            if any(k in comb for k in ['atta', 'rice', 'oil', 'dal', 'flour', 'grain', 'lentil']):
                sub_id = cat_lookup.get((1, 'atta-rice-oil-dals'), 1)
            elif any(k in comb for k in ['dairy', 'bread', 'egg', 'milk', 'cheese', 'butter', 'paneer']):
                sub_id = cat_lookup.get((1, 'dairy-bread-eggs'), 1)
            elif any(k in comb for k in ['snack', 'munchies', 'biscuit', 'tea', 'coffee', 'beverage', 'drink', 'juice']):
                sub_id = cat_lookup.get((1, 'snacks-beverages'), 1)
            elif any(k in comb for k in ['clean', 'detergent', 'wash', 'dish', 'paper', 'pooja']):
                sub_id = cat_lookup.get((1, 'cleaning-household'), 1)
            elif any(k in comb for k in ['hygiene', 'bath', 'soap', 'shave', 'oral', 'body']):
                sub_id = cat_lookup.get((1, 'personal-hygiene'), 1)
            elif any(k in comb for k in ['masala', 'spice', 'dry fruit', 'nut', 'salt', 'sugar']):
                sub_id = cat_lookup.get((1, 'spices-dry-fruits'), 1)
            elif any(k in comb for k in ['breakfast', 'sauce', 'jam', 'spread', 'ketchup', 'honey']):
                sub_id = cat_lookup.get((1, 'breakfast-sauces'), 1)
            else:
                sub_id = cat_lookup.get((1, 'packaged-foods'), 1)

            specs = {
                'Quantity': str(row.get('Quantity', '1 Unit')),
                'Category': 'Groceries & Household',
                'Dietary Preference': 'Vegetarian' if 'non veg' not in name.lower() else 'Non-Vegetarian',
                'Country of Origin': 'India',
                'Shelf Life': '6 Months'
            }

            batch.append({
                'name': name[:250],
                'description': f"Fresh, premium quality {name}. Sourced directly from trusted suppliers and delivered fresh with express NovaCart delivery.",
                'specifications': json.dumps(specs),
                'brand': str(row.get('Category', 'NovaDaily')).split('&')[0].strip()[:50],
                'color': None,
                'size': str(row.get('Quantity', 'Standard'))[:30],
                'price': price,
                'discount_percent': discount,
                'average_rating': clean_rating(row.get('Ratings')),
                'review_count': clean_review_count(row.get('Review')),
                'category_id': sub_id,
                'seller_id': SELLER_MAP[1],
                'images': images
            })

            if len(batch) >= 500:
                inserted = insert_batch(conn, cur, batch)
                total_imported += inserted
                batch = []

        if batch:
            inserted = insert_batch(conn, cur, batch)
            total_imported += inserted
        print(f"Groceries imported. Total so far: {total_imported}")

    # -------------------------------------------------------------
    # 2. MOBILES (Phones dataset + Electronics phones)
    # -------------------------------------------------------------
    print("\n--- Ingesting Mobiles & Smartphones ---")
    phones_path = 'data/datasets/dataset_9/Phones.csv'
    if os.path.exists(phones_path):
        df_phones = pd.read_csv(phones_path)
        batch = []
        for _, row in df_phones.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 15999.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[1]['icon_url']]

            # Brand detection
            brand = 'NovaMobile'
            for b in ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Realme', 'Vivo', 'Oppo', 'Google', 'Motorola', 'Poco', 'Nothing', 'iQOO', 'Nokia']:
                if b.lower() in name.lower():
                    brand = b
                    break

            # Specs extraction
            ram_match = re.search(r'(\d+)\s*(?:GB|gb)\s*RAM', name, re.IGNORECASE)
            storage_match = re.search(r'(\d+)\s*(?:GB|TB|gb|tb)\s*(?:Storage|ROM|Internal)', name, re.IGNORECASE)
            ram = f"{ram_match.group(1)} GB" if ram_match else ("8 GB" if price > 20000 else "6 GB")
            storage = f"{storage_match.group(1)} GB" if storage_match else ("256 GB" if price > 30000 else "128 GB")

            sub_slug = 'flagship-mobiles' if price > 40000 else ('smartphones' if price > 12000 else 'budget-smartphones')
            if 'case' in name.lower() or 'cover' in name.lower():
                sub_slug = 'cases-covers'
            elif 'charger' in name.lower() or 'cable' in name.lower():
                sub_slug = 'chargers-cables'
            elif 'power bank' in name.lower():
                sub_slug = 'power-banks'

            specs = {
                'Brand': brand,
                'RAM': ram,
                'Storage': storage,
                'Network': '5G Supported' if price > 14000 else '4G VoLTE',
                'Display': '6.7-inch Super AMOLED Display' if price > 25000 else '6.5-inch FHD+ 90Hz Display',
                'Battery': '5000 mAh Fast Charging',
                'Camera': '50MP AI Triple Camera + 16MP Front' if price > 18000 else '48MP AI Dual Camera',
                'Processor': 'Snapdragon Octa-Core Processor' if 'samsung' in brand.lower() or 'oneplus' in brand.lower() else 'MediaTek Dimensity 5G'
            }

            batch.append({
                'name': name[:250],
                'description': f"Experience outstanding performance with the {name}. Featuring {ram} RAM, {storage} internal storage, powerful multi-core processing, and long-lasting 5000mAh battery life with rapid turbo charging.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Midnight Black' if 'black' in name.lower() else ('Starlight Blue' if 'blue' in name.lower() else 'Graphite Grey'),
                'size': storage,
                'price': price,
                'discount_percent': round(random.uniform(5.0, 25.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((2, sub_slug), 2),
                'seller_id': SELLER_MAP[2],
                'images': images
            })

        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Phones imported. Total so far: {total_imported}")

    # -------------------------------------------------------------
    # 3. ELECTRONICS (Cameras, Headphones, Speakers, TVs, Laptops)
    # -------------------------------------------------------------
    print("\n--- Ingesting Electronics Datasets ---")
    elec_files = [
        ('data/datasets/dataset_9/Cameras.csv', 'cameras', 'Cameras & Photography'),
        ('data/datasets/dataset_9/Headphones.csv', 'headphones', 'Headphones & Earbuds'),
        ('data/datasets/dataset_9/Speakers.csv', 'speakers', 'Speakers & Soundbars'),
        ('data/datasets/dataset_9/Televisions.csv', 'tvs', 'Televisions & Home Audio'),
        ('data/datasets/dataset_9/Musical Instruments.csv', 'computer-accessories', 'Musical & Audio Gear'),
        ('data/datasets/dataset_2/electronics_product.csv', 'headphones', 'Electronics & Audio')
    ]

    for fpath, sub_slug, spec_cat in elec_files:
        if not os.path.exists(fpath):
            continue
        df_el = pd.read_csv(fpath)
        batch = []
        for _, row in df_el.iterrows():
            name_col = 'name' if 'name' in row else 'Product_Name'
            name = normalize_title(row.get(name_col))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price_col = 'actual_price' if 'actual_price' in row else ('discount_price' if 'discount_price' in row else 'Price')
            price = clean_price(row.get(price_col), 2499.0)

            img_col = 'image' if 'image' in row else 'Product_URL'
            img = clean_url(row.get(img_col))
            images = [img] if img else [CATEGORIES_DEF[2]['icon_url']]

            brand = 'NovaTech'
            for b in ['Sony', 'boAt', 'JBL', 'Sennheiser', 'Canon', 'Nikon', 'Samsung', 'LG', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'Apple', 'Bose', 'Noise', 'Boult', 'Zebronics', 'Marshall', 'Logitech']:
                if b.lower() in name.lower():
                    brand = b
                    break

            is_mobile = any(k in name.lower() for k in ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy ', 'redmi', 'oneplus', 'realme', 'vivo ', 'oppo ', 'poco '])
            is_mobile_acc = any(k in name.lower() for k in ['phone case', 'mobile cover', 'power bank', 'fast charger', 'charging cable', 'screen protector', 'tempered glass'])

            if is_mobile or is_mobile_acc:
                target_cat_id = 2
                target_seller_id = SELLER_MAP[2]
                if 'power bank' in name.lower():
                    resolved_slug = 'power-banks'
                elif 'case' in name.lower() or 'cover' in name.lower():
                    resolved_slug = 'cases-covers'
                elif 'charger' in name.lower() or 'cable' in name.lower():
                    resolved_slug = 'chargers-cables'
                elif price > 40000:
                    resolved_slug = 'flagship-mobiles'
                elif price > 12000:
                    resolved_slug = 'smartphones'
                else:
                    resolved_slug = 'budget-smartphones'
            else:
                target_cat_id = 3
                target_seller_id = SELLER_MAP[3]
                resolved_slug = sub_slug
                if 'laptop' in name.lower() or 'notebook' in name.lower():
                    resolved_slug = 'laptops'
                elif 'watch' in name.lower() or 'smartwatch' in name.lower():
                    resolved_slug = 'smartwatches'
                elif 'headphone' in name.lower() or 'earbud' in name.lower() or 'earphone' in name.lower():
                    resolved_slug = 'headphones'
                elif 'tv' in name.lower() or 'television' in name.lower():
                    resolved_slug = 'tvs'
                elif 'speaker' in name.lower() or 'soundbar' in name.lower():
                    resolved_slug = 'speakers'
                elif 'camera' in name.lower() or 'lens' in name.lower():
                    resolved_slug = 'cameras'
                elif 'tablet' in name.lower() or 'ipad' in name.lower():
                    resolved_slug = 'tablets'

            specs = {
                'Brand': brand,
                'Category': 'Mobiles & Accessories' if target_cat_id == 2 else spec_cat,
                'Connectivity': 'Bluetooth 5.3 Wireless / 5G' if 'wireless' in name.lower() or 'bluetooth' in name.lower() or target_cat_id == 2 else 'High Speed Wired USB-C',
                'Warranty': '1 Year Manufacturer Domestic Warranty',
                'Country of Origin': 'India'
            }

            batch.append({
                'name': name[:250],
                'description': f"Immerse yourself in top-tier performance with {name}. Engineered for exceptional durability, crystal-clear output, and seamless compatibility across all your devices.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Matte Black' if 'black' in name.lower() else ('Arctic Silver' if 'silver' in name.lower() else 'Midnight Blue'),
                'size': 'Standard',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 35.0), 1),
                'average_rating': clean_rating(row.get('ratings', row.get('Rating'))),
                'review_count': clean_review_count(row.get('no_of_ratings', row.get('Review_Count'))),
                'category_id': cat_lookup.get((target_cat_id, resolved_slug), target_cat_id),
                'seller_id': target_seller_id,
                'images': images
            })

            if len(batch) >= 500:
                inserted = insert_batch(conn, cur, batch)
                total_imported += inserted
                batch = []

        if batch:
            inserted = insert_batch(conn, cur, batch)
            total_imported += inserted
        print(f"Electronics dataset {os.path.basename(fpath)} imported. Total: {total_imported}")

    # -------------------------------------------------------------
    # 4. CLOTHING & FASHION (Myntra + Mens/Womens/Kids CSVs)
    # -------------------------------------------------------------
    print("\n--- Ingesting Clothing & Fashion Datasets ---")
    myntra_path = 'data/datasets/dataset_3/Myntra_fashion_products.csv'
    if os.path.exists(myntra_path):
        df_myntra = pd.read_csv(myntra_path)
        batch = []
        for _, row in df_myntra.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('price'), 899.0)
            raw_img = str(row.get('images', '')).split('~')[0].strip()
            img = clean_url(raw_img)
            images = [img] if img else [CATEGORIES_DEF[3]['icon_url']]

            brand = str(row.get('brand', 'NovaFashion')).strip()[:50]
            gender = str(row.get('gender', 'Unisex')).strip()

            sub_slug = 'mens-tshirts'
            comb = name.lower() + ' ' + gender.lower()
            if any(k in comb for k in ['t-shirt', 'tshirt', 'polo', 'tee']):
                sub_slug = 'mens-tshirts'
            elif any(k in comb for k in ['shirt', 'formal shirt', 'linen shirt']):
                sub_slug = 'mens-shirts'
            elif any(k in comb for k in ['jean', 'trouser', 'pant', 'chino', 'cargo', 'track']):
                sub_slug = 'mens-jeans'
            elif any(k in comb for k in ['saree', 'kurta', 'kurti', 'lehenga', 'ethnic', 'anarkali']):
                sub_slug = 'traditional-wear'
            elif any(k in comb for k in ['dress', 'gown', 'skirt', 'top', 'blouse', 'women']):
                sub_slug = 'womens-fashion'
            elif any(k in comb for k in ['kid', 'boy', 'girl', 'infant', 'baby']):
                sub_slug = 'kids-fashion'
            elif any(k in comb for k in ['jacket', 'hoodie', 'sweater', 'coat', 'sweatshirt', 'blazer']):
                sub_slug = 'jackets-hoodies'
            elif any(k in comb for k in ['innerwear', 'brief', 'vest', 'bra', 'panty', 'boxer', 'lounge']):
                sub_slug = 'innerwear-sleepwear'
            elif any(k in comb for k in ['handbag', 'clutch', 'tote', 'purse', 'wallet']):
                sub_slug = 'handbags-clutches'
            elif any(k in comb for k in ['watch', 'sunglass', 'belt', 'tie']):
                sub_slug = 'watches-accessories'

            color = 'Navy Blue' if 'blue' in name.lower() else ('Classic Black' if 'black' in name.lower() else ('Crisp White' if 'white' in name.lower() else ('Olive Green' if 'green' in name.lower() else 'Maroon')))
            size = 'L' if 'l' in name.lower() else ('M' if 'm' in name.lower() else 'Free Size')

            specs = {
                'Brand': brand,
                'Fabric': '100% Premium Cotton' if 'cotton' in name.lower() else 'Cotton Blend Rich Stretch',
                'Fit': 'Regular Fit' if 'regular' in name.lower() else 'Slim Fit',
                'Occasion': 'Casual & Daily Wear' if 'casual' in name.lower() else 'Party & Festive Wear',
                'Wash Care': 'Machine Wash Cold with Similar Colors',
                'Gender': gender
            }

            batch.append({
                'name': name[:250],
                'description': str(row.get('description', f"Step up your everyday wardrobe with {name}. Designed with breathable soft fabric for all-day comfort, modern tailored fit, and premium finish."))[:450],
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': color,
                'size': size,
                'price': price,
                'discount_percent': round(random.uniform(15.0, 50.0), 1),
                'average_rating': clean_rating(random.uniform(4.0, 4.8)),
                'review_count': clean_review_count(random.randint(30, 600)),
                'category_id': cat_lookup.get((4, sub_slug), 4),
                'seller_id': SELLER_MAP[4],
                'images': images
            })

            if len(batch) >= 500:
                inserted = insert_batch(conn, cur, batch)
                total_imported += inserted
                batch = []

        if batch:
            inserted = insert_batch(conn, cur, batch)
            total_imported += inserted
        print(f"Myntra Fashion imported. Total so far: {total_imported}")

    # Also import dataset_9 fashion files
    fashion_csvs = [
        ('data/datasets/dataset_9/Mens Shirts.csv', 'mens-shirts'),
        ('data/datasets/dataset_9/T-shirts and Polos.csv', 'mens-tshirts'),
        ('data/datasets/dataset_9/WesternWear.csv', 'womens-fashion'),
        ('data/datasets/dataset_9/WomensFashion.csv', 'traditional-wear'),
        ('data/datasets/dataset_9/Kids Clothing.csv', 'kids-fashion'),
        ('data/datasets/dataset_9/Handbags and Clutches.csv', 'handbags-clutches'),
        ('data/datasets/dataset_9/Mens Innerwear.csv', 'innerwear-sleepwear'),
        ('data/datasets/dataset_9/Womens Innerwear.csv', 'innerwear-sleepwear'),
        ('data/datasets/dataset_9/Mens Watches.csv', 'watches-accessories'),
        ('data/datasets/dataset_9/Womens Watches.csv', 'watches-accessories'),
    ]
    for fpath, sub_slug in fashion_csvs:
        if not os.path.exists(fpath):
            continue
        df_f = pd.read_csv(fpath)
        batch = []
        for _, row in df_f.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 799.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[3]['icon_url']]

            brand = 'NovaFashion'
            for b in ['U.S. Polo Assn.', 'Peter England', 'Allen Solly', 'Van Heusen', 'Puma', 'Nike', 'Levi\'s', 'Roadster', 'HRX', 'Biba', 'W', 'Vero Moda', 'Casio', 'Titan', 'Fastrack', 'Fossil']:
                if b.lower() in name.lower():
                    brand = b
                    break

            specs = {
                'Brand': brand,
                'Fabric': 'Cotton Rich Blend',
                'Pattern': 'Solid' if 'solid' in name.lower() else ('Printed' if 'print' in name.lower() else 'Checked'),
                'Country of Origin': 'India'
            }

            batch.append({
                'name': name[:250],
                'description': f"Elevate your signature look with {name}. Featuring superior fabric craftsmanship, timeless styling, and exceptional durability.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Black' if 'black' in name.lower() else ('Blue' if 'blue' in name.lower() else 'White'),
                'size': 'M',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 45.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((4, sub_slug), 4),
                'seller_id': SELLER_MAP[4],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted

    # -------------------------------------------------------------
    # 5. SHOES & FOOTWEAR (Men Shoes + Womens Shoes CSVs)
    # -------------------------------------------------------------
    print("\n--- Ingesting Shoes & Footwear Datasets ---")
    shoes_csvs = [
        ('data/datasets/dataset_4/MEN_SHOES.csv', 'sports-shoes'),
        ('data/datasets/dataset_9/Mens Sports Shoes.csv', 'sports-shoes'),
        ('data/datasets/dataset_9/Mens Formal Shoes.csv', 'mens-formal-shoes'),
        ('data/datasets/dataset_9/Womens Shoes.csv', 'womens-shoes'),
        ('data/datasets/dataset_9/Womens Sandals.csv', 'womens-sandals')
    ]

    for fpath, default_slug in shoes_csvs:
        if not os.path.exists(fpath):
            continue
        df_sh = pd.read_csv(fpath)
        batch = []
        for _, row in df_sh.iterrows():
            name = normalize_title(row.get('Product_details') if 'Product_details' in row else row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price_col = 'Current_Price' if 'Current_Price' in row else 'actual_price'
            price = clean_price(row.get(price_col), 1499.0)

            img = clean_url(row.get('image')) if 'image' in row else None
            images = [img] if img else [CATEGORIES_DEF[4]['icon_url']]

            brand = str(row.get('Brand_Name', 'NovaFootwear')).strip()
            if brand == 'NovaFootwear' or brand == 'nan':
                for b in ['Nike', 'Adidas', 'Puma', 'Reebok', 'Asian', 'Sparx', 'Campus', 'Bata', 'Red Tape', 'Woodland', 'Clarks', 'Bata', 'Metro', 'Mochi', 'Crocs']:
                    if b.lower() in name.lower():
                        brand = b
                        break

            sub_slug = default_slug
            if any(k in name.lower() for k in ['running', 'gym', 'training', 'jogging', 'sport']):
                sub_slug = 'sports-shoes'
            elif any(k in name.lower() for k in ['sneaker', 'casual', 'canvas', 'high top']):
                sub_slug = 'mens-shoes'
            elif any(k in name.lower() for k in ['formal', 'derby', 'oxford', 'loafer', 'monk strap', 'leather']):
                sub_slug = 'mens-formal-shoes'
            elif any(k in name.lower() for k in ['heel', 'flat', 'wedge', 'ballerina', 'stiletto']):
                sub_slug = 'womens-shoes'
            elif any(k in name.lower() for k in ['sandal', 'slipper', 'flip-flop', 'slide']):
                sub_slug = 'sandals-slippers'

            specs = {
                'Brand': brand,
                'Sole Material': 'Lightweight EVA & Rubber Grip',
                'Upper Material': 'Breathable Engineered Mesh & Synthetic Leather',
                'Closure': 'Lace-Up' if 'lace' in name.lower() else 'Slip-On',
                'Toe Shape': 'Round Toe',
                'Occasion': 'Sports & Active Running' if 'sport' in sub_slug else 'Casual Lifestyle'
            }

            batch.append({
                'name': name[:250],
                'description': f"Unleash maximum comfort and responsive cushioning with {name}. Designed with shock-absorbing soles, supportive arches, and durable traction.",
                'specifications': json.dumps(specs),
                'brand': brand[:50],
                'color': 'Black/Red' if 'black' in name.lower() else ('White/Blue' if 'white' in name.lower() else 'Grey/Neon'),
                'size': 'UK 8' if '8' in name else ('UK 9' if '9' in name else 'UK 7'),
                'price': price,
                'discount_percent': round(random.uniform(15.0, 45.0), 1),
                'average_rating': clean_rating(row.get('RATING', row.get('ratings'))),
                'review_count': clean_review_count(row.get('How_Many_Sold', row.get('no_of_ratings'))),
                'category_id': cat_lookup.get((5, sub_slug), 5),
                'seller_id': SELLER_MAP[5],
                'images': images
            })

            if len(batch) >= 500:
                inserted = insert_batch(conn, cur, batch)
                total_imported += inserted
                batch = []

        if batch:
            inserted = insert_batch(conn, cur, batch)
            total_imported += inserted
        print(f"Shoes dataset {os.path.basename(fpath)} imported. Total: {total_imported}")

    # -------------------------------------------------------------
    # 6. BOOKS & STATIONERY (Amazon Books + School Bags)
    # -------------------------------------------------------------
    print("\n--- Ingesting Books & Stationery ---")
    books_path = 'data/datasets/dataset_5/Amazon_BooksDataset.csv'
    if os.path.exists(books_path):
        df_b = pd.read_csv(books_path)
        batch = []
        for _, row in df_b.iterrows():
            name = normalize_title(row.get('Book Name'))
            if not name or len(name) < 2 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('Price'), 299.0)
            author = str(row.get('Author', 'Renowned Author')).strip()
            cat_genre = str(row.get('Category', 'Self Improvement')).strip()
            pages = str(row.get('Pages', '320')).strip()

            sub_slug = 'self-help'
            if any(k in cat_genre.lower() or k in name.lower() for k in ['fiction', 'novel', 'story', 'thriller', 'potter', 'mystery']):
                sub_slug = 'fiction'
            elif any(k in cat_genre.lower() or k in name.lower() for k in ['money', 'finance', 'invest', 'wealth', 'business', 'rich']):
                sub_slug = 'business-finance'
            elif any(k in cat_genre.lower() or k in name.lower() for k in ['exam', 'science', 'math', 'academic', 'guide', 'study']):
                sub_slug = 'academic-reference'
            elif any(k in cat_genre.lower() or k in name.lower() for k in ['kid', 'child', 'fairy', 'tale', 'rhyme']):
                sub_slug = 'children-books'

            specs = {
                'Author': author,
                'Language': str(row.get('Language', 'English')),
                'Pages': f"{pages} Pages",
                'Genre': cat_genre,
                'Format': 'Paperback / Bestseller Edition',
                'Publisher': 'Penguin Random House / HarperCollins'
            }

            img = random.choice(BOOK_COVERS)

            batch.append({
                'name': name[:250],
                'description': f"Discover '{name}' by {author}. An inspiring, thought-provoking international bestseller featuring {pages} engaging pages in {cat_genre}.",
                'specifications': json.dumps(specs),
                'brand': author[:50],
                'color': None,
                'size': 'Paperback',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 30.0), 1),
                'average_rating': clean_rating(row.get('Ratings')),
                'review_count': clean_review_count(row.get('Total Ratings')),
                'category_id': cat_lookup.get((6, sub_slug), 6),
                'seller_id': SELLER_MAP[6],
                'images': [img]
            })

        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Books imported ({inserted}). Total so far: {total_imported}")

    # Import School Bags into Stationery
    bags_path = 'data/datasets/dataset_9/School Bags.csv'
    if os.path.exists(bags_path):
        df_bags = pd.read_csv(bags_path)
        batch = []
        for _, row in df_bags.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 699.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[5]['icon_url']]

            specs = {
                'Material': 'Waterproof High Density Polyester',
                'Compartments': '3 Main Zippered Compartments + Water Bottle Pockets',
                'Capacity': '30 Litres Ergonomic Padded Backpack',
                'Warranty': '1 Year Stitching Warranty'
            }

            batch.append({
                'name': name[:250],
                'description': f"Durable, lightweight and waterproof {name}. Designed with ergonomic lumbar support straps and ample room for books, laptops, and stationery.",
                'specifications': json.dumps(specs),
                'brand': 'Skybags' if 'skybags' in name.lower() else ('American Tourister' if 'tourister' in name.lower() else 'NovaSchool'),
                'color': 'Navy Blue' if 'blue' in name.lower() else 'Jet Black',
                'size': '30L Backpack',
                'price': price,
                'discount_percent': round(random.uniform(15.0, 40.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((6, 'school-bags'), 6),
                'seller_id': SELLER_MAP[6],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted

    # -------------------------------------------------------------
    # 7. HOME & KITCHEN (Refrigerators + Home Improvement)
    # -------------------------------------------------------------
    print("\n--- Ingesting Home & Kitchen ---")
    home_csvs = [
        ('data/datasets/dataset_9/Refrigerators.csv', 'refrigerators', 'Refrigerators & Freezers'),
        ('data/datasets/dataset_9/Home Improvement.csv', 'home-improvement', 'Home Improvement & Tools')
    ]
    for fpath, sub_slug, spec_cat in home_csvs:
        if not os.path.exists(fpath):
            continue
        df_h = pd.read_csv(fpath)
        batch = []
        for _, row in df_h.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 3999.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[6]['icon_url']]

            brand = 'Prestige' if 'prestige' in name.lower() else ('Philips' if 'philips' in name.lower() else ('Samsung' if 'samsung' in name.lower() else ('LG' if 'lg' in name.lower() else ('Bosch' if 'bosch' in name.lower() else 'NovaHome'))))

            specs = {
                'Brand': brand,
                'Category': spec_cat,
                'Material': 'Stainless Steel & Toughened Glass',
                'Energy Rating': '4 Star Inverter Efficient' if price > 15000 else 'Standard Efficiency',
                'Warranty': '2 Years Comprehensive Warranty + 10 Years Compressor Warranty' if price > 15000 else '1 Year Domestic Warranty'
            }

            batch.append({
                'name': name[:250],
                'description': f"Upgrade your living space with the reliable {name}. High efficiency, premium modern finish, and durable long-lasting construction.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Metallic Silver' if 'silver' in name.lower() else 'Charcoal Grey',
                'size': 'Standard',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 30.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((7, sub_slug), 7),
                'seller_id': SELLER_MAP[7],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Home & Kitchen {os.path.basename(fpath)} imported. Total: {total_imported}")

    # -------------------------------------------------------------
    # 8. BEAUTY & PERSONAL CARE (Nykaa + Make-up CSV)
    # -------------------------------------------------------------
    print("\n--- Ingesting Beauty & Personal Care ---")
    nykaa_path = 'data/datasets/dataset_7/Nykaa_Product_Review.csv'
    if os.path.exists(nykaa_path):
        df_nykaa = pd.read_csv(nykaa_path)
        batch = []
        for _, row in df_nykaa.iterrows():
            name = normalize_title(row.get('Product Name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('Product Price'), 599.0)
            raw_img = str(row.get('Product Image Url', '')).split('|')[0].strip()
            img = clean_url(raw_img)
            images = [img] if img else [CATEGORIES_DEF[7]['icon_url']]

            brand = str(row.get('Product Brand', 'Nykaa Cosmetics')).strip()[:50]
            cat_str = str(row.get('Product Category', '')).lower()

            sub_slug = 'skincare'
            if any(k in cat_str or k in name.lower() for k in ['clean', 'face wash', 'scrub', 'cleanser']):
                sub_slug = 'cleansers'
            elif any(k in cat_str or k in name.lower() for k in ['hair', 'shampoo', 'conditioner', 'serum for hair']):
                sub_slug = 'haircare'
            elif any(k in cat_str or k in name.lower() for k in ['lip', 'foundation', 'eyeliner', 'kajal', 'compact', 'palette', 'makeup']):
                sub_slug = 'makeup'
            elif any(k in cat_str or k in name.lower() for k in ['perfume', 'fragrance', 'mist', 'deo', 'edp']):
                sub_slug = 'fragrances'
            elif any(k in cat_str or k in name.lower() for k in ['men', 'beard', 'shave']):
                sub_slug = 'mens-grooming'
            elif any(k in cat_str or k in name.lower() for k in ['bath', 'shower', 'body lotion', 'body butter']):
                sub_slug = 'bath-body'

            specs = {
                'Brand': brand,
                'Skin Type': 'All Skin Types / Dermatologically Tested',
                'Key Ingredients': 'Hyaluronic Acid, Vitamin C & Niacinamide' if 'serum' in name.lower() else 'Organic Botanical Extracts',
                'Formulation': 'Lightweight Fast-Absorbing',
                'Volume': '100 ml / 50g Net Wt',
                'Cruelty Free': '100% Cruelty-Free & Paraben-Free'
            }

            batch.append({
                'name': name[:250],
                'description': str(row.get('Product Description', f"Nourish and enhance your natural glow with {name}. Clinically proven, gentle on skin, and enriched with premium botanical actives."))[:450],
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': None,
                'size': 'Standard 100ml',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 35.0), 1),
                'average_rating': clean_rating(row.get('Product Rating')),
                'review_count': clean_review_count(row.get('Product Reviews Count')),
                'category_id': cat_lookup.get((8, sub_slug), 8),
                'seller_id': SELLER_MAP[8],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Nykaa Beauty imported ({inserted}). Total: {total_imported}")

    # Import Make-up.csv
    makeup_path = 'data/datasets/dataset_9/Make-up.csv'
    if os.path.exists(makeup_path):
        df_mk = pd.read_csv(makeup_path)
        batch = []
        for _, row in df_mk.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 499.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[7]['icon_url']]

            brand = 'Maybelline' if 'maybelline' in name.lower() else ('Lakme' if 'lakme' in name.lower() else ('L\'Oreal' if 'l\'oreal' in name.lower() or 'loreal' in name.lower() else ('Sugar' if 'sugar' in name.lower() else 'NovaBeauty')))

            specs = {
                'Brand': brand,
                'Finish': 'Velvet Matte Long-Wear',
                'Benefits': '16-Hour Transferproof & Smudge-Free Wear',
                'Skin Tone': 'Suitable for All Indian Skin Tones'
            }

            batch.append({
                'name': name[:250],
                'description': f"Achieve a flawless, professional finish with {name}. Long-lasting intense pigment that stays vibrant throughout the day.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Ruby Red' if 'red' in name.lower() else ('Warm Nude' if 'nude' in name.lower() else 'Natural Glow'),
                'size': 'Standard',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 30.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((8, 'makeup'), 8),
                'seller_id': SELLER_MAP[8],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted

    # -------------------------------------------------------------
    # 9. FURNITURE & HOME DECOR
    # -------------------------------------------------------------
    print("\n--- Ingesting Furniture & Home Decor ---")
    # Curated furniture items with real high-resolution images
    furniture_templates = [
        # Sofas & Seating
        ("Solid Sheesham Wood 3-Seater Living Room Sofa (Teak Finish)", "seating-sofas", 24999.0, "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80", "Sheesham Wood", "3 Seater (190cm x 85cm)"),
        ("Modern Velvet L-Shape Sectional Corner Sofa (Emerald Green)", "seating-sofas", 34999.0, "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80", "High Density Foam & Velvet Fabric", "L-Shape Left Facing (240cm x 150cm)"),
        ("Contemporary 2-Seater Fabric Loveseat Sofa (Charcoal Grey)", "seating-sofas", 16999.0, "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80", "Solid Wood Frame & Breathable Fabric", "2 Seater (140cm x 80cm)"),
        ("Luxury Recliner Armchair with Cup Holder & Rocker (Brown Leatherette)", "seating-sofas", 18999.0, "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80", "Air Leatherette & Heavy Steel Reclining Mechanism", "Single Seater Recliner"),
        ("Boho Knitted Floor Pouf & Footrest Stool (Cream White)", "seating-sofas", 2199.0, "https://images.unsplash.com/photo-1580481077194-e3db4a6d1a52?w=800&auto=format&fit=crop&q=80", "100% Braided Cotton with Dense EPS Filling", "50cm Diameter x 35cm Height"),
        ("Jumbo XXXL Filled Bean Bag with Footrest (Dual Tone Navy/Tan)", "seating-sofas", 2799.0, "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80", "Fade Resistant Leatherette", "XXXL Size with Ergonomic Back Support"),
        ("Mid-Century Velvet Accent Armchair with Gold Brass Legs (Dusty Rose)", "seating-sofas", 11499.0, "https://images.unsplash.com/photo-1580481077194-e3db4a6d1a52?w=800&auto=format&fit=crop&q=80", "Soft Dutch Velvet & Electroplated Steel", "75cm x 70cm x 82cm"),
        ("Wooden 1-Seater Wingback Lounge Chair (Royal Blue Fabric)", "seating-sofas", 13499.0, "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80", "Teak Wood Frame & High Resilience Foam", "Wingback Accent Chair"),

        # Tables & Chairs
        ("Ergonomic High-Back Mesh Executive Office Chair with Lumbar Support", "tables-chairs", 8999.0, "https://images.unsplash.com/photo-1580481077194-e3db4a6d1a52?w=800&auto=format&fit=crop&q=80", "Breathable Mesh & Heavy Nylon Base", "Adjustable Height with 3D Armrests"),
        ("Solid Teak Wood Study Desk with 3 Drawers & Cable Organizer", "tables-chairs", 11999.0, "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80", "Teak Wood & Matte Metal Legs", "120cm x 60cm x 75cm"),
        ("Solid Teak Wood 6-Seater Dining Table Set with Cushioned Chairs", "tables-chairs", 28999.0, "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80", "Solid Teak Wood", "6 Seater Dining Table (150cm x 90cm)"),
        ("Modern 4-Seater Glass Top Dining Table Set with Chrome Chairs", "tables-chairs", 18999.0, "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80", "10mm Toughened Glass & Chrome Steel", "4 Seater Dining Table (120cm x 75cm)"),
        ("Electric Height Adjustable Motorized Standing Desk (140x70cm Walnut)", "tables-chairs", 21999.0, "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80", "Dual Motor Steel Frame & Solid Wood Desktop", "Height Range 70cm - 120cm"),
        ("Minimalist Round Wooden Coffee Table with Fluted Pedestal Base", "tables-chairs", 6499.0, "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80", "MDF with Natural Ash Wood Veneer", "80cm Diameter x 45cm Height"),
        ("Set of 2 Nesting Triangle Side Tables with Tapered Solid Legs", "tables-chairs", 3299.0, "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80", "Engineered Wood & Solid Rubberwood Legs", "Large (50cm) + Small (40cm)"),
        ("Ergonomic Kneeling Office Chair for Posture Correction (Black Metal)", "tables-chairs", 4999.0, "https://images.unsplash.com/photo-1580481077194-e3db4a6d1a52?w=800&auto=format&fit=crop&q=80", "Carbon Steel Frame & 7cm Memory Foam", "Adjustable Angle Posture Stool"),

        # Beds & Mattresses
        ("King Size Hydraulic Storage Wooden Bed (Walnut Brown)", "beds-mattresses", 29999.0, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80", "Engineered Wood with Hydraulic Lift", "King Size (78 x 72 Inches)"),
        ("Queen Size Solid Sheesham Wood Platform Bed with Upholstered Headboard", "beds-mattresses", 23999.0, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80", "Solid Sheesham Wood & Linen Headboard", "Queen Size (78 x 60 Inches)"),
        ("Queen Size Orthopedic Memory Foam & Natural Latex Mattress (8 Inch)", "beds-mattresses", 14999.0, "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&auto=format&fit=crop&q=80", "7-Zone Orthopedic Memory Foam", "Queen Size (78 x 60 x 8 Inches)"),
        ("King Size 3-Zone Pocket Spring Medium Firm Mattress with Euro Top (10 Inch)", "beds-mattresses", 19999.0, "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&auto=format&fit=crop&q=80", "Individually Wrapped Pocket Springs & Foam", "King Size (78 x 72 x 10 Inches)"),
        ("Engineered Wood 4-Door Wardrobe with Full Length Dressing Mirror", "beds-mattresses", 21499.0, "https://images.unsplash.com/photo-1558997519-83ea9252def8?w=800&auto=format&fit=crop&q=80", "Particle Board with Melamine Coating", "160cm x 50cm x 190cm"),
        ("Multi-Tier Wooden Shoe Rack Cabinet with Cushion Seating Bench", "beds-mattresses", 4799.0, "https://images.unsplash.com/photo-1558997519-83ea9252def8?w=800&auto=format&fit=crop&q=80", "Solid Pine Wood with Foam Cushion", "90cm x 30cm x 45cm (Holds 12 Pairs)"),
        ("Modern Wall-Mounted Floating TV Entertainment Unit with LED Backlight", "beds-mattresses", 7999.0, "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80", "High Gloss Engineered Wood", "180cm Length (Fits up to 65 inch TVs)"),
        ("5-Tier Corner Ladder Bookshelf Display Rack (Dark Walnut Finish)", "beds-mattresses", 3899.0, "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80", "Solid Engineered Wood & Matte Iron Frame", "160cm Height x 45cm Width"),

        # Home Decor & Wall Art
        ("Handcrafted Brass Wall Clock with Silent Quartz Movement (18 Inch)", "home-decor-items", 2499.0, "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80", "Solid Antique Brass", "18 Inch Diameter"),
        ("Modern Abstract Canvas Wall Art Painting (Set of 3 Framed Panels)", "home-decor-items", 1999.0, "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80", "Cotton Canvas & Solid Pine Wood Frames", "3 Panels (40cm x 60cm each)"),
        ("Grand Arch Metal Frame Full Length Floor Dressing Mirror (65x24 Inch)", "home-decor-items", 6999.0, "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&auto=format&fit=crop&q=80", "Aluminum Alloy Frame with HD Shatterproof Glass", "165cm x 60cm"),
        ("Handmade Ceramic Donut Vase for Pampas Grass & Modern Decor", "home-decor-items", 899.0, "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80", "Matte Ceramic Clay", "Height: 22cm"),
        ("Set of 3 Golden Metal Geometric Plant Stands with Planter Pots", "home-decor-items", 2299.0, "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80", "Rust-Resistant Iron with Powder Coating", "Heights: 70cm, 55cm, 40cm"),
        ("Handcrafted Lord Buddha Meditating Water Fountain with LED Light", "home-decor-items", 1799.0, "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80", "Polyresin & Submersible Water Pump", "30cm x 20cm x 40cm"),
        ("Traditional Hand-Carved Jharokha Wooden Wall Mirror Frame (Vintage White)", "home-decor-items", 3499.0, "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80", "Distressed Mango Wood & Mirror Glass", "60cm x 45cm"),
        ("Set of 6 Botanical Minimalist Line Art Framed Wall Posters (A4 Size)", "home-decor-items", 1299.0, "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80", "300 GSM Heavy Matte Art Paper with Black Frames", "6 Frames (21cm x 30cm each)"),

        # Lighting & Lamps
        ("Nordic Arc Floor Standing Lamp with Marble Base and Dimmable Warm LED", "lighting", 4999.0, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80", "Powder Coated Metal & Italian Marble Base", "Height: 180cm, E27 Fitting"),
        ("Modern Geometric Pendant Ceiling Chandelier Light (Warm White)", "lighting", 3499.0, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80", "Matte Black Metal Frame", "Diameter 45cm"),
        ("Ceramic Base Bedside Table Night Lamp with Fabric Drum Shade", "lighting", 1699.0, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80", "Glazed Ceramic & Pure Linen Fabric Shade", "Height: 40cm"),
        ("Natural Himalayan Rock Salt Crystal Lamp with Wooden Base & Dimmer", "lighting", 1199.0, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80", "Authentic 100% Himalayan Pink Salt Chunk", "3-4 Kg Natural Shape"),
        ("Solar Powered Outdoor Waterproof Garden Pathway Spike Lights (Pack of 6)", "lighting", 1499.0, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80", "IP65 Waterproof ABS with Auto-Dusk Sensor", "Pack of 6 Solar Stakes"),
        ("Moroccan Hand-Etched Brass Lantern Hanging Lamp with Color Glass Panels", "lighting", 2199.0, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80", "Antique Finish Brass & Stained Glass", "35cm Height x 15cm Width"),

        # Curtains & Rugs
        ("Bohemian Hand-Tufted Woolen Area Rug for Living Room (5x7 Feet)", "curtains-rugs", 5999.0, "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80", "100% Natural New Zealand Wool", "5 x 7 Feet (150cm x 210cm)"),
        ("Thermal Insulated Blackout Door Curtains (Set of 2 Panels with Eyelets)", "curtains-rugs", 1299.0, "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80", "Triple-Weave Polyester Blackout Fabric", "Set of 2 (4ft x 7ft each)"),
        ("Ultra-Soft Shaggy Fluffy Bedroom Floor Carpet Rug (4x6 Feet Grey)", "curtains-rugs", 2799.0, "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80", "High Density Microfiber Shag with Anti-Skid Rubber Backing", "4 x 6 Feet (120cm x 180cm)"),
        ("Set of 5 Ethnic Embroidered Velvet Cushion Covers (16x16 Inches)", "curtains-rugs", 999.0, "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80", "Premium Heavy Velvet with Concealed Zipper", "Set of 5 (40cm x 40cm each)"),
        ("Natural Braided Jute Floor Mat Runner for Hallway & Kitchen (2x6 Feet)", "curtains-rugs", 1499.0, "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80", "100% Eco-Friendly Biodegradable Natural Jute Fiber", "2 x 6 Feet (60cm x 180cm)")
    ]

    furniture_batch = []
    for title, sub_slug, price, img, mat, dim in furniture_templates:
        norm = title.lower()
        if norm in seen_titles:
            continue
        seen_titles.add(norm)

        specs = {
            'Material': mat,
            'Dimensions': dim,
            'Assembly Required': 'Easy DIY with Included Toolkit & Manual',
            'Warranty': '3 Years Structural Warranty'
        }

        furniture_batch.append({
            'name': title[:250],
            'description': f"Transform your home interior with {title}. Crafted with premium {mat}, precision joinery, and durable finishes that blend seamlessly with modern Indian homes.",
            'specifications': json.dumps(specs),
            'brand': 'Wakefit' if 'mattress' in norm or 'bed' in norm else ('Pepperfry' if 'sofa' in norm else 'NovaLiving'),
            'color': 'Teak Finish' if 'wood' in norm else ('Emerald Green' if 'green' in norm else 'Matte Black'),
            'size': dim[:30],
            'price': price,
            'discount_percent': round(random.uniform(15.0, 40.0), 1),
            'average_rating': round(random.uniform(4.3, 4.9), 1),
            'review_count': random.randint(45, 800),
            'category_id': cat_lookup.get((9, sub_slug), 9),
            'seller_id': SELLER_MAP[9],
            'images': [img]
        })

    inserted = insert_batch(conn, cur, furniture_batch)
    total_imported += inserted
    print(f"Furniture & Home Decor imported ({inserted}). Total: {total_imported}")

    # -------------------------------------------------------------
    # 10. TOYS & KIDS (Toys and Games + Baby Products)
    # -------------------------------------------------------------
    print("\n--- Ingesting Toys & Kids ---")
    toys_csvs = [
        ('data/datasets/dataset_9/Toys and Games.csv', 'learning-toys'),
        ('data/datasets/dataset_9/Baby Products.csv', 'baby-care')
    ]
    for fpath, default_slug in toys_csvs:
        if not os.path.exists(fpath):
            continue
        df_t = pd.read_csv(fpath)
        batch = []
        for _, row in df_t.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 699.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[9]['icon_url']]

            brand = 'Lego' if 'lego' in name.lower() else ('Hot Wheels' if 'wheels' in name.lower() else ('Barbie' if 'barbie' in name.lower() else ('Nerf' if 'nerf' in name.lower() else ('Fisher-Price' if 'fisher' in name.lower() else ('Pampers' if 'pampers' in name.lower() else 'NovaKids')))))

            sub_slug = default_slug
            if any(k in name.lower() for k in ['action figure', 'doll', 'superhero', 'avengers', 'batman', 'marvel']):
                sub_slug = 'action-figures'
            elif any(k in name.lower() for k in ['board game', 'chess', 'puzzle', 'monopoly', 'card game', 'ludo']):
                sub_slug = 'board-games'
            elif any(k in name.lower() for k in ['stem', 'science', 'robot', 'building block', 'educational', 'learning']):
                sub_slug = 'learning-toys'
            elif any(k in name.lower() for k in ['rc ', 'remote control', 'drone', 'car ', 'helicopter', 'stunt']):
                sub_slug = 'rc-toys'
            elif any(k in name.lower() for k in ['rattle', 'plush', 'soft toy', 'teether', 'toddler']):
                sub_slug = 'baby-toys'
            elif any(k in name.lower() for k in ['diaper', 'wipes', 'feeder', 'bottle', 'lotion', 'stroller']):
                sub_slug = 'baby-care'

            specs = {
                'Brand': brand,
                'Age Group': '3+ Years' if 'baby' not in sub_slug else '0-24 Months',
                'Material': 'BPA-Free Non-Toxic Child-Safe ABS Plastic',
                'Safety Certified': 'BIS ISI Approved Child-Safe'
            }

            batch.append({
                'name': name[:250],
                'description': f"Inspire creativity and playful learning with {name}. Certified non-toxic, highly durable, and designed for endless hours of fun.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Multicolor',
                'size': 'Standard',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 35.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((10, sub_slug), 10),
                'seller_id': SELLER_MAP[10],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Toys dataset {os.path.basename(fpath)} imported. Total: {total_imported}")

    # -------------------------------------------------------------
    # 11. SPORTS & FITNESS (SG Sports Data + Strength Training)
    # -------------------------------------------------------------
    print("\n--- Ingesting Sports & Fitness ---")
    sports_path = 'data/datasets/dataset_10/Sports_ECommerce_Products_Data.csv'
    if os.path.exists(sports_path):
        df_sp = pd.read_csv(sports_path)
        batch = []
        for _, row in df_sp.iterrows():
            name = normalize_title(row.get('Product Name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('Special Price'), 999.0)
            orig_price = clean_price(row.get('Old Price'), price * 1.2)
            discount = round(max(0, (orig_price - price) / orig_price * 100), 1) if orig_price > price else 15.0

            sub_slug = 'cricket-gear'
            if any(k in name.lower() for k in ['football', 'soccer', 'shin guard', 'basketball']):
                sub_slug = 'football-sports'
            elif any(k in name.lower() for k in ['badminton', 'shuttle', 'tennis', 'racquet', 'racket', 'grip']):
                sub_slug = 'badminton-sports'
            elif any(k in name.lower() for k in ['dumbbell', 'barbell', 'weight', 'bench', 'kettlebell', 'gym plate']):
                sub_slug = 'gym-fitness'
            elif any(k in name.lower() for k in ['resistance', 'pull up', 'ab roller', 'skipping', 'rope']):
                sub_slug = 'resistance-fitness'
            elif any(k in name.lower() for k in ['yoga', 'mat', 'meditation', 'strap', 'block']):
                sub_slug = 'yoga-meditation'
            elif any(k in name.lower() for k in ['shaker', 'bottle', 'glove', 'wrist', 'knee', 'bag', 'kit bag']):
                sub_slug = 'sports-accessories'

            brand = 'SG' if 'sg' in name.lower() else ('SS' if 'ss' in name.lower() else ('Kookaburra' if 'kookaburra' in name.lower() else ('Yonex' if 'yonex' in name.lower() else ('Nivia' if 'nivia' in name.lower() else ('Cosco' if 'cosco' in name.lower() else 'NovaSports')))))

            specs = {
                'Brand': brand,
                'Sport': 'Cricket' if 'cricket' in sub_slug else ('Badminton' if 'badminton' in sub_slug else ('Football' if 'football' in sub_slug else 'Fitness & Gym')),
                'Material': 'Grade 1 English Willow / High Tensile Composite',
                'Player Level': 'Professional Match & Training Grade',
                'Country of Origin': 'India'
            }

            img = get_sports_image(name)

            batch.append({
                'name': name[:250],
                'description': f"Dominate your game with authentic {name}. Engineered for maximum power, balance, and championship-tier sports durability.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Standard Sports',
                'size': 'Full Size' if 'bat' in name.lower() else 'Standard',
                'price': price,
                'discount_percent': discount,
                'average_rating': round(random.uniform(4.2, 4.9), 1),
                'review_count': random.randint(40, 1200),
                'category_id': cat_lookup.get((11, sub_slug), 11),
                'seller_id': SELLER_MAP[11],
                'images': [img]
            })

            if len(batch) >= 500:
                inserted = insert_batch(conn, cur, batch)
                total_imported += inserted
                batch = []

        if batch:
            inserted = insert_batch(conn, cur, batch)
            total_imported += inserted
        print(f"SG Sports Data imported. Total so far: {total_imported}")

    # Import Strength Training.csv into Sports & Fitness
    strength_path = 'data/datasets/dataset_9/Strength Training.csv'
    if os.path.exists(strength_path):
        df_str = pd.read_csv(strength_path)
        batch = []
        for _, row in df_str.iterrows():
            name = normalize_title(row.get('name'))
            if not name or len(name) < 3 or is_automotive(name):
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)

            price = clean_price(row.get('actual_price'), 1299.0)
            img = clean_url(row.get('image'))
            images = [img] if img else [CATEGORIES_DEF[10]['icon_url']]

            sub_slug = 'gym-fitness'
            if 'band' in name.lower() or 'rope' in name.lower() or 'roller' in name.lower():
                sub_slug = 'resistance-fitness'
            elif 'yoga' in name.lower() or 'mat' in name.lower():
                sub_slug = 'yoga-meditation'

            brand = 'Kobo' if 'kobo' in name.lower() else ('Cockatoo' if 'cockatoo' in name.lower() else ('Decathlon' if 'decathlon' in name.lower() else ('Proline' if 'proline' in name.lower() else 'NovaFitness')))

            specs = {
                'Brand': brand,
                'Material': 'Cast Iron with Heavy Rubber Coating / High Elastic Latex',
                'Grip': 'Knurled Non-Slip Ergonomic Handle',
                'Warranty': '2 Years Replacement Warranty'
            }

            batch.append({
                'name': name[:250],
                'description': f"Build strength and muscle endurance with {name}. Built for rigorous heavy workouts, gym sessions, and home conditioning.",
                'specifications': json.dumps(specs),
                'brand': brand,
                'color': 'Black',
                'size': 'Standard',
                'price': price,
                'discount_percent': round(random.uniform(10.0, 35.0), 1),
                'average_rating': clean_rating(row.get('ratings')),
                'review_count': clean_review_count(row.get('no_of_ratings')),
                'category_id': cat_lookup.get((11, sub_slug), 11),
                'seller_id': SELLER_MAP[11],
                'images': images
            })
        inserted = insert_batch(conn, cur, batch)
        total_imported += inserted
        print(f"Strength Training imported ({inserted}). Total: {total_imported}")

    print("\n" + "=" * 80)
    print(f"DATASET NORMALIZATION & INGESTION COMPLETE! TOTAL PRODUCTS INSERTED: {total_imported}")
    print("=" * 80)

    # Verification summary per category
    print("\nProduct distribution across the 11 categories:")
    cur.execute("""
        SELECT c.id, c.name, c.slug, COUNT(p.id)
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        WHERE c.parent_id IS NULL
        GROUP BY c.id, c.name, c.slug
        ORDER BY c.id;
    """)
    for row in cur.fetchall():
        print(f"Category {row[0]:<2} | {row[1]:<35} | Slug: {row[2]:<25} | Root Products: {row[3]}")

    print("\nSelf + Descendant counts for all 11 categories:")
    for cat in CATEGORIES_DEF:
        cid = cat['id']
        cur.execute("""
            WITH RECURSIVE cat_tree AS (
                SELECT id FROM categories WHERE id = %s
                UNION ALL
                SELECT c.id FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
            )
            SELECT COUNT(*) FROM products p WHERE p.category_id IN (SELECT id FROM cat_tree);
        """, (cid,))
        count = cur.fetchone()[0]
        print(f"Category {cid:<2}: {cat['name']:<35} | Total Products: {count}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    run_ingestion()
