#!/bin/bash

echo "🔍 Testing /api/save-contact endpoint..."
echo ""

# Wait a moment for emulator to be ready
sleep 2

# Test the endpoint
curl -X POST http://localhost:5001/cc-legal/us-central1/api/api/save-contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test-'$(date +%s)'@example.com",
    "phone": "(555) 123-4567",
    "website": "https://test.com"
  }' \
  -w "\n\nStatus: %{http_code}\n" \
  -s

echo ""
echo "✅ Test complete"

