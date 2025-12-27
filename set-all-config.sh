#!/bin/bash

clear
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Firebase Functions Config Setup                      ║"
echo "║  Copy each value from your .env file                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  FIRECRAWL_API_KEY"
echo "   👉 Open your .env file, find FIRECRAWL_API_KEY, copy the value"
echo "   👉 Paste it here (it will be hidden):"
read -s KEY1
firebase functions:config:set firecrawl.api_key="$KEY1"
echo ""

echo "2️⃣  OPENAI_API_KEY"
echo "   👉 Find OPENAI_API_KEY in .env, copy the value"
echo "   👉 Paste it here (it will be hidden):"
read -s KEY2
firebase functions:config:set openai.api_key="$KEY2"
echo ""

echo "3️⃣  SUPABASE_URL"
echo "   👉 Find SUPABASE_URL in .env, copy the value"
echo "   👉 Paste it here:"
read KEY3
firebase functions:config:set supabase.url="$KEY3"
echo ""

echo "4️⃣  SUPABASE_ANON_KEY"
echo "   👉 Find SUPABASE_ANON_KEY in .env, copy the value"
echo "   👉 Paste it here (it will be hidden):"
read -s KEY4
firebase functions:config:set supabase.anon_key="$KEY4"
echo ""

echo "5️⃣  SUPABASE_SERVICE_ROLE_KEY (optional - press Enter to skip)"
echo "   👉 Find SUPABASE_SERVICE_ROLE_KEY in .env, copy the value"
echo "   👉 Paste it here (it will be hidden) or press Enter:"
read -s KEY5
if [ ! -z "$KEY5" ]; then
  firebase functions:config:set supabase.service_role_key="$KEY5"
fi
echo ""

echo "6️⃣  INSTANTLY_AI_API_KEY (optional - press Enter to skip)"
echo "   👉 Find INSTANTLY_AI_API_KEY in .env, copy the value"
echo "   👉 Paste it here (it will be hidden) or press Enter:"
read -s KEY6
if [ ! -z "$KEY6" ]; then
  firebase functions:config:set instantly.api_key="$KEY6"
fi
echo ""

echo "7️⃣  GEMINI_API_KEY (optional - press Enter to skip)"
echo "   👉 Find GEMINI_API_KEY in .env, copy the value"
echo "   👉 Paste it here (it will be hidden) or press Enter:"
read -s KEY7
if [ ! -z "$KEY7" ]; then
  firebase functions:config:set gemini.api_key="$KEY7"
fi
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Config setup complete!                             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Build frontend: npm run build"
echo "2. Deploy everything: firebase deploy"
echo ""
























