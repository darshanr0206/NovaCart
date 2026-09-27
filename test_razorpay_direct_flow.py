import requests
import hmac
import hashlib
import json

BASE_URL = "http://localhost:8080/api"
RAZORPAY_KEY_SECRET = "ZOLSRpVhcfxUInSwx3wzYWEU"

print("==================================================")
print("1. Logging in as test customer...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "sagar232@gmail.com",
    "password": "Password@123"
})
assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
auth_data = login_resp.json()
token = auth_data["accessToken"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print(f"   Logged in as {auth_data['fullName']} (User ID: {auth_data['userId']})")

print("\n2. Fetching user's latest orders...")
orders_resp = requests.get(f"{BASE_URL}/orders", headers=headers)
assert orders_resp.status_code == 200, f"Get orders failed: {orders_resp.text}"
orders_data = orders_resp.json()
orders = orders_data.get("content", [])
assert len(orders) > 0, "No orders found for test user"
test_order = orders[0]
order_id = test_order["id"]
order_number = test_order["orderNumber"]
order_total = test_order["total"]
print(f"   Using Order #{order_number} (ID: {order_id}, Total: ₹{order_total})")

print("\n3. Testing POST /api/payments/create (Real Razorpay Orders API call)...")
create_resp = requests.post(f"{BASE_URL}/payments/create", json={"orderId": order_id}, headers=headers)
assert create_resp.status_code == 200, f"Payment create failed: {create_resp.text}"
create_data = create_resp.json()
print("   Create Response:", json.dumps(create_data, indent=2))

razorpay_order_id = create_data.get("razorpayOrderId")
key_id = create_data.get("keyId")
amount_in_paise = create_data.get("amountInPaise")

assert razorpay_order_id and razorpay_order_id.startswith("order_"), f"Invalid razorpayOrderId: {razorpay_order_id}"
assert key_id.startswith("rzp_test_"), f"Invalid keyId: {key_id}"
assert amount_in_paise == round(order_total * 100), f"Amount mismatch: {amount_in_paise} != {round(order_total * 100)}"
print(f"   [PASS] Real Razorpay Order ID created: {razorpay_order_id}")

print("\n4. Testing cryptographic signature verification with TAMPERED signature...")
mock_payment_id = "pay_direct_test_upi_123456"
tampered_signature = "bad_tampered_signature_hex_000000"
tamper_resp = requests.post(f"{BASE_URL}/payments/verify", json={
    "razorpayOrderId": razorpay_order_id,
    "razorpayPaymentId": mock_payment_id,
    "razorpaySignature": tampered_signature,
    "paymentMethod": "UPI (Google Pay)"
}, headers=headers)
assert tamper_resp.status_code == 400, f"Expected 400 Bad Request for tampered signature, got {tamper_resp.status_code}"
print("   [PASS] Tampered signature properly rejected with HTTP 400 Bad Request.")

print("\n5. Testing cryptographic signature verification with AUTHENTIC HMAC-SHA256 signature...")
payload = f"{razorpay_order_id}|{mock_payment_id}".encode("utf-8")
valid_signature = hmac.new(RAZORPAY_KEY_SECRET.encode("utf-8"), payload, hashlib.sha256).hexdigest()
print(f"   Computed HMAC-SHA256: {valid_signature}")

verify_resp = requests.post(f"{BASE_URL}/payments/verify", json={
    "razorpayOrderId": razorpay_order_id,
    "razorpayPaymentId": mock_payment_id,
    "razorpaySignature": valid_signature,
    "paymentMethod": "UPI (Google Pay)"
}, headers=headers)
assert verify_resp.status_code == 200, f"Verify failed: {verify_resp.text}"
verify_data = verify_resp.json()
print("   Verify Response:", json.dumps(verify_data, indent=2))
assert verify_data.get("status") == "verified"
assert verify_data.get("paymentStatus") == "SUCCESS"
print("   [PASS] Payment verified and marked as SUCCESS!")

print("\n6. Checking updated order status in database...")
order_check_resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
assert order_check_resp.status_code == 200, f"Order fetch failed: {order_check_resp.text}"
checked_order = order_check_resp.json()
print(f"   Order Status: {checked_order.get('status')}")
print(f"   Payment Status: {checked_order.get('paymentStatus')}")
print(f"   Payment Method: {checked_order.get('paymentMethod')}")
assert checked_order.get("status") == "CONFIRMED", f"Order status is not CONFIRMED: {checked_order.get('status')}"
print("   [PASS] Order is confirmed and paid!")

print("\n7. Testing POST /api/payments/fail (Cancellation tracking)...")
fail_resp = requests.post(f"{BASE_URL}/payments/fail", json={
    "razorpayOrderId": razorpay_order_id,
    "reason": "Test user cancellation"
}, headers=headers)
assert fail_resp.status_code == 200, f"Fail endpoint returned error: {fail_resp.text}"
print("   Fail Response:", fail_resp.json())
print("   [PASS] Failure tracking endpoint verified.")

print("\n==================================================")
print("ALL DIRECT RAZORPAY PAYMENT FLOW TESTS PASSED! 🎉")
print("==================================================")
