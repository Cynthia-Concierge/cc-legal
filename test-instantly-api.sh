#!/bin/bash

# Test script for Instantly.ai API endpoint
# Usage: ./test-instantly-api.sh

API_URL="${1:-http://localhost:3001}"
CAMPAIGN_ID="${2:-7f93b98c-f8c6-4c2b-b707-3ea4d0df6934}"

echo "🧪 Testing Instantly.ai API Integration"
echo "========================================"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Health check passed"
  echo "   Response: $BODY"
else
  echo "❌ Health check failed (HTTP $HTTP_CODE)"
  echo "   Make sure the server is running: npm run server"
  exit 1
fi

echo ""

# Test 2: Add lead endpoint
echo "2️⃣ Testing add-lead endpoint..."
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "campaignId": "$CAMPAIGN_ID",
  "leadData": {
    "first_name": "Test",
    "last_name": "User",
    "phone": "(555) 123-4567",
    "website": "https://testwebsite.com"
  }
}
EOF
)

LEAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/add-lead" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

HTTP_CODE=$(echo "$LEAD_RESPONSE" | tail -n1)
BODY=$(echo "$LEAD_RESPONSE" | sed '$d')

echo "   Request:"
echo "   Email: $TEST_EMAIL"
echo "   Campaign ID: $CAMPAIGN_ID"
echo ""
echo "   Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Lead added successfully!"
  echo "   Check your Instantly.ai dashboard to verify the lead was added."
elif [ "$HTTP_CODE" = "400" ]; then
  echo ""
  echo "⚠️  Bad request - check your campaign ID and data format"
elif [ "$HTTP_CODE" = "401" ]; then
  echo ""
  echo "⚠️  Unauthorized - check your INSTANTLY_AI_API_KEY"
elif [ "$HTTP_CODE" = "500" ]; then
  echo ""
  echo "❌ Server error - check server logs for details"
else
  echo ""
  echo "⚠️  Unexpected response code: $HTTP_CODE"
fi

echo ""
echo "========================================"
echo "Test complete!"

