#!/usr/bin/env node

/**
 * Test script to verify Supabase user creation is working
 * Run: node test-supabase-user-creation.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.log('\nPlease add to your .env file:');
  console.log('  VITE_SUPABASE_URL=your-url');
  console.log('  VITE_SUPABASE_ANON_KEY=your-key\n');
  process.exit(1);
}

console.log('🔍 Testing Supabase User Creation...\n');
console.log('URL:', supabaseUrl.substring(0, 30) + '...');
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user creation
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!@';

console.log('📧 Creating test user:', testEmail);

const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword,
  options: {
    data: {
      test_user: true
    }
  }
});

if (error) {
  console.error('❌ Error creating user:', error.message);
  console.error('Error details:', {
    message: error.message,
    status: error.status
  });
  process.exit(1);
}

if (data.user) {
  console.log('✅ User created successfully!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log('   Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
  
  if (!data.user.email_confirmed_at) {
    console.log('\n⚠️  Note: Email confirmation is required.');
    console.log('   To disable this in Supabase:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
    console.log('   2. Disable "Enable email confirmations"');
  }
  
  // Try to sign in
  console.log('\n🔐 Testing sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (signInError) {
    console.log('⚠️  Sign in failed (may require email confirmation):', signInError.message);
  } else if (signInData.user) {
    console.log('✅ Sign in successful!');
    console.log('   Session user ID:', signInData.user.id);
  }
  
  console.log('\n✅ Test completed successfully!');
  console.log('   Your Supabase configuration is working correctly.\n');
} else {
  console.error('❌ No user data returned');
  process.exit(1);
}
