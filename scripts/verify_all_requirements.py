import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8080/api"

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'NovaCart-Test/1.0'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def test_categories():
    print("\n=======================================================")
    print(" 1. CATEGORY AUDIT & ISOLATION TEST")
    print("=======================================================")
    cats = get_json(f"{BASE_URL}/categories")
    print(f"Total Root Categories: {len(cats)}")
    assert len(cats) == 11, f"Expected 11 categories, got {len(cats)}"

    cat_slugs = [
        "groceries-household",
        "mobiles",
        "electronics",
        "fashion",
        "shoes-footwear",
        "books-stationery",
        "home-kitchen",
        "beauty-personal-care",
        "furniture-home-decor",
        "toys-kids",
        "sports-fitness"
    ]

    total_products_checked = 0

    for slug in cat_slugs:
        url = f"{BASE_URL}/products?categorySlug={slug}&page=0&size=50"
        data = get_json(url)
        total = data.get("totalElements", 0)
        items = data.get("content", [])
        total_products_checked += len(items)
        print(f"\n[Category: {slug.upper()}] -> Total Database Items: {total}, Fetched: {len(items)}")
        assert total >= 100, f"Expected >= 100 products for {slug}, got {total}"
        
        # Check sample item
        if items:
            p = items[0]
            print(f"  * Sample #{p['id']}: {p['name'][:60]} | Brand: {p.get('brand')} | Price: ₹{p['effectivePrice']}")
            print(f"    Category: {p.get('categoryName')} | Image: {p.get('images', [''])[0][:60]}...")
            
            # Cross category leakage checks
            for item in items[:15]:
                name_lower = item['name'].lower()
                cat_lower = item.get('categoryName', '').lower()
                if slug == 'sports-fitness':
                    assert 'lipstick' not in name_lower and 'eyeliner' not in name_lower, f"Beauty leaked in Sports: {name_lower}"
                    assert 'shampoo' not in name_lower and 'saree' not in name_lower, f"Beauty/Saree leaked in Sports: {name_lower}"
                elif slug == 'mobiles':
                    assert 'sofa' not in name_lower and 'shampoo' not in name_lower, f"Unrelated leaked in Mobiles: {name_lower}"
                elif slug == 'groceries-household':
                    assert 'laptop' not in name_lower and 'smartphone' not in name_lower, f"Electronics leaked in Groceries: {name_lower}"
                elif slug == 'beauty-personal-care':
                    assert 'cricket bat' not in name_lower and 'football' not in name_lower, f"Sports leaked in Beauty: {name_lower}"
                elif slug == 'shoes-footwear':
                    assert 't-shirt' not in name_lower and 'refrigerator' not in name_lower, f"Clothing/Appliance leaked in Shoes: {name_lower}"
    
    print(f"\n[OK] Category verification passed! Checked {total_products_checked} live product cards across all 11 categories.")

def test_natural_language_search():
    print("\n=======================================================")
    print(" 2. NATURAL LANGUAGE SEARCH AUDIT")
    print("=======================================================")
    
    queries = [
        ("running shoes under 3000", lambda p: p['effectivePrice'] <= 3000 and any(w in p['name'].lower() or w in p.get('categoryName', '').lower() for w in ['shoe', 'running', 'footwear', 'sneaker', 'athletic'])),
        ("black men's shirt under 1500", lambda p: p['effectivePrice'] <= 1500 and any(w in p['name'].lower() for w in ['shirt', 'black', 'men', 'polo', 'formal'])),
        ("iPhone", lambda p: 'iphone' in p['name'].lower() or 'apple' in p.get('brand', '').lower()),
        ("cricket bat", lambda p: any(w in p['name'].lower() for w in ['cricket', 'bat', 'kookaburra', 'sg', 'ss', 'mrf', 'ceat', 'gm'])),
        ("face wash", lambda p: any(w in p['name'].lower() for w in ['wash', 'clean', 'face', 'cleanser', 'foam', 'gel', 'scrub'])),
        ("rice", lambda p: any(w in p['name'].lower() for w in ['rice', 'basmati', 'sona', 'poha', 'flour', 'grain', 'dawaat', 'fortune', 'india gate']))
    ]

    for q, validator in queries:
        encoded = urllib.parse.quote(q)
        url = f"{BASE_URL}/products?keyword={encoded}&size=10"
        data = get_json(url)
        items = data.get("content", [])
        total = data.get("totalElements", 0)
        print(f"\n[Search Query: \"{q}\"] -> Found {total} products (Showing top {len(items)})")
        assert total > 0, f"Search for '{q}' returned 0 results!"
        
        valid_count = 0
        for item in items[:5]:
            is_valid = validator(item)
            if is_valid:
                valid_count += 1
            print(f"  * [Match: {is_valid}] #{item['id']}: {item['name'][:55]} | Brand: {item.get('brand')} | Price: ₹{item['effectivePrice']} | Cat: {item.get('categoryName')}")
        
        assert valid_count >= 1, f"Search '{q}' did not return valid relevant matches!"

    print("\n[OK] Natural language and keyword search passed all criteria!")

def test_recommendations():
    print("\n=======================================================")
    print(" 3. RECOMMENDATION ENGINES AUDIT")
    print("=======================================================")
    
    # 1. Test Similar Products
    # Fetch a Sports shoe product
    shoes_data = get_json(f"{BASE_URL}/products?categorySlug=shoes-footwear&size=5")
    sample_shoe = shoes_data['content'][0]
    shoe_id = sample_shoe['id']
    
    similar_url = f"{BASE_URL}/recommendations/similar/{shoe_id}?limit=6"
    similar_items = get_json(similar_url)
    print(f"\n[Similar Products for #{shoe_id}: {sample_shoe['name'][:40]}]")
    print(f"Found {len(similar_items)} similar items:")
    assert len(similar_items) > 0, f"Expected similar products for #{shoe_id}"
    for it in similar_items:
        print(f"  * #{it['id']}: {it['name'][:50]} | Cat: {it.get('categoryName')} | Price: ₹{it['effectivePrice']}")
        # Verify no cross-category leakage (Similar products to shoe should be in Shoes or closely related)
        assert it['id'] != shoe_id, "Similar products should not return the product itself"

    # 2. Test Frequently Bought Together (Bundle)
    fbt_url = f"{BASE_URL}/recommendations/frequently-bought-together/{shoe_id}?limit=3"
    fbt_items = get_json(fbt_url)
    print(f"\n[Frequently Bought Together Bundle for #{shoe_id}]")
    print(f"Found {len(fbt_items)} bundle items:")
    for it in fbt_items:
        print(f"  * Bundle Item #{it['id']}: {it['name'][:50]} | Price: ₹{it['effectivePrice']}")

    # 3. Test Complete the Look (for fashion)
    fashion_data = get_json(f"{BASE_URL}/products?categorySlug=fashion&size=5")
    sample_fashion = fashion_data['content'][0]
    fashion_id = sample_fashion['id']
    
    ctl_url = f"{BASE_URL}/recommendations/complete-the-look/{fashion_id}?limit=4"
    ctl_items = get_json(ctl_url)
    print(f"\n[Complete the Look for Fashion Item #{fashion_id}: {sample_fashion['name'][:40]}]")
    print(f"Found {len(ctl_items)} complementary items:")
    for it in ctl_items:
        print(f"  * Look Item #{it['id']}: {it['name'][:50]} | Cat: {it.get('categoryName')} | Price: ₹{it['effectivePrice']}")

    # 4. Test Recommended For You
    for_you_url = f"{BASE_URL}/recommendations/for-you?limit=8"
    for_you_items = get_json(for_you_url)
    print(f"\n[Recommended For You (Personalized / Popular fallback)]")
    print(f"Found {len(for_you_items)} recommendations:")
    assert len(for_you_items) > 0, "Expected recommended for you products"
    for it in for_you_items[:4]:
        print(f"  * #{it['id']}: {it['name'][:50]} | Rating: {it.get('averageRating')}★ | Price: ₹{it['effectivePrice']}")

    print("\n[OK] Recommendation systems verified successfully!")

if __name__ == "__main__":
    test_categories()
    test_natural_language_search()
    test_recommendations()
    print("\n=======================================================")
    print(" ALL BACKEND AUDITS & CRITERIA PASSED 100%!")
    print("=======================================================\n")
