import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import postgres from 'postgres';

dotenv.config();

async function applyFix() {
  console.log('🚨 APPLYING EMERGENCY AUTHENTICATION FIX...\n');

  try {
    // Extract project ref from Supabase URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
      process.exit(1);
    }

    // For Supabase, we need the database password to connect via PostgreSQL
    // Service role key is for REST API, not direct database connections
    console.log('⚠️  This script requires your Supabase database password.');
    console.log('    You can find it in: Supabase Dashboard > Project Settings > Database\n');
    console.log('📋 RECOMMENDED: Use Supabase SQL Editor instead');
    console.log('   1. Open https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of EMERGENCY_FIX_AUTH.sql');
    console.log('   5. Click "Run"\n');
    console.log('This is the fastest and safest method.\n');

    // Read the SQL for display purposes
    const sql = fs.readFileSync('./EMERGENCY_FIX_AUTH.sql', 'utf8');
    console.log(`📄 SQL fix is ${sql.length} characters and contains:`);
    console.log('   - Drop all conflicting policies and triggers');
    console.log('   - Recreate users and contacts tables with proper RLS');
    console.log('   - Create SECURITY DEFINER triggers to bypass RLS');
    console.log('   - Backfill existing data');
    console.log('   - Verify the fix\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

applyFix();
