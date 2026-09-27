#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@novacart.app","password":"NovaCartAdmin2026!"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

curl -s -X POST http://localhost:8080/api/addresses \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "label": "Home",
  "recipientName": "John",
  "phone": "1234567890",
  "line1": "123 Street",
  "city": "Mumbai",
  "state": "MH",
  "postalCode": "400001",
  "country": "India",
  "isDefault": false
}'
