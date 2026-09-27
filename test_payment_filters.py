import requests
import json

BASE_URL = "http://localhost:8080/api"

def print_step(title):
    print(f"\n{'='*70}\n📌 {title}\n{'='*70}")

def test():
    # 1. Admin login
    print_step("Step 1: Admin Login")
    admin_session = requests.Session()
    login_resp = admin_session.post(f"{BASE_URL}/auth/login", json={
        "email": "administrator@novacart.app",
        "password": "Administrator@2026!"
    })
    login_resp.raise_for_status()
    admin_token = login_resp.json()["accessToken"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✅ Admin logged in successfully")

    # 2. Check existing order
    print_step("Step 2: Check Existing Orders via Admin Orders API")
    all_orders_resp = admin_session.get(f"{BASE_URL}/admin/orders", headers=admin_headers)
    all_orders_resp.raise_for_status()
    all_orders = all_orders_resp.json()["content"]
    print(f"Total existing orders (All Payments): {len(all_orders)}")
    for o in all_orders:
        print(f"  - Order #{o['orderNumber']}: Status={o['status']}, PaymentMethod={o.get('paymentMethod')}, PaymentStatus={o.get('paymentStatus')}")

    success_orders_resp = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=SUCCESS", headers=admin_headers)
    success_orders_resp.raise_for_status()
    success_orders = success_orders_resp.json()["content"]
    print(f"Orders with paymentStatus=SUCCESS: {len(success_orders)}")
    for o in success_orders:
        assert o.get("paymentStatus") == "SUCCESS", f"Expected SUCCESS, got {o.get('paymentStatus')}"
        print(f"  - Verified Success: Order #{o['orderNumber']}")

    # 3. Create a Customer for Testing
    print_step("Step 3: Create Customer & Setup Address and Cart")
    cust_session = requests.Session()
    signup_email = "virat.payment.test@novacart.in"
    reg_resp = cust_session.post(f"{BASE_URL}/auth/register", json={
        "fullName": "Virat TestUser",
        "email": signup_email,
        "password": "Password123!",
        "phone": "9898989898"
    })
    if reg_resp.status_code == 200 or reg_resp.status_code == 201:
        cust_token = reg_resp.json()["accessToken"]
    else:
        login_c = cust_session.post(f"{BASE_URL}/auth/login", json={
            "email": signup_email,
            "password": "Password123!"
        })
        login_c.raise_for_status()
        cust_token = login_c.json()["accessToken"]
    
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("✅ Customer authenticated")

    # Add Address
    addr_resp = cust_session.post(f"{BASE_URL}/addresses", headers=cust_headers, json={
        "line1": "123 Cricket Stadium Rd",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560001",
        "country": "India",
        "recipientName": "Virat TestUser",
        "phone": "9898989898"
    })
    addr_resp.raise_for_status()
    address_id = addr_resp.json()["id"]
    print(f"✅ Created delivery address ID: {address_id}")

    # Get a product to buy
    prod_resp = cust_session.get(f"{BASE_URL}/products?size=2")
    prod_resp.raise_for_status()
    prod_id = prod_resp.json()["content"][0]["id"]
    print(f"✅ Using Product ID: {prod_id}")

    # -------------------------------------------------------------
    # 4. TEST ONLINE PAYMENT FLOW
    # -------------------------------------------------------------
    print_step("Step 4: Place Order via ONLINE PAYMENT (Razorpay)")
    # Add to cart
    cust_session.post(f"{BASE_URL}/cart/items", headers=cust_headers, json={
        "productId": prod_id,
        "quantity": 1
    }).raise_for_status()

    # Create order
    online_order_resp = cust_session.post(f"{BASE_URL}/orders", headers=cust_headers, json={
        "addressId": address_id,
        "paymentMethod": "RAZORPAY"
    })
    online_order_resp.raise_for_status()
    online_order = online_order_resp.json()
    online_order_id = online_order["id"]
    print(f"✅ Created Order #{online_order['orderNumber']} (ID={online_order_id})")

    # Create Razorpay payment
    create_pay_resp = cust_session.post(f"{BASE_URL}/payments/create", headers=cust_headers, json={
        "orderId": online_order_id
    })
    create_pay_resp.raise_for_status()
    rp_order_id = create_pay_resp.json()["razorpayOrderId"]
    print(f"✅ Created Razorpay Order ID: {rp_order_id}")

    # Before payment, check admin PENDING filter
    pending_check = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=PENDING", headers=admin_headers).json()["content"]
    assert any(o["id"] == online_order_id for o in pending_check), "Online order before payment must show in PENDING"
    print("✅ Online order shows under PENDING before payment completion")

    # Complete Razorpay payment (verify)
    import hmac, hashlib
    key_secret = "ZOLSRpVhcfxUInSwx3wzYWEU"
    pay_id = f"pay_{online_order_id}_test123"
    sig_payload = f"{rp_order_id}|{pay_id}".encode("utf-8")
    valid_signature = hmac.new(key_secret.encode("utf-8"), sig_payload, hashlib.sha256).hexdigest()

    verify_resp = cust_session.post(f"{BASE_URL}/payments/verify", headers=cust_headers, json={
        "razorpayOrderId": rp_order_id,
        "razorpayPaymentId": pay_id,
        "razorpaySignature": valid_signature,
        "paymentMethod": "UPI"
    })
    verify_resp.raise_for_status()
    print("✅ Razorpay payment verified successfully")

    # Admin checks:
    # 4A. Success filter -> Online order MUST appear
    succ_orders = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=SUCCESS", headers=admin_headers).json()["content"]
    matched_online = next((o for o in succ_orders if o["id"] == online_order_id), None)
    assert matched_online is not None, "Online paid order MUST appear under SUCCESS filter"
    assert matched_online["paymentStatus"] == "SUCCESS", f"Expected paymentStatus SUCCESS, got {matched_online['paymentStatus']}"
    print(f"✅ [Online Payment] Filter 'SUCCESS': Order #{matched_online['orderNumber']} appeared! PaymentStatus={matched_online['paymentStatus']}")

    # 4B. Pending filter -> Online order must NOT appear
    pend_orders = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=PENDING", headers=admin_headers).json()["content"]
    assert not any(o["id"] == online_order_id for o in pend_orders), "Online paid order must not be in PENDING"
    print("✅ [Online Payment] Filter 'PENDING': Online paid order correctly does not appear")

    # -------------------------------------------------------------
    # 5. TEST CASH ON DELIVERY (COD) FLOW
    # -------------------------------------------------------------
    print_step("Step 5: Place Order via CASH ON DELIVERY (COD)")
    # Add to cart
    cust_session.post(f"{BASE_URL}/cart/items", headers=cust_headers, json={
        "productId": prod_id,
        "quantity": 1
    }).raise_for_status()

    # Place COD order
    cod_order_resp = cust_session.post(f"{BASE_URL}/orders", headers=cust_headers, json={
        "addressId": address_id,
        "paymentMethod": "COD"
    })
    cod_order_resp.raise_for_status()
    cod_order = cod_order_resp.json()
    cod_order_id = cod_order["id"]
    print(f"✅ Created COD Order #{cod_order['orderNumber']} (ID={cod_order_id}), PaymentStatus={cod_order.get('paymentStatus')}")
    assert cod_order.get("paymentStatus") == "PENDING", f"New COD order should have PENDING payment status, got {cod_order.get('paymentStatus')}"

    # 5A. Check PENDING / UNPAID filter in Admin -> COD order must appear
    pend_orders = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=PENDING", headers=admin_headers).json()["content"]
    matched_cod_pending = next((o for o in pend_orders if o["id"] == cod_order_id), None)
    assert matched_cod_pending is not None, "COD order before delivery MUST appear under PENDING filter"
    print(f"✅ [COD Before Delivery] Filter 'PENDING': Order #{matched_cod_pending['orderNumber']} appeared!")

    # 5B. Check UNPAID filter in Admin -> COD order must appear
    unpaid_orders = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=UNPAID", headers=admin_headers).json()["content"]
    assert any(o["id"] == cod_order_id for o in unpaid_orders), "COD order before delivery MUST appear under UNPAID filter"
    print("✅ [COD Before Delivery] Filter 'UNPAID': COD order appeared!")

    # 5C. Check SUCCESS filter in Admin -> COD order must NOT appear yet
    succ_orders_before = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=SUCCESS", headers=admin_headers).json()["content"]
    assert not any(o["id"] == cod_order_id for o in succ_orders_before), "COD order before delivery must NOT appear under SUCCESS"
    print("✅ [COD Before Delivery] Filter 'SUCCESS': Undelivered COD order does not appear")

    # 5D. Deliver the COD Order!
    print_step("Step 6: Deliver COD Order (Mark as DELIVERED in Admin)")
    deliver_resp = admin_session.put(f"{BASE_URL}/admin/orders/{cod_order_id}/status", headers=admin_headers, json={
        "status": "DELIVERED"
    })
    deliver_resp.raise_for_status()
    delivered_data = deliver_resp.json()
    print(f"✅ Order status updated to: {delivered_data['status']}")
    print(f"   Payment status updated to: {delivered_data['paymentStatus']}")
    assert delivered_data["paymentStatus"] == "SUCCESS", f"Delivered COD order MUST have paymentStatus SUCCESS, got {delivered_data['paymentStatus']}"

    # 5E. Check SUCCESS filter in Admin -> COD order MUST NOW APPEAR!
    succ_orders_after = admin_session.get(f"{BASE_URL}/admin/orders?paymentStatus=SUCCESS", headers=admin_headers).json()["content"]
    matched_cod_delivered = next((o for o in succ_orders_after if o["id"] == cod_order_id), None)
    assert matched_cod_delivered is not None, "Delivered COD order MUST appear under SUCCESS filter"
    assert matched_cod_delivered["paymentStatus"] == "SUCCESS", f"Expected SUCCESS, got {matched_cod_delivered['paymentStatus']}"
    print(f"✅ [COD Delivered] Filter 'SUCCESS': COD Order #{matched_cod_delivered['orderNumber']} appeared! PaymentStatus={matched_cod_delivered['paymentStatus']}")

    # -------------------------------------------------------------
    # 6. ALL PAYMENTS FILTER
    # -------------------------------------------------------------
    print_step("Step 7: Check 'All Payments' Filter")
    all_orders = admin_session.get(f"{BASE_URL}/admin/orders", headers=admin_headers).json()["content"]
    has_online = any(o["id"] == online_order_id for o in all_orders)
    has_cod = any(o["id"] == cod_order_id for o in all_orders)
    assert has_online, "Online order MUST appear in All Payments"
    assert has_cod, "COD order MUST appear in All Payments"
    print(f"✅ 'All Payments' includes BOTH Online Order #{online_order['orderNumber']} AND COD Order #{cod_order['orderNumber']}")

    print("\n🎉 ALL TESTS PASSED PERFECTLY! Both Online Payment and COD filters work flawlessly!")

if __name__ == "__main__":
    test()
