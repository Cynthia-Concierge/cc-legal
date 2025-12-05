/**
 * Check if the lead in Instantly AI has the custom variables
 * This helps debug why the preview isn't showing
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.INSTANTLY_AI_API_KEY;
const BASE_URL = 'https://api.instantly.ai/api/v2';
const LEAD_EMAIL = 'rickibodner11@gmail.com'; // The test lead we just added

if (!API_KEY) {
  console.log('❌ INSTANTLY_AI_API_KEY not found in .env file');
  process.exit(1);
}

async function checkLeadVariables() {
  console.log('🔍 Checking lead variables in Instantly AI...\n');
  console.log(`Lead Email: ${LEAD_EMAIL}\n`);

  try {
    // Get lead details from Instantly AI
    const response = await fetch(`${BASE_URL}/lead/get?email=${encodeURIComponent(LEAD_EMAIL)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Lead found in Instantly AI:\n');
    console.log('📋 Lead Details:');
    console.log(JSON.stringify(data, null, 2));

    if (data.custom_variables) {
      console.log('\n✅ Custom Variables Found:');
      console.log(JSON.stringify(data.custom_variables, null, 2));
      
      if (data.custom_variables.email_subject) {
        console.log('\n✅ email_subject:', data.custom_variables.email_subject);
      } else {
        console.log('\n❌ email_subject: NOT FOUND');
      }
      
      if (data.custom_variables.email_body_html) {
        console.log('\n✅ email_body_html:', data.custom_variables.email_body_html.substring(0, 200) + '...');
      } else {
        console.log('\n❌ email_body_html: NOT FOUND');
      }
    } else {
      console.log('\n❌ No custom variables found on this lead');
      console.log('   The lead might not have been added with custom variables');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLeadVariables().catch(console.error);
