/**
 * Test script to verify OpenAI API key is set in .env
 * Usage: node test-openai-key.js
 */

import('dotenv').then(dotenv => {
  dotenv.default.config();
  
  console.log('🔍 Checking OpenAI API Key Configuration\n');
  console.log('─'.repeat(50));
  
  // Check for VITE_OPENAI_API_KEY (frontend)
  const viteKey = process.env.VITE_OPENAI_API_KEY;
  // Check for OPENAI_API_KEY (backend)
  const backendKey = process.env.OPENAI_API_KEY;
  
  console.log('\n📋 Environment Variables:');
  console.log(`   VITE_OPENAI_API_KEY: ${viteKey ? '✅ Found' : '❌ Not found'}`);
  if (viteKey) {
    console.log(`      Length: ${viteKey.length} characters`);
    console.log(`      Preview: ${viteKey.substring(0, 10)}...${viteKey.substring(viteKey.length - 4)}`);
  }
  
  console.log(`   OPENAI_API_KEY: ${backendKey ? '✅ Found' : '❌ Not found'}`);
  if (backendKey) {
    console.log(`      Length: ${backendKey.length} characters`);
    console.log(`      Preview: ${backendKey.substring(0, 10)}...${backendKey.substring(backendKey.length - 4)}`);
  }
  
  console.log('\n─'.repeat(50));
  
  if (viteKey) {
    console.log('\n✅ VITE_OPENAI_API_KEY is set!');
    console.log('   The Contract Review modal should be able to use OpenAI.');
  } else if (backendKey) {
    console.log('\n⚠️  VITE_OPENAI_API_KEY is not set, but OPENAI_API_KEY is.');
    console.log('   For the frontend Contract Review modal, you need VITE_OPENAI_API_KEY.');
    console.log('   Add this to your .env file:');
    console.log(`   VITE_OPENAI_API_KEY=${backendKey}`);
  } else {
    console.log('\n❌ No OpenAI API key found!');
    console.log('   Please add to your .env file:');
    console.log('   VITE_OPENAI_API_KEY=your-openai-api-key-here');
  }
  
  console.log('\n─'.repeat(50));
  console.log('\n💡 Note: Make sure to restart your dev server after adding/changing .env variables!');
});
