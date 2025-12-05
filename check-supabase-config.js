#!/usr/bin/env node

/**
 * Quick script to check if Supabase environment variables are properly configured
 * Run: node check-supabase-config.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking Supabase Configuration...\n');

// Check for .env file
const envPath = join(__dirname, '.env');
let envContent = '';

try {
  envContent = readFileSync(envPath, 'utf-8');
  console.log('✅ Found .env file\n');
} catch (error) {
  console.error('❌ .env file not found in project root!');
  console.log('\nPlease create a .env file in the root directory with:');
  console.log('  VITE_SUPABASE_URL=your-url');
  console.log('  VITE_SUPABASE_ANON_KEY=your-key\n');
  process.exit(1);
}

// Parse .env file
const envVars = {};
const lines = envContent.split('\n');

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      envVars[key] = value;
    }
  }
});

// Check for required variables
console.log('📋 Environment Variables Check:\n');

const requiredVars = {
  'VITE_SUPABASE_URL': 'Frontend Supabase URL',
  'VITE_SUPABASE_ANON_KEY': 'Frontend Supabase Anon Key',
  'SUPABASE_URL': 'Backend Supabase URL (optional)',
  'SUPABASE_ANON_KEY': 'Backend Supabase Anon Key (optional)'
};

let allGood = true;

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = envVars[varName];
  if (value) {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`✅ ${varName}: ${description}`);
    console.log(`   Value: ${preview}\n`);
  } else {
    if (varName.startsWith('VITE_')) {
      console.log(`❌ ${varName}: ${description} - MISSING!\n`);
      allGood = false;
    } else {
      console.log(`⚠️  ${varName}: ${description} - Not set (optional for backend)\n`);
    }
  }
}

// Validate format
if (envVars.VITE_SUPABASE_URL) {
  try {
    const url = new URL(envVars.VITE_SUPABASE_URL);
    if (!url.hostname.includes('supabase.co')) {
      console.log('⚠️  Warning: VITE_SUPABASE_URL doesn\'t look like a Supabase URL\n');
    }
  } catch (e) {
    console.log('❌ Error: VITE_SUPABASE_URL is not a valid URL\n');
    allGood = false;
  }
}

if (envVars.VITE_SUPABASE_ANON_KEY) {
  if (!envVars.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    console.log('⚠️  Warning: VITE_SUPABASE_ANON_KEY doesn\'t look like a valid JWT token\n');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Configuration looks good!');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure your dev server is running');
  console.log('   2. If you just added these variables, restart the dev server:');
  console.log('      npm run dev');
  console.log('   3. Check the browser console for Supabase connection status');
} else {
  console.log('❌ Configuration incomplete!');
  console.log('\n📝 To fix:');
  console.log('   1. Add the missing variables to your .env file');
  console.log('   2. Make sure they have the VITE_ prefix for frontend');
  console.log('   3. Restart your dev server after adding variables');
  console.log('   4. Run this script again to verify');
}
console.log('='.repeat(50) + '\n');
