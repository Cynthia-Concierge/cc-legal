#!/bin/bash

# Test the workflow API endpoint to see if it saves data

echo "🧪 Testing workflow API endpoint..."
echo ""

API_URL="${VITE_API_URL:-http://localhost:3000}"

# Check if server is running
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
  echo "❌ Server is not running at $API_URL"
  echo "   Please start your server first (npm run dev)"
  exit 1
fi

echo "✅ Server is running at $API_URL"
echo ""

# Test data
TEST_DATA='{
  "websiteUrl": "https://example.com",
  "leadInfo": {
    "name": "Test User",
    "company": "Test Company",
    "email": "test@example.com"
  }
}'

echo "📝 Sending test request to /api/scrape-and-analyze..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/scrape-and-analyze" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Response HTTP Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API request succeeded!"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Check your server console logs for save errors"
  echo "   2. Check Supabase dashboard for new workflow_results record"
  echo "   3. If no record appears, check server logs for database errors"
else
  echo "❌ API request failed with HTTP $HTTP_CODE"
  echo ""
  echo "Check the response body above for error details"
fi

