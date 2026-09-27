import requests
import json
import os
import io
import psycopg2
from PIL import Image, ImageDraw, ImageFont

BASE_URL = "http://localhost:8080/api"

def print_banner(text):
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)

def main():
    session = requests.Session()

    # -------------------------------------------------------------
    # 1. Customer Login (Sagar)
    # -------------------------------------------------------------
    print_banner("STEP 1: CUSTOMER LOGIN (Sagar)")
    login_resp = session.post(f"{BASE_URL}/auth/login", json={
        "email": "sagar232@gmail.com",
        "password": "Password@123"
    })
    
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.status_code} {login_resp.text}, trying register...")
        reg_resp = session.post(f"{BASE_URL}/auth/register", json={
            "fullName": "Sagar Sharma",
            "email": "sagar232@gmail.com",
            "password": "Password@123"
        })
        reg_resp.raise_for_status()
        token = reg_resp.json()["accessToken"]
    else:
        token = login_resp.json()["accessToken"]
        
    session.headers.update({"Authorization": f"Bearer {token}"})
    print(f"✅ Customer logged in successfully as sagar232@gmail.com (Token: {token[:20]}...)")

    # -------------------------------------------------------------
    # 2. Add 2-3 Products to Cart
    # -------------------------------------------------------------
    print_banner("STEP 2: ADD 2-3 PRODUCTS TO CART")
    prod_resp = session.get(f"{BASE_URL}/products?page=0&size=20")
    prod_resp.raise_for_status()
    products = prod_resp.json()["content"]
    print(f"Fetched available products: {len(products)}")

    selected_prods = [p for p in products if p.get("inStock", True)][:3]
    if len(selected_prods) < 3:
        # Fetch another page if needed
        more_resp = session.get(f"{BASE_URL}/products?page=1&size=20")
        selected_prods += [p for p in more_resp.json()["content"] if p.get("inStock", True)][:3 - len(selected_prods)]

    for p in selected_prods:
        cart_resp = session.post(f"{BASE_URL}/cart/items", json={
            "productId": p["id"],
            "quantity": 1
        })
        cart_resp.raise_for_status()
        print(f"  🛒 Added: '{p['name'][:40]}...' (Price: ₹{p['effectivePrice']})")

    cart_get = session.get(f"{BASE_URL}/cart")
    cart_get.raise_for_status()
    cart_data = cart_get.json()
    print(f"✅ Cart populated: {len(cart_data['items'])} items, Subtotal: ₹{cart_data['subtotal']}, Total: ₹{cart_data['total']}")

    # -------------------------------------------------------------
    # 3. Delivery Address Setup
    # -------------------------------------------------------------
    print_banner("STEP 3: DELIVERY ADDRESS")
    addr_list = session.get(f"{BASE_URL}/addresses").json()
    if not addr_list:
        addr_resp = session.post(f"{BASE_URL}/addresses", json={
            "label": "Home",
            "recipientName": "Sagar Sharma",
            "phone": "9876543210",
            "line1": "Flat 402, Greenfield Heights",
            "line2": "Sector 18",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postalCode": "560001",
            "country": "India",
            "isDefault": True
        })
        addr_resp.raise_for_status()
        address_id = addr_resp.json()["id"]
    else:
        address_id = addr_list[0]["id"]
    print(f"✅ Selected Delivery Address ID: {address_id}")

    # -------------------------------------------------------------
    # 4. Create Order & Razorpay Order
    # -------------------------------------------------------------
    print_banner("STEP 4: CREATE ORDER & RAZORPAY PAYMENT")
    order_resp = session.post(f"{BASE_URL}/orders", json={"addressId": address_id})
    order_resp.raise_for_status()
    order = order_resp.json()
    order_id = order["id"]
    order_num = order["orderNumber"]
    print(f"✅ Order Created: ID={order_id}, OrderNumber={order_num}, Total=₹{order['total']}, Status={order['status']}")

    rp_resp = session.post(f"{BASE_URL}/payments/create", json={"orderId": order_id})
    rp_resp.raise_for_status()
    rp_data = rp_resp.json()
    print(f"✅ Razorpay Order Generated: razorpayOrderId={rp_data['razorpayOrderId']}, KeyId={rp_data.get('keyId', 'N/A')}")

    # -------------------------------------------------------------
    # 5. Generate and Upload Payment Screenshot
    # -------------------------------------------------------------
    print_banner("STEP 5: UPLOAD PAYMENT SCREENSHOT")
    
    # Create an image dynamically
    img = Image.new('RGB', (600, 400), color=(30, 27, 75))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(20, 20), (580, 380)], fill=(255, 255, 255))
    draw.text((40, 40), "Razorpay Payment Confirmation", fill=(79, 70, 229))
    draw.text((40, 80), f"Order Number: {order_num}", fill=(17, 24, 39))
    draw.text((40, 110), f"Amount Paid: INR {order['total']}", fill=(16, 185, 129))
    draw.text((40, 140), f"Razorpay Payment ID: pay_test_{order_id}998", fill=(17, 24, 39))
    draw.text((40, 170), "Status: SUCCESS", fill=(16, 185, 129))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    files = {'file': ('payment_screenshot.png', img_byte_arr, 'image/png')}
    upload_resp = session.post(
        f"{BASE_URL}/payments/upload-screenshot",
        files=files,
        data={"orderId": order_id, "razorpayOrderId": rp_data['razorpayOrderId']}
    )
    upload_resp.raise_for_status()
    upload_data = upload_resp.json()
    screenshot_url = upload_data["url"]
    print(f"✅ Payment Screenshot Uploaded: {screenshot_url}")

    # -------------------------------------------------------------
    # 6. Verify Payment with Razorpay ID & Screenshot
    # -------------------------------------------------------------
    print_banner("STEP 6: VERIFY PAYMENT")
    payment_id = f"pay_test_{order_id}998"
    verify_resp = session.post(f"{BASE_URL}/payments/verify", json={
        "razorpayOrderId": rp_data['razorpayOrderId'],
        "razorpayPaymentId": payment_id,
        "razorpaySignature": "mock_test_signature",
        "screenshotUrl": screenshot_url,
        "paymentMethod": "RAZORPAY"
    })
    verify_resp.raise_for_status()
    verify_data = verify_resp.json()
    print(f"✅ Payment Verified: Status={verify_data.get('status')}, PaymentStatus={verify_data.get('paymentStatus')}")

    # -------------------------------------------------------------
    # 7. Check PostgreSQL Directly
    # -------------------------------------------------------------
    print_banner("STEP 7: DIRECT POSTGRESQL DATABASE VERIFICATION")
    conn = psycopg2.connect(
        dbname="novacart",
        user="postgres",
        password="test@123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()
    
    cur.execute("SELECT id, order_number, status, total, user_id FROM orders WHERE id = %s;", (order_id,))
    db_order = cur.fetchone()
    print(f"  [DB orders] ID={db_order[0]}, Order#={db_order[1]}, Status={db_order[2]}, Total={db_order[3]}, UserID={db_order[4]}")
    assert db_order[2] == "CONFIRMED", f"Expected order status CONFIRMED, got {db_order[2]}"

    cur.execute("SELECT id, razorpay_order_id, razorpay_payment_id, payment_method, screenshot_url, status, amount FROM payments WHERE order_id = %s;", (order_id,))
    db_payment = cur.fetchone()
    print(f"  [DB payments] ID={db_payment[0]}, RazorpayOrderID={db_payment[1]}, RazorpayPayID={db_payment[2]}, Method={db_payment[3]}, ScreenshotURL={db_payment[4]}, Status={db_payment[5]}, Amount={db_payment[6]}")
    assert db_payment[5] == "SUCCESS", f"Expected payment status SUCCESS, got {db_payment[5]}"
    assert db_payment[4] == screenshot_url, f"Screenshot URL mismatch in DB"

    cur.execute("SELECT id, product_name_snapshot, quantity, price_snapshot, item_status FROM order_items WHERE order_id = %s;", (order_id,))
    db_items = cur.fetchall()
    print(f"  [DB order_items] {len(db_items)} items found:")
    for item in db_items:
        print(f"    - Item ID={item[0]}: '{item[1][:30]}...' Qty={item[2]} Price=₹{item[3]} Status={item[4]}")
    
    cur.close()
    conn.close()
    print("✅ All PostgreSQL records verified perfectly!")

    # -------------------------------------------------------------
    # 8. Admin Login & View Orders (Fixing 'No Orders Available')
    # -------------------------------------------------------------
    print_banner("STEP 8: ADMIN ORDERS VIEW (No Orders Available FIX)")
    admin_session = requests.Session()
    admin_login = admin_session.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@novacart.app",
        "password": "NovaCartAdmin2026!"
    })
    admin_login.raise_for_status()
    admin_token = admin_login.json()["accessToken"]
    admin_session.headers.update({"Authorization": f"Bearer {admin_token}"})
    print("✅ Admin logged in successfully.")

    admin_orders_resp = admin_session.get(f"{BASE_URL}/admin/orders")
    admin_orders_resp.raise_for_status()
    admin_orders_page = admin_orders_resp.json()
    all_admin_orders = admin_orders_page["content"]
    print(f"✅ Admin fetched {len(all_admin_orders)} total orders from DB.")

    found_order = next((o for o in all_admin_orders if o["id"] == order_id), None)
    assert found_order is not None, f"Order {order_id} not found in admin orders list!"
    print(f"  Admin Order Details for #{found_order['orderNumber']}:")
    print(f"    - Customer: {found_order.get('customerName')} ({found_order.get('customerEmail')})")
    print(f"    - Order Status: {found_order.get('status')}")
    print(f"    - Total Amount: ₹{found_order.get('total')}")
    print(f"    - Payment Status: {found_order.get('paymentStatus')}")
    print(f"    - Payment Screenshot: {found_order.get('paymentScreenshotUrl')}")
    print(f"    - Items Count: {len(found_order.get('items', []))}")
    assert found_order.get('paymentScreenshotUrl') == screenshot_url, "Admin view missing screenshot URL!"

    # -------------------------------------------------------------
    # 9. Admin Updates Status Through All 7 Stages
    # -------------------------------------------------------------
    print_banner("STEP 9: ADMIN LIFECYCLE STATUS UPDATES (7 STAGES)")
    lifecycle_stages = [
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ]

    for stage in lifecycle_stages:
        status_resp = admin_session.put(f"{BASE_URL}/admin/orders/{order_id}/status", json={"status": stage})
        status_resp.raise_for_status()
        updated_data = status_resp.json()
        print(f"  ➡️ Updated status to: {stage} -> Backend confirmed status: {updated_data['status']}")
        assert updated_data["status"] == stage

    # -------------------------------------------------------------
    # 10. Customer Order Tracking View
    # -------------------------------------------------------------
    print_banner("STEP 10: CUSTOMER TRACKING LATEST STATUS")
    cust_order_resp = session.get(f"{BASE_URL}/orders/{order_id}")
    cust_order_resp.raise_for_status()
    cust_order = cust_order_resp.json()
    print(f"  Customer view for Order #{cust_order['orderNumber']}:")
    print(f"    - Latest Status: {cust_order['status']}")
    print(f"    - Payment Status: {cust_order.get('paymentStatus')}")
    print(f"    - Screenshot URL: {cust_order.get('paymentScreenshotUrl')}")
    print(f"    - Delivery Address: {cust_order.get('deliveryAddress')}")
    assert cust_order["status"] == "DELIVERED", f"Expected DELIVERED, got {cust_order['status']}"

    print_banner("🎉 ALL ACCEPTANCE CRITERIA MET AND VERIFIED END-TO-END! 🎉")

if __name__ == "__main__":
    main()
