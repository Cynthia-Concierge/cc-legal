#!/bin/bash

# Load environment variables
source .env

# Extract database URL components
# Supabase URLs are typically: https://xxx.supabase.co
# PostgreSQL connection: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# Get the project ref from SUPABASE_URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

# Construct the PostgreSQL connection string
# Note: You'll need your database password, not the service role key
echo "🚨 EMERGENCY FIX APPLICATION"
echo "=============================="
echo ""
echo "To apply this fix, we need your Supabase database password."
echo "This is different from your service role key."
echo ""
echo "You can find it in your Supabase Dashboard:"
echo "1. Go to Project Settings > Database"
echo "2. Look for 'Database Password' section"
echo ""
read -sp "Enter your Supabase database password: " DB_PASSWORD
echo ""

# Construct connection string
CONN_STRING="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo ""
echo "📡 Connecting to database..."
echo "🔧 Applying emergency fix..."
echo ""

# Apply the fix
psql "$CONN_STRING" -f EMERGENCY_FIX_AUTH.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ FIX APPLIED SUCCESSFULLY!"
  echo ""
else
  echo ""
  echo "❌ Error applying fix."
  echo ""
  echo "📋 ALTERNATIVE: Manual Application via Supabase Dashboard"
  echo "1. Open https://app.supabase.com"
  echo "2. Select your project"
  echo "3. Go to SQL Editor"
  echo "4. Copy the contents of EMERGENCY_FIX_AUTH.sql"
  echo "5. Paste and run it"
  echo ""
fi
