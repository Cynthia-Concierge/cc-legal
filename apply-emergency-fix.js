import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
  console.log('🚨 APPLYING EMERGENCY AUTHENTICATION FIX...\n');

  try {
    // Read the SQL fix file
    const sql = fs.readFileSync('./EMERGENCY_FIX_AUTH.sql', 'utf8');

    console.log('📄 Loaded SQL fix script');
    console.log('🔧 Executing database fixes...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, we'll need to run this through the Supabase dashboard
      console.error('❌ Cannot execute SQL directly via RPC.');
      console.error('Error:', error);
      console.log('\n📋 MANUAL INSTRUCTIONS:');
      console.log('1. Open your Supabase Dashboard');
      console.log('2. Go to the SQL Editor');
      console.log('3. Copy and paste the contents of EMERGENCY_FIX_AUTH.sql');
      console.log('4. Click "Run" to execute\n');
      process.exit(1);
    }

    console.log('✅ Fix applied successfully!');
    console.log(data);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 MANUAL INSTRUCTIONS:');
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy and paste the contents of EMERGENCY_FIX_AUTH.sql');
    console.log('4. Click "Run" to execute\n');
  }
}

applyFix();
