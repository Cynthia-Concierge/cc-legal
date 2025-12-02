/**
 * Test script to verify workflow results are being saved to database
 */

import 'dotenv/config';
import { WorkflowResultsService } from './server/services/workflowResultsService.js';

async function testWorkflowSave() {
  console.log('🧪 Testing workflow results save functionality...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'}\n`);

  const service = new WorkflowResultsService(supabaseUrl, supabaseKey);

  // Test data
  const testData = {
    websiteUrl: 'https://example.com',
    leadInfo: {
      name: 'Test User',
      company: 'Test Company',
      email: 'test@example.com'
    },
    legalDocuments: {
      privacyPolicy: 'Test privacy policy content'
    },
    analysis: {
      missingDocuments: ['Terms of Service'],
      issues: [
        {
          document: 'Privacy Policy',
          issue: 'Missing GDPR compliance',
          severity: 'high',
          whyItMatters: 'Required for EU users'
        }
      ],
      recommendations: ['Add Terms of Service', 'Update Privacy Policy'],
      summary: 'Test analysis summary'
    },
    contactInfo: {
      instagram: 'https://instagram.com/test',
      socialLinks: {
        facebook: 'https://facebook.com/test',
        twitter: 'https://twitter.com/test'
      },
      emails: ['contact@example.com', 'info@example.com']
    },
    email: {
      subject: 'Test Email Subject',
      body: 'Test email body content'
    },
    status: 'completed'
  };

  try {
    console.log('📝 Attempting to save test workflow result...');
    const result = await service.saveWorkflowResult(testData);
    
    console.log('✅ Successfully saved workflow result!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Website URL: ${result.website_url}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Created at: ${result.created_at}`);
    
    if (result.scraped_email) {
      console.log(`   Scraped Email: ${result.scraped_email}`);
    }
    if (result.instagram_url) {
      console.log(`   Instagram: ${result.instagram_url}`);
    }
    
    console.log('\n✅ Test passed! The save functionality is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Check your Supabase dashboard to verify the record was created');
    console.log('   2. If this test passes but the workflow doesn\'t save, check server logs');
    console.log('   3. Make sure your server is using the updated code (restart if needed)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error saving workflow result:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    
    if (error.code === '42703') {
      console.error('\n⚠️  Column does not exist error!');
      console.error('   This means the migration script needs to be run in Supabase.');
      console.error('   Run: migration_add_contact_info_and_analyzed_at.sql');
    } else if (error.code === '42501') {
      console.error('\n⚠️  Permission denied error!');
      console.error('   This means RLS policies are blocking the insert.');
      console.error('   Make sure you\'re using SUPABASE_SERVICE_ROLE_KEY (not anon key)');
    }
    
    console.error('\n❌ Test failed!');
    process.exit(1);
  }
}

testWorkflowSave();

