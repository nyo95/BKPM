#!/bin/bash

echo "🔐 Testing login and project creation..."
echo

# Step 1: Get CSRF token
echo "1. Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf)
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | jq -r .csrfToken)
echo "CSRF Token: $CSRF_TOKEN"

echo
echo "2. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt -X POST \
  http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "redirect=false&email=admin@rad.example&password=Admin123!&csrfToken=$CSRF_TOKEN")

echo "Login response: $LOGIN_RESPONSE"

echo
echo "3. Testing session..."
SESSION_RESPONSE=$(curl -s -b cookies.txt http://localhost:3000/api/auth/session)
echo "Session: $SESSION_RESPONSE"

echo
echo "4. Creating test project..."
PROJECT_RESPONSE=$(curl -s -b cookies.txt -X POST \
  http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project API",
    "clientName": "Test Client",
    "startDate": "2025-01-01",
    "endDate": "2025-06-01",
    "description": "Test project created via API"
  }')

echo "Project creation response: $PROJECT_RESPONSE"

# Clean up
rm -f cookies.txt

echo
echo "✅ Test completed!"