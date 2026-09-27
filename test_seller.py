import requests
import json
import uuid

BASE_URL = "http://localhost:8080/api"
session = requests.Session()

try:
    print("Registering and logging in as customer...")
    email = f"seller_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = session.post(f"{BASE_URL}/auth/register", json={
        "fullName": "Test Seller",
        "email": email,
        "password": "Password@123"
    })
    reg_resp.raise_for_status()
    token = reg_resp.json()["accessToken"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print(f"Logged in as {email}")

    print("Registering seller...")
    sell_resp = session.post(f"{BASE_URL}/sellers/register", json={
        "businessName": "E2E Test Store",
        "businessEmail": email,
        "businessPhone": "9876543210",
        "businessAddress": "123 Seller St",
        "businessInfo": "A store for testing"
    })
    
    sell_resp.raise_for_status()
    print("Seller registered.")
        
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
         print(f"Response: {e.response.text}")
