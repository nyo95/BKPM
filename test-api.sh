#!/bin/bash

echo "🧪 Testing Timeline Manager API..."
echo

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3000/api/health | jq .

echo
echo "2. Testing download-info endpoint..."
curl -s http://localhost:3000/api/download-info | jq .

echo
echo "3. Testing login with admin credentials..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rad.example",
    "password": "Admin123!",
    "csrfToken": "test-csrf"
  }')

echo "$LOGIN_RESPONSE" | jq .

echo
echo "4. Testing project creation (should work with admin session)..."
# This would need the actual session cookie from login
echo "⚠️  Need to extract session cookie from login response first"

echo
echo "✅ API testing completed!"