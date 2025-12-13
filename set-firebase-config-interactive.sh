#!/bin/bash

echo "=========================================="
echo "Firebase Functions Config Setup"
echo "=========================================="
echo ""
echo "This script will prompt you to enter each value from your .env file"
echo "You can copy-paste each value when prompted"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "1. Enter FIRECRAWL_API_KEY (copy from .env and paste):"
read -s FIRECRAWL_KEY
firebase functions:config:set firecrawl.api_key="$FIRECRAWL_KEY"

echo ""
echo "2. Enter OPENAI_API_KEY (copy from .env and paste):"
read -s OPENAI_KEY
firebase functions:config:set openai.api_key="$OPENAI_KEY"

echo ""
echo "3. Enter SUPABASE_URL (copy from .env and paste):"
read SUPABASE_URL
firebase functions:config:set supabase.url="$SUPABASE_URL"

echo ""
echo "4. Enter SUPABASE_ANON_KEY (copy from .env and paste):"
read -s SUPABASE_ANON
firebase functions:config:set supabase.anon_key="$SUPABASE_ANON"

echo ""
echo "5. Enter SUPABASE_SERVICE_ROLE_KEY (copy from .env and paste, or press Enter to skip):"
read -s SUPABASE_SERVICE
if [ ! -z "$SUPABASE_SERVICE" ]; then
  firebase functions:config:set supabase.service_role_key="$SUPABASE_SERVICE"
fi

echo ""
echo "6. Enter INSTANTLY_AI_API_KEY (copy from .env and paste, or press Enter to skip):"
read -s INSTANTLY_KEY
if [ ! -z "$INSTANTLY_KEY" ]; then
  firebase functions:config:set instantly.api_key="$INSTANTLY_KEY"
fi

echo ""
echo "7. Enter GEMINI_API_KEY (copy from .env and paste, or press Enter to skip):"
read -s GEMINI_KEY
if [ ! -z "$GEMINI_KEY" ]; then
  firebase functions:config:set gemini.api_key="$GEMINI_KEY"
fi

echo ""
echo "=========================================="
echo "✅ Config setup complete!"
echo "=========================================="
echo ""
echo "Next step: Deploy your functions"
echo "Run: firebase deploy --only functions"







