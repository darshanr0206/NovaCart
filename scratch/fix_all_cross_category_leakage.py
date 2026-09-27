import psycopg2
import re

conn = psycopg2.connect("dbname=novacart user=postgres password=test@123 host=localhost")
cur = conn.cursor()

print("=== Starting comprehensive cross-category leakage cleanup ===")

# 1. Move shoes out of Category 4 (Fashion) into Category 5 (Shoes & Footwear)
cur.execute("""
    SELECT p.id, p.name, p.brand
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.parent_id = 4 AND p.active = true AND (
        p.name ILIKE '%shoe%' OR p.name ILIKE '%sneaker%' OR p.name ILIKE '%sandal%' OR 
        p.name ILIKE '%slipper%' OR p.name ILIKE '%loafer%' OR p.name ILIKE '%boot%' OR 
        p.name ILIKE '%flip-flop%' OR p.name ILIKE '%flip flop%' OR p.name ILIKE '%clog%' OR
        p.name ILIKE '%derby%' OR p.name ILIKE '%oxford%' OR p.name ILIKE '%brogue%'
    );
""")
shoes = cur.fetchall()
print(f"Found {len(shoes)} shoe items in Fashion to move to Shoes & Footwear")

moved_shoes = 0
for pid, name, brand in shoes:
    n_lower = name.lower()
    # Determine shoe subcategory:
    # 45: sports-shoes
    # 46: mens-shoes (casual/sneakers)
    # 47: mens-formal-shoes
    # 48: womens-shoes
    # 49: womens-sandals
    # 50: sandals-slippers
    target_cat = 46 # default to casual sneakers
    if any(k in n_lower for k in ["sandal", "slipper", "flip-flop", "flip flop", "slide", "clog"]):
        if "women" in n_lower:
            target_cat = 49
        else:
            target_cat = 50
    elif any(k in n_lower for k in ["running", "sports", "training", "gym", "tennis", "cricket shoe", "football stud"]):
        target_cat = 45
    elif any(k in n_lower for k in ["formal", "derby", "oxford", "brogue", "leather shoe", "office shoe"]):
        target_cat = 47
    elif any(k in n_lower for k in ["women", "heel", "flat", "ballerina", "wedge", "pump", "stiletto"]):
        target_cat = 48
    else:
        target_cat = 46

    cur.execute("UPDATE products SET category_id = %s WHERE id = %s", (target_cat, pid))
    moved_shoes += 1

print(f"Moved {moved_shoes} shoes to Category 5 subcategories")

# 2. Move Beauty/Perfumes out of Category 4 (Fashion) into Category 8 (Beauty & Personal Care)
cur.execute("""
    SELECT p.id, p.name, p.brand
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.parent_id = 4 AND p.active = true AND (
        p.name ILIKE '%eau de toilette%' OR p.name ILIKE '%eau de parfum%' OR p.name ILIKE '%lipstick%' OR
        p.name ILIKE '%perfume%' OR p.name ILIKE '%cologne%' OR p.name ILIKE '%body mist%' OR
        p.name ILIKE '%deodorant%' OR p.name ILIKE '%moisturizer%' OR p.name ILIKE '%moisturiser%' OR
        p.name ILIKE '%serum%' OR p.name ILIKE '%cleanser%' OR p.name ILIKE '%face wash%' OR
        p.name ILIKE '%facewash%' OR p.name ILIKE '%shampoo%' OR p.name ILIKE '%kajal%' OR
        p.name ILIKE '%eyeliner%' OR p.name ILIKE '%mascara%' OR p.name ILIKE '%beauty kit%' OR
        p.name ILIKE '%hair mask%' OR p.name ILIKE '%face cream%' OR p.name ILIKE '%night cream%' OR
        p.name ILIKE '%day cream%' OR p.name ILIKE '%sunscreen%'
    );
""")
beauty = cur.fetchall()
print(f"Found {len(beauty)} beauty/fragrance items in Fashion to move to Beauty & Personal Care")

moved_beauty = 0
for pid, name, brand in beauty:
    n_lower = name.lower()
    # 65: skincare (serums, moisturizers, creams, sunscreens)
    # 66: cleansers (face wash, scrub)
    # 67: haircare (shampoo, hair mask, oil)
    # 68: makeup (lipstick, kajal, eyeliner, mascara, beauty kit)
    # 69: fragrances (eau de parfum, eau de toilette, perfume, cologne, mist)
    # 70: mens-grooming (shaving, beard)
    # 71: bath-body (body wash, shower gel, lotion)
    target_cat = 65
    if any(k in n_lower for k in ["eau de parfum", "eau de toilette", "perfume", "cologne", "body mist", "deodorant", "edt", "edp"]):
        target_cat = 69
    elif any(k in n_lower for k in ["lipstick", "kajal", "eyeliner", "mascara", "beauty kit", "nail polish", "lip gloss", "blush", "eyeshadow"]):
        target_cat = 68
    elif any(k in n_lower for k in ["face wash", "facewash", "cleanser", "face scrub"]):
        target_cat = 66
    elif any(k in n_lower for k in ["shampoo", "hair mask", "conditioner", "hair oil"]):
        target_cat = 67
    elif any(k in n_lower for k in ["body wash", "shower gel", "body lotion", "soap"]):
        target_cat = 71
    elif any(k in n_lower for k in ["beard", "shaving"]):
        target_cat = 70
    else:
        target_cat = 65

    cur.execute("UPDATE products SET category_id = %s WHERE id = %s", (target_cat, pid))
    moved_beauty += 1

print(f"Moved {moved_beauty} beauty items to Category 8 subcategories")

# 3. Fix apparel wrongly placed in Beauty & Personal Care
cur.execute("""
    SELECT p.id, p.name, p.brand
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.parent_id = 8 AND p.active = true AND (
        p.name ILIKE '%t-shirt%' OR p.name ILIKE '%polo%' OR p.name ILIKE '%shirt%' OR
        p.name ILIKE '%jeans%' OR p.name ILIKE '%trouser%' OR p.name ILIKE '%sneaker%' OR
        p.name ILIKE '%shoe%'
    ) AND NOT (
        p.name ILIKE '%face%' OR p.name ILIKE '%hair%' OR p.name ILIKE '%skin%' OR
        p.name ILIKE '%serum%' OR p.name ILIKE '%cream%' OR p.name ILIKE '%wash%' OR
        p.name ILIKE '%shampoo%' OR p.name ILIKE '%perfume%' OR p.name ILIKE '%lipstick%'
    );
""")
apparel_in_beauty = cur.fetchall()
print(f"Found {len(apparel_in_beauty)} clothing/shoe items in Beauty to move back")

moved_apparel = 0
for pid, name, brand in apparel_in_beauty:
    n_lower = name.lower()
    if any(k in n_lower for k in ["sneaker", "shoe", "sandal"]):
        cur.execute("UPDATE products SET category_id = 46 WHERE id = %s", (pid,))
        moved_apparel += 1
    elif any(k in n_lower for k in ["t-shirt", "polo", "henley"]):
        cur.execute("UPDATE products SET category_id = 35 WHERE id = %s", (pid,))
        moved_apparel += 1
    elif "shirt" in n_lower:
        cur.execute("UPDATE products SET category_id = 36 WHERE id = %s", (pid,))
        moved_apparel += 1
    elif any(k in n_lower for k in ["jeans", "trouser"]):
        cur.execute("UPDATE products SET category_id = 37 WHERE id = %s", (pid,))
        moved_apparel += 1

print(f"Moved {moved_apparel} apparel/shoes out of Beauty")

# 4. Fix TP-Link USB Adapter in Groceries
cur.execute("UPDATE products SET category_id = 34 WHERE id = 5301 AND active = true")
print("Moved TP-Link adapter from Groceries to Electronics -> Computer Accessories")

# 5. Fix Aashirvaad Dal in Toys
cur.execute("UPDATE products SET category_id = 12 WHERE id = 37395 AND active = true")
print("Moved Aashirvaad Dal from Toys to Groceries -> Atta, Rice, Oil & Dals")

# 6. Fix baby dress in Toys -> move to Kids Fashion (cat 40)
cur.execute("UPDATE products SET category_id = 40 WHERE id = 37469 AND active = true")
print("Moved baby dress from Toys to Kids Fashion")

conn.commit()
print("=== Cross-category cleanup successfully completed and committed ===")
