/**
 * Test script for password reset functionality
 * Tests Supabase password reset email sending
 * 
 * Usage: node test-password-reset.js [email]
 */

import('dotenv').then(dotenv => {
  dotenv.default.config();
  runTest();
});

async function runTest() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Please provide an email address');
    console.error('   Usage: node test-password-reset.js your-email@example.com');
    process.exit(1);
  }

  console.log('🧪 Testing Password Reset Functionality\n');
  console.log('─'.repeat(50));
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log('─'.repeat(50));
  console.log('');

  try {
    // Get the redirect URL (should match what's in Login.tsx)
    const redirectUrl = `${process.env.VITE_API_URL || 'http://localhost:5173'}/wellness/reset-password`;
    
    console.log('📤 Sending password reset email...');
    console.log(`   Redirect URL: ${redirectUrl}`);
    console.log('');

    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('❌ Error sending password reset email:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Status: ${error.status || 'N/A'}`);
      console.error('');
      console.error('💡 Troubleshooting:');
      console.error('   1. Check that the email exists in your Supabase users');
      console.error('   2. Verify Supabase email templates are configured');
      console.error('   3. Check Supabase Dashboard → Authentication → Email Templates');
      console.error('   4. Ensure "Reset Password" template is enabled');
      process.exit(1);
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('');
    console.log('📬 Next steps:');
    console.log('   1. Check your email inbox at:', testEmail);
    console.log('   2. Look for an email from Supabase');
    console.log('   3. Click the reset link in the email');
    console.log('   4. You should be redirected to the reset password page');
    console.log('');
    console.log('⚠️  Note:');
    console.log('   - The email may take a few moments to arrive');
    console.log('   - Check your spam folder if you don\'t see it');
    console.log('   - Make sure Supabase email is configured in your project settings');
    console.log('');
    console.log('─'.repeat(50));
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}
