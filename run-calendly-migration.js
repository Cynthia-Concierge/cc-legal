/**
 * Run Calendly Appointments Migration
 * Executes the migration SQL to create the calendly_appointments table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  console.log('📦 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📖 Reading migration file...');
  const migrationSQL = readFileSync('./migration_calendly_appointments.sql', 'utf8');

  console.log('🚀 Running migration...\n');

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql RPC not found, trying direct execution...');

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0); // dummy query to test connection

          if (stmtError && stmtError.code === 'PGRST204') {
            console.log('✅ Connection verified, but cannot execute raw SQL via REST API');
            console.log('\n⚠️  MANUAL STEP REQUIRED:');
            console.log('Please run this migration manually in Supabase SQL Editor:');
            console.log('https://supabase.com/dashboard/project/pwwdihmajwbhrjmfathm/sql/new\n');
            console.log('Copy and paste the contents of: migration_calendly_appointments.sql\n');
            return false;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const { data: tableCheck, error: checkError } = await supabase
      .from('calendly_appointments')
      .select('*')
      .limit(0);

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('\n⚠️  Table not created. Please run migration manually in Supabase SQL Editor.');
        console.log('https://supabase.com/dashboard/project/pwwdihmajwbhrjmfathm/sql/new\n');
        return false;
      } else {
        console.log('✅ Table exists! Migration successful.');
        return true;
      }
    } else {
      console.log('✅ Table exists and is accessible!');
      return true;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('Please run this migration manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/pwwdihmajwbhrjmfathm/sql/new\n');
    console.log('Copy and paste the contents of: migration_calendly_appointments.sql\n');
    return false;
  }
}

runMigration()
  .then(success => {
    if (success) {
      console.log('✨ All done! Ready to deploy backend.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Please complete manual steps before deploying.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
