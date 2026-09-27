import requests
import json
import uuid

BASE_URL = "http://localhost:8080/api"
session = requests.Session()

def print_step(msg):
    print(f"\n--- {msg} ---")

try:
    # 1. Register & Login
    print_step("Register & Login")
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = session.post(f"{BASE_URL}/auth/register", json={
        "fullName": "E2E Test User",
        "email": email,
        "password": "Password@123"
    })
    reg_resp.raise_for_status()
    token = reg_resp.json()["accessToken"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("Registered and logged in successfully.")

    # 2. Get Categories
    print_step("Get Categories")
    cat_resp = session.get(f"{BASE_URL}/categories")
    cat_resp.raise_for_status()
    categories = cat_resp.json()
    print(f"Found {len(categories)} categories.")
    
    # 3. Get Products
    print_step("Get Products")
    prod_resp = session.get(f"{BASE_URL}/products?size=5")
    prod_resp.raise_for_status()
    products = prod_resp.json()["content"]
    print(f"Found {len(products)} products.")
    
    if not products:
        print("No products found to test checkout!")
        exit(1)
        
    product_id = products[0]["id"]
    print(f"Selected product ID: {product_id}")

    # 4. Add to Cart
    print_step("Add to Cart")
    cart_resp = session.post(f"{BASE_URL}/cart/items", json={
        "productId": product_id,
        "quantity": 1
    })
    cart_resp.raise_for_status()
    print("Added to cart successfully.")
    
    # 5. Add Address
    print_step("Add Address")
    addr_resp = session.post(f"{BASE_URL}/addresses", json={
        "label": "Home",
        "recipientName": "John Doe",
        "phone": "9876543210",
        "line1": "123 Test Street",
        "city": "Test City",
        "state": "Test State",
        "postalCode": "123456",
        "country": "India",
        "isDefault": True
    })
    addr_resp.raise_for_status()
    address_id = addr_resp.json()["id"]
    print(f"Address added, ID: {address_id}")
    
    # 6. Place Order
    print_step("Place Order")
    order_resp = session.post(f"{BASE_URL}/orders", json={"addressId": address_id})
    order_resp.raise_for_status()
    order = order_resp.json()
    order_id = order["id"]
    print(f"Order created, ID: {order_id}, Total: {order['total']}")
    
    # 7. Create Mock Payment
    print_step("Mock Payment")
    rp_resp = session.post(f"{BASE_URL}/payments/create", json={"orderId": order_id})
    rp_resp.raise_for_status()
    rp_data = rp_resp.json()
    print(f"Razorpay order created: {rp_data['razorpayOrderId']}")
    
    # Verify mock payment
    verify_resp = session.post(f"{BASE_URL}/payments/verify", json={
        "razorpayOrderId": rp_data['razorpayOrderId'],
        "razorpayPaymentId": "pay_mock_123456",
        "razorpaySignature": "mock_sig"
    })
    verify_resp.raise_for_status()
    print("Payment verified successfully!")
    
    print("\n✅ END-TO-END FLOW SUCCESSFUL!")
    
except requests.exceptions.RequestException as e:
    print(f"❌ Error during API call: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response Body: {e.response.text}")
