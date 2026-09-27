import requests

try:
    resp = requests.post("http://localhost:8080/api/auth/login", json={
        "email": "sagar232@gmail.com",
        "password": "Password@123"
    })
    print(resp.status_code, resp.text)
except Exception as e:
    print(e)
