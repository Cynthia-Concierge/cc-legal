import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testLogin() {
  console.log('🔐 TESTING LOGIN\n');

  try {
    const email = await question('Enter email: ');
    const password = await question('Enter password: ');
    console.log('');

    // Create client with anon key (same as frontend)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    console.log('Attempting to sign in...\n');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.log('❌ LOGIN FAILED\n');
      console.log('Error Details:');
      console.log('  Message:', error.message);
      console.log('  Status:', error.status);
      console.log('  Name:', error.name);
      console.log('  Code:', error.code);
      console.log('\nFull error:', JSON.stringify(error, null, 2));
      rl.close();
      return;
    }

    if (data.session) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('Session Details:');
      console.log('  User ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('  Email Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('  Access Token:', data.session.access_token.substring(0, 50) + '...');
      console.log('\n🎉 Login works! The issue might be in the frontend code or browser state.');
    } else {
      console.log('⚠️  No session created but no error either');
    }

  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error(err);
  } finally {
    rl.close();
  }
}

testLogin();
