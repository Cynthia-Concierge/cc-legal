/**
 * Test script to find a lead with generated email and send it to Instantly AI
 * This allows you to preview how the email will look in Instantly AI
 * 
 * Usage: node test-send-lead-to-instantly.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
// Import InstantlyService directly (inline implementation)
class InstantlyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.instantly.ai/api/v2";
  }

  async addLeadToCampaign(email, campaignId, leadData) {
    const response = await fetch(`${this.baseUrl}/leads/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        leads: [{
          email,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          company_name: leadData.company,
          website: leadData.website,
          phone: leadData.phone,
          custom_variables: leadData.custom_variables || {},
        }],
        campaign_id: campaignId,
        skip_if_in_workspace: false,
        skip_if_in_campaign: false,
        skip_if_in_list: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || response.statusText;
      throw new Error(`Instantly.ai API error: ${response.status} - ${errorMessage}`);
    }

    return await response.json();
  }
}

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const instantlyApiKey = process.env.INSTANTLY_AI_API_KEY;
const campaignId = process.env.INSTANTLY_CAMPAIGN_ID || '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

if (!instantlyApiKey) {
  console.error('❌ Missing INSTANTLY_AI_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const instantlyService = new InstantlyService(instantlyApiKey);

async function findAndSendTestLead() {
  console.log('🔍 Finding a lead with generated email...\n');

  try {
    // Find a workflow result with email_subject and email_body
    const { data: results, error } = await supabase
      .from('workflow_results')
      .select('*')
      .not('email_subject', 'is', null)
      .not('email_body', 'is', null)
      .not('lead_email', 'is', null)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!results || results.length === 0) {
      console.log('❌ No leads found with generated emails in workflow_results table');
      console.log('   Make sure you have run the workflow at least once');
      process.exit(1);
    }

    const workflowResult = results[0];
    
    console.log('✅ Found lead with generated email:');
    console.log(`   Lead Name: ${workflowResult.lead_name || 'N/A'}`);
    console.log(`   Lead Email: ${workflowResult.lead_email}`);
    console.log(`   Website: ${workflowResult.website_url}`);
    console.log(`   Email Subject: ${workflowResult.email_subject?.substring(0, 50)}...`);
    console.log(`   Email Body Length: ${workflowResult.email_body?.length || 0} characters\n`);

    // Clean up the email body HTML for Instantly AI
    const cleanEmailBody = workflowResult.email_body
      .replace(/style="[^"]*line-height:\s*[^;"]*[^"]*"/g, '')
      .replace(/style="[^"]*margin[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Split name into first and last
    const nameParts = (workflowResult.lead_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare lead data with email content as custom variables
    const leadData = {
      first_name: firstName,
      last_name: lastName,
      website: workflowResult.website_url,
      custom_variables: {
        email_subject: workflowResult.email_subject,
        email_body_html: workflowResult.email_body, // Full HTML version
        email_body: cleanEmailBody, // Cleaned version as backup
      },
    };

    console.log('📤 Adding lead to Instantly AI with email content...');
    console.log(`   Campaign ID: ${campaignId}`);
    console.log(`   Custom Variables:`);
    console.log(`     - email_subject: ${workflowResult.email_subject?.substring(0, 50)}...`);
    console.log(`     - email_body_html: ${workflowResult.email_body?.length || 0} characters`);
    console.log(`     - email_body: ${cleanEmailBody.length} characters\n`);

    const result = await instantlyService.addLeadToCampaign(
      workflowResult.lead_email.trim().toLowerCase(),
      campaignId,
      leadData
    );

    console.log('✅ Successfully added lead to Instantly AI!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Instantly AI dashboard');
    console.log('2. Navigate to your campaign');
    console.log('3. Find the lead:', workflowResult.lead_email);
    console.log('4. Click on the lead to view custom variables');
    console.log('5. Preview the email in your sequence to see how it looks');
    console.log('\n💡 The email will be sent 24 hours after the lead was added');
    console.log('   (based on your campaign sequence delay settings)');

    if (result.created_leads && result.created_leads.length > 0) {
      console.log(`\n✅ Lead ID in Instantly AI: ${result.created_leads[0].id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('401')) {
      console.error('   Check your INSTANTLY_AI_API_KEY in .env');
    } else if (error.message?.includes('400')) {
      console.error('   Check your campaign ID and lead data format');
    }
    process.exit(1);
  }
}

// Run the script
findAndSendTestLead().catch(console.error);
