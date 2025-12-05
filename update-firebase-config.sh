#!/bin/bash

# Script to update Firebase Functions config with real values
# Replace the placeholder values below with your actual values from .env

echo "⚠️  Note: Firebase Secrets require Blaze plan (paid)"
echo "Using legacy config method (works until March 2026)"
echo ""
echo "Update the commands below with your actual values from .env file"
echo ""

# Update these commands with your actual values from .env
# Example:
# firebase functions:config:set firecrawl.api_key="fc-abc123..."

echo "Run these commands with your actual values:"
echo ""
echo "firebase functions:config:set firecrawl.api_key=\"YOUR_ACTUAL_FIRECRAWL_KEY\""
echo "firebase functions:config:set openai.api_key=\"YOUR_ACTUAL_OPENAI_KEY\""
echo "firebase functions:config:set supabase.url=\"YOUR_ACTUAL_SUPABASE_URL\""
echo "firebase functions:config:set supabase.anon_key=\"YOUR_ACTUAL_SUPABASE_ANON_KEY\""
echo "firebase functions:config:set supabase.service_role_key=\"YOUR_ACTUAL_SERVICE_ROLE_KEY\""
echo "firebase functions:config:set instantly.api_key=\"YOUR_ACTUAL_INSTANTLY_KEY\""
echo "firebase functions:config:set gemini.api_key=\"YOUR_ACTUAL_GEMINI_KEY\""
echo ""
echo "Or set all at once:"
echo "firebase functions:config:set \\"
echo "  firecrawl.api_key=\"YOUR_KEY\" \\"
echo "  openai.api_key=\"YOUR_KEY\" \\"
echo "  supabase.url=\"YOUR_URL\" \\"
echo "  supabase.anon_key=\"YOUR_KEY\" \\"
echo "  supabase.service_role_key=\"YOUR_KEY\" \\"
echo "  instantly.api_key=\"YOUR_KEY\" \\"
echo "  gemini.api_key=\"YOUR_KEY\""




