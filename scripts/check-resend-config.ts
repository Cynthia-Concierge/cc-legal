import { Resend } from 'resend';
import 'dotenv/config';

/**
 * Diagnostic script to check Resend configuration and domain verification status
 */
async function checkResendConfig() {
  console.log('🔍 Checking Resend Configuration...\n');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.error('   Set it in your .env file or Firebase Functions secrets');
    process.exit(1);
  }

  console.log(`✅ RESEND_API_KEY is set (${apiKey.substring(0, 8)}...)`);
  console.log(`📧 EMAIL_FROM_ADDRESS: ${fromEmail}\n`);

  if (fromEmail === 'onboarding@resend.dev') {
    console.warn('⚠️  WARNING: Using default "onboarding@resend.dev"');
    console.warn('   This email can ONLY send to the Resend account owner\'s email');
    console.warn('   To send to other users, you must verify a domain in Resend\n');
  }

  try {
    const resend = new Resend(apiKey);

    // Check domains
    console.log('📋 Checking verified domains...');
    const { data: domains, error: domainsError } = await resend.domains.list();

    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError);
      console.error('   This might indicate an invalid API key');
      process.exit(1);
    }

    if (!domains || domains.data.length === 0) {
      console.warn('⚠️  No domains found in your Resend account');
      console.warn('   You need to verify a domain to send emails to users');
      console.warn('   Go to: https://resend.com/domains\n');
    } else {
      console.log(`✅ Found ${domains.data.length} domain(s):\n`);
      domains.data.forEach((domain: any) => {
        const status = domain.status || 'unknown';
        const statusIcon = status === 'verified' ? '✅' : '⚠️';
        console.log(`   ${statusIcon} ${domain.name} (${status})`);
        if (domain.region) {
          console.log(`      Region: ${domain.region}`);
        }
        if (domain.created_at) {
          console.log(`      Created: ${new Date(domain.created_at).toLocaleDateString()}`);
        }
      });
      console.log('');
    }

    // Extract domain from fromEmail
    const emailDomain = fromEmail.split('@')[1];
    console.log(`🔍 Checking if "${fromEmail}" uses a verified domain...`);

    if (fromEmail === 'onboarding@resend.dev') {
      console.log('   Using default Resend domain (onboarding@resend.dev)');
      console.log('   This can only send to the account owner\n');
    } else if (domains?.data) {
      const verifiedDomain = domains.data.find((d: any) => 
        d.name === emailDomain && d.status === 'verified'
      );

      if (verifiedDomain) {
        console.log(`   ✅ Domain "${emailDomain}" is verified!`);
        console.log('   You should be able to send emails to any recipient\n');
      } else {
        console.error(`   ❌ Domain "${emailDomain}" is NOT verified in Resend`);
        console.error('   This is why you are getting 403 errors!');
        console.error(`   Solution: Verify "${emailDomain}" in Resend Dashboard → Domains\n`);
      }
    }

    // Test sending capability
    console.log('🧪 Testing API key permissions...');
    try {
      // Try to get API keys list to verify the key works
      const { data: keys, error: keysError } = await resend.apiKeys.list();
      if (keysError) {
        console.error('   ❌ API key validation failed:', keysError);
      } else {
        console.log('   ✅ API key is valid');
        if (keys?.data && keys.data.length > 0) {
          console.log(`   Found ${keys.data.length} API key(s) in account`);
        }
      }
    } catch (err: any) {
      console.error('   ❌ Error validating API key:', err.message);
    }

    console.log('\n📝 Summary:');
    console.log('─'.repeat(50));
    
    if (fromEmail === 'onboarding@resend.dev') {
      console.log('❌ Problem: Using default domain that can only send to account owner');
      console.log('✅ Solution: Verify a domain in Resend and set EMAIL_FROM_ADDRESS');
    } else if (domains?.data?.some((d: any) => d.name === emailDomain && d.status === 'verified')) {
      console.log('✅ Configuration looks good!');
      console.log('   If emails still fail, check:');
      console.log('   1. API key has "Send Emails" permission');
      console.log('   2. Domain DNS records are properly configured');
      console.log('   3. Check Resend logs for specific error messages');
    } else {
      console.log('❌ Problem: FROM email domain is not verified');
      console.log('✅ Solution: Verify the domain in Resend Dashboard');
    }
    
    console.log('─'.repeat(50));
    console.log('\n🔗 Useful Links:');
    console.log('   Resend Dashboard: https://resend.com/domains');
    console.log('   Resend Docs: https://resend.com/docs/dashboard/domains/introduction');

  } catch (error: any) {
    console.error('❌ Error checking Resend configuration:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

checkResendConfig();
