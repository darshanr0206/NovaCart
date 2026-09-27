#!/usr/bin/env python3
"""
test_address_flow.py
Verifies the exact user test sequence:
Add Address -> Save -> Refresh -> Select Address -> Checkout -> Place Order.
"""

import requests
import psycopg2

BASE_URL = "http://localhost:8080/api"

def main():
    print("=== STEP 1: Authenticate Customer ===")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "customer@novacart.app",
        "password": "CustomerPassword2026!"
    })
    
    if login_resp.status_code != 200:
        # Register or get user
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "customer@novacart.app",
            "password": "CustomerPassword2026!",
            "fullName": "Test Customer",
            "phone": "9876543210"
        })
        token = reg_resp.json()["accessToken"]
    else:
        token = login_resp.json()["accessToken"]
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    print("✓ Customer authenticated successfully")

    print("\n=== STEP 2: Add Address & Save to PostgreSQL ===")
    addr_payload = {
        "recipientName": "Priya Sharma",
        "phone": "9876543210",
        "line1": "Flat 402, Royal Palms Residency, 10th Main",
        "line2": "Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560038",
        "country": "India",
        "label": "Home",
        "isDefault": True
    }
    
    create_addr_resp = requests.post(f"{BASE_URL}/addresses", json=addr_payload, headers=headers)
    print("Create Address Status:", create_addr_resp.status_code)
    assert create_addr_resp.status_code == 200, f"Failed creating address: {create_addr_resp.text}"
    saved_addr = create_addr_resp.json()
    addr_id = saved_addr["id"]
    print(f"✓ Address saved with ID #{addr_id}: {saved_addr['recipientName']}, {saved_addr['line1']}, {saved_addr['city']} - {saved_addr['postalCode']}")

    print("\n=== STEP 3: Refresh & Verify Persistence in PostgreSQL ===")
    # Direct DB verification
    db_conn = psycopg2.connect(dbname="novacart", user="postgres", password="test@123", host="localhost", port=5432)
    db_cur = db_conn.cursor()
    db_cur.execute("SELECT id, recipient_name, line1, city, postal_code, is_default FROM addresses WHERE id = %s;", (addr_id,))
    db_row = db_cur.fetchone()
    print("PostgreSQL Database Row:", db_row)
    assert db_row is not None, "Address not found in PostgreSQL!"
    assert db_row[1] == "Priya Sharma", "Recipient name mismatch in DB"
    print("✓ Address verified permanently stored in PostgreSQL")

    # API verification (simulating page reload / getAddresses)
    get_addrs_resp = requests.get(f"{BASE_URL}/addresses", headers=headers)
    assert get_addrs_resp.status_code == 200
    all_addrs = get_addrs_resp.json()
    found = any(a["id"] == addr_id for a in all_addrs)
    assert found, "Saved address not returned in getAddresses API"
    print(f"✓ Reloaded {len(all_addrs)} addresses via API; Address #{addr_id} present")

    print("\n=== STEP 4: Add Product to Cart for Checkout ===")
    # Get an active product with stock
    prod_resp = requests.get(f"{BASE_URL}/products?sortBy=newest&size=5")
    products = prod_resp.json()["content"]
    target_product = next(p for p in products if p["inStock"])
    pid = target_product["id"]
    print(f"Adding product #{pid} ({target_product['name']}) to cart")

    cart_add_resp = requests.post(f"{BASE_URL}/cart/items", json={"productId": pid, "quantity": 1}, headers=headers)
    assert cart_add_resp.status_code == 200, f"Failed adding to cart: {cart_add_resp.text}"
    cart_data = cart_add_resp.json()
    print(f"✓ Cart has {len(cart_data['items'])} items, Total: ₹{cart_data['total']}")

    print("\n=== STEP 5: Select Address & Checkout / Place Order ===")
    order_payload = {
        "addressId": addr_id
    }
    order_resp = requests.post(f"{BASE_URL}/orders", json=order_payload, headers=headers)
    print("Order Placement Status:", order_resp.status_code)
    assert order_resp.status_code == 200, f"Failed placing order: {order_resp.text}"
    order_data = order_resp.json()
    order_id = order_data["id"]
    order_number = order_data["orderNumber"]
    print(f"✓ Order #{order_number} placed successfully!")
    print(f"  Delivery Address Snapshot: {order_data.get('deliveryAddress')}")

    print("\n=== STEP 6: Verify Order in PostgreSQL Linked to Selected Address ===")
    db_cur.execute("SELECT id, order_number, address_id, status FROM orders WHERE id = %s;", (order_id,))
    order_db_row = db_cur.fetchone()
    print("PostgreSQL Order Row:", order_db_row)
    assert order_db_row[2] == addr_id, f"Order address_id {order_db_row[2]} does not match selected address ID {addr_id}"
    print(f"✓ SUCCESS: Order #{order_number} is strictly linked to Address #{addr_id} in PostgreSQL!")

    print("\n=== STEP 7: Re-authenticate / Logout-Login Test ===")
    # Login again with new token
    login_again = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "customer@novacart.app",
        "password": "CustomerPassword2026!"
    })
    new_token = login_again.json()["accessToken"]
    new_headers = {"Authorization": f"Bearer {new_token}"}
    after_login_addrs = requests.get(f"{BASE_URL}/addresses", headers=new_headers).json()
    assert any(a["id"] == addr_id for a in after_login_addrs), "Address missing after re-login!"
    print(f"✓ Verified address #{addr_id} remains permanently available across login sessions!")

    db_conn.close()
    print("\n🎉 ALL TESTS PASSED: Address functionality is 100% permanently working in PostgreSQL & Checkout!")

if __name__ == "__main__":
    main()
