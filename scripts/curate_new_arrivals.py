#!/usr/bin/env python3
"""
curate_new_arrivals.py
Curates genuine, high-quality, non-duplicate New Arrivals across categories:
1. Deactivates obsolete products (iPhone 3G-12, old 2008-2018 MacBooks/laptops, obsolete tech).
2. Curates genuine flagship modern products (iPhone 15 series, iPhone 14 series, M2 MacBooks, iPad Pro,
   flagship sports equipment, premium fashion, audio, footwear, groceries).
3. Assigns beautiful, working HD product images.
4. Assigns recent, staggered created_at timestamps (today / this week) so they reliably sort to the top.
5. Deduplicates product names so each item in New Arrivals is completely distinct.
"""

import psycopg2
from datetime import datetime, timedelta

DB_CONFIG = {
    "dbname": "novacart",
    "user": "postgres",
    "password": "test@123",
    "host": "localhost",
    "port": 5432
}

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Step 1: Deactivating obsolete / old generation electronics and duplicates...")
    obsolete_patterns = [
        "%iphone 3%", "%iphone 4%", "%iphone 5%", "%iphone 6%", "%iphone 7%", "%iphone 8%",
        "%iphone se%", "%iphone x%", "%iphone xs%", "%iphone xr%", "%iphone 11%", "%iphone 12%",
        "%iMac G4%", "%iMac (slot%", "%MacBook(Early 2008%", "%MacBook(Early 2009%",
        "%MacBook(Mid 2009%", "%MacBook(Mid 2010%", "%MacBook Pro(Mid 2009%",
        "%MacBook Pro(Mid 2010%", "%MacBook Air(Mid 2011%", "%MacBook Pro (17\"%",
        "%iPad 1%", "%iPad 2%", "%iPad 3%", "%iPad 4%", "%iPad Air 2%"
    ]
    for pat in obsolete_patterns:
        cur.execute("UPDATE products SET active = false WHERE name ILIKE %s;", (pat,))
    conn.commit()

    # Step 2: Clean images for top Apple modern products
    apple_curated = [
        ("Apple iPhone 15 Pro Max", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPhone 15 Plus", "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPhone 15", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPhone 14 Pro Max", "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPhone 14 Plus", "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80"),
        ("Apple MacBook Air 13-inch (M2)", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80"),
        ("Apple MacBook Pro 13-inch (M2)", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"),
        ("Apple Mac Studio(M2 Max", "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPad Pro 12.9-inch (M2)", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80"),
        ("Apple iPad Air 11-inch (M2)", "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80"),
    ]

    selected_product_ids = []

    # Pick exactly one representative ID for each curated Apple product to prevent duplicates
    for prefix, img in apple_curated:
        cur.execute("""
            SELECT id FROM products 
            WHERE active = true AND name ILIKE %s 
            ORDER BY id DESC LIMIT 1;
        """, (f"{prefix}%",))
        row = cur.fetchone()
        if row:
            pid = row[0]
            selected_product_ids.append((pid, img))
            # Deactivate other duplicates of this exact model to keep catalog clean
            cur.execute("""
                UPDATE products SET active = false 
                WHERE active = true AND name ILIKE %s AND id != %s;
            """, (f"{prefix}%", pid))

    conn.commit()
    print(f"Selected {len(selected_product_ids)} distinct modern Apple products.")

    # Step 3: Pick distinct, high-quality products across other categories
    category_queries = [
        # Sports & Fitness (Badminton / Tennis / Gym)
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND p.category_id IN (SELECT id FROM categories WHERE parent_id = 11 OR id = 11)
        ORDER BY p.id DESC LIMIT 15;
        """,
        # Fashion & Apparel (Men's & Women's)
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND p.category_id IN (SELECT id FROM categories WHERE parent_id = 4 OR id = 4)
        ORDER BY p.id DESC LIMIT 15;
        """,
        # Footwear & Shoes
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND p.category_id IN (SELECT id FROM categories WHERE parent_id = 5 OR id = 5)
        ORDER BY p.id DESC LIMIT 12;
        """,
        # Audio & Headphones
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND (p.name ILIKE '%headphone%' OR p.name ILIKE '%earbuds%' OR p.category_id = 28)
        ORDER BY p.id DESC LIMIT 10;
        """,
        # Smartwatches & Wearables
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND (p.name ILIKE '%smartwatch%' OR p.category_id = 29)
        ORDER BY p.id DESC LIMIT 10;
        """,
        # Groceries & Household Essentials
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND p.category_id IN (SELECT id FROM categories WHERE parent_id = 1 OR id = 1)
        ORDER BY p.id DESC LIMIT 12;
        """,
        # Home & Kitchen
        """
        SELECT p.id, COALESCE(pi.url, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80')
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true AND p.category_id IN (SELECT id FROM categories WHERE parent_id = 7 OR id = 7)
        ORDER BY p.id DESC LIMIT 10;
        """
    ]

    for q in category_queries:
        cur.execute(q)
        for row in cur.fetchall():
            pid, img = row[0], row[1]
            if pid not in [x[0] for x in selected_product_ids]:
                selected_product_ids.append((pid, img))

    print(f"Total curated New Arrivals products: {len(selected_product_ids)}")

    # Step 4: Stagger created_at timestamps starting from now backwards
    # e.g., 2026-09-11 16:00:00, 15:50:00, 15:40:00 ...
    base_time = datetime(2026, 9, 11, 16, 30, 0)
    for idx, (pid, img) in enumerate(selected_product_ids):
        ts = base_time - timedelta(minutes=idx * 12)
        cur.execute("""
            UPDATE products 
            SET created_at = %s, updated_at = %s, active = true
            WHERE id = %s;
        """, (ts, ts, pid))

        # Ensure image is present and clean in product_images
        if img:
            cur.execute("DELETE FROM product_images WHERE product_id = %s;", (pid,))
            cur.execute("""
                INSERT INTO product_images (product_id, url, sort_order)
                VALUES (%s, %s, 0);
            """, (pid, img))

    conn.commit()
    print("Successfully updated created_at and images for all New Arrivals products!")

    # Verify top 15 results ordered by created_at DESC
    cur.execute("""
        SELECT p.id, p.name, p.brand, c.name, p.price, p.discount_percent, p.created_at, pi.url
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.active = true
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 15;
    """)
    print("\n--- TOP 15 VERIFIED NEW ARRIVALS ---")
    for r in cur.fetchall():
        print(f"[{r[0]}] {r[1]} ({r[3]}) - ₹{r[4]} (-{r[5]}%) - {r[6]} - Img: {r[7][:45]}...")

    conn.close()

if __name__ == "__main__":
    main()
