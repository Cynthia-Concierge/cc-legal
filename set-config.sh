#!/bin/bash

# Simple script to set Firebase config values
# Just run: ./set-config.sh

echo "=========================================="
echo "Setting Firebase Functions Config"
echo "=========================================="
echo ""

# Function to set a config value
set_config() {
  local name=$1
  local key=$2
  echo ""
  echo "📋 $name"
  echo "   Copy the value from your .env file and paste it here:"
  read -s value
  if [ ! -z "$value" ]; then
    firebase functions:config:set "$key"="$value"
    echo "   ✅ Set!"
  else
    echo "   ⏭️  Skipped (empty)"
  fi
}

# Set each config value
set_config "FIRECRAWL_API_KEY" "firecrawl.api_key"
set_config "OPENAI_API_KEY" "openai.api_key"
set_config "SUPABASE_URL" "supabase.url"
set_config "SUPABASE_ANON_KEY" "supabase.anon_key"
set_config "SUPABASE_SERVICE_ROLE_KEY (optional)" "supabase.service_role_key"
set_config "INSTANTLY_AI_API_KEY (optional)" "instantly.api_key"
set_config "GEMINI_API_KEY (optional)" "gemini.api_key"

echo ""
echo "=========================================="
echo "✅ All done!"
echo "=========================================="
echo ""
echo "Next: Deploy your functions"
echo "Run: firebase deploy --only functions"






