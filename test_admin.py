import requests
import json

BASE_URL = "http://localhost:8080/api"
session = requests.Session()

try:
    print("Logging in as admin...")
    reg_resp = session.post(f"{BASE_URL}/auth/login", json={
        "email": "administrator@novacart.app",
        "password": "Administrator@2026!"
    })
    reg_resp.raise_for_status()
    token = reg_resp.json()["accessToken"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print(f"Logged in as admin.")

    print("Fetching pending sellers...")
    sellers_resp = session.get(f"{BASE_URL}/admin/sellers?status=PENDING")
    sellers_resp.raise_for_status()
    sellers = sellers_resp.json()["content"]
    print(f"Found {len(sellers)} pending sellers.")

    if sellers:
        seller_id = sellers[0]["id"]
        print(f"Approving seller {seller_id}...")
        approve_resp = session.put(f"{BASE_URL}/admin/sellers/{seller_id}/approve")
        approve_resp.raise_for_status()
        print("Seller approved successfully.")
    
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
         print(f"Response: {e.response.text}")
