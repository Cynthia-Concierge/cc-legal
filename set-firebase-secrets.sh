#!/bin/bash

# Script to set Firebase Functions secrets from .env file
# Usage: ./set-firebase-secrets.sh

echo "Setting Firebase Functions secrets..."
echo "You'll be prompted to enter each value."
echo ""

# Required secrets
firebase functions:secrets:set FIRECRAWL_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY

# Optional secrets (uncomment if you use them)
# firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
# firebase functions:secrets:set INSTANTLY_AI_API_KEY
# firebase functions:secrets:set GEMINI_API_KEY
# firebase functions:secrets:set USE_AUTOGEN

# Meta/Facebook Pixel secrets
firebase functions:secrets:set META_ACCESS_TOKEN
firebase functions:secrets:set META_PIXEL_ID

echo ""
echo "✅ Secrets set! Remember to deploy: firebase deploy --only functions"



