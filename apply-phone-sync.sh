#!/bin/bash

# Load environment variables
source .env

# Get the project ref from SUPABASE_URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo "📞 PHONE NUMBER SYNC MIGRATION"
echo "=============================="
echo ""
echo "This will apply phone number syncing between contacts and users tables."
echo ""
echo "To apply this migration, we need your Supabase database password."
echo "This is different from your service role key."
echo ""
echo "You can find it in your Supabase Dashboard:"
echo "1. Go to Project Settings > Database"
echo "2. Look for 'Connection string' or 'Database Password' section"
echo ""
read -sp "Enter your Supabase database password: " DB_PASSWORD
echo ""

# Construct connection string
CONN_STRING="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo ""
echo "📡 Connecting to database..."
echo ""

# Apply the migrations in order
echo "🔧 Step 1/2: Installing phone sync triggers..."
psql "$CONN_STRING" -f migration_sync_phone_numbers.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Triggers installed successfully!"
  echo ""
  echo "🔧 Step 2/2: Backfilling existing phone numbers..."
  psql "$CONN_STRING" -f backfill_phone_numbers.sql

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MIGRATION COMPLETE!"
    echo ""
    echo "📊 What was done:"
    echo "  • Phone sync triggers installed"
    echo "  • Existing phone numbers copied from contacts to users"
    echo "  • Going forward, phones will sync automatically"
    echo ""
  else
    echo ""
    echo "⚠️  Triggers installed but backfill had an issue."
    echo "You can run backfill_phone_numbers.sql manually later."
    echo ""
  fi
else
  echo ""
  echo "❌ Error installing triggers."
  echo ""
  echo "📋 ALTERNATIVE: Manual Application via Supabase Dashboard"
  echo "1. Open https://app.supabase.com"
  echo "2. Select your project"
  echo "3. Go to SQL Editor"
  echo "4. Run migration_sync_phone_numbers.sql"
  echo "5. Run backfill_phone_numbers.sql"
  echo ""
fi
