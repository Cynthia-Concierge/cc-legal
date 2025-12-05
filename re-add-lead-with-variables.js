/**
 * Re-add a lead to Instantly AI with custom variables
 * This ensures the email content is properly attached
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const instantlyApiKey = process.env.INSTANTLY_AI_API_KEY;
const campaignId = process.env.INSTANTLY_CAMPAIGN_ID || '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!instantlyApiKey) {
  console.error('❌ Missing INSTANTLY_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Inline InstantlyService
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
        skip_if_in_campaign: true, // Skip if already in campaign (to update)
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

const instantlyService = new InstantlyService(instantlyApiKey);

async function reAddLeadWithVariables() {
  console.log('🔍 Finding lead with generated email...\n');

  try {
    // Find the most recent workflow result with email
    const { data: results, error } = await supabase
      .from('workflow_results')
      .select('*')
      .not('email_subject', 'is', null)
      .not('email_body', 'is', null)
      .not('lead_email', 'is', null)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!results || results.length === 0) {
      console.log('❌ No leads found with generated emails');
      process.exit(1);
    }

    const workflowResult = results[0];
    
    console.log('✅ Found lead:');
    console.log(`   Email: ${workflowResult.lead_email}`);
    console.log(`   Name: ${workflowResult.lead_name || 'N/A'}`);
    console.log(`   Subject: ${workflowResult.email_subject?.substring(0, 60)}...`);
    console.log(`   Body Length: ${workflowResult.email_body?.length || 0} chars\n`);

    // Prepare custom variables - make sure they're properly formatted
    const customVariables = {
      email_subject: workflowResult.email_subject || '',
      email_body_html: workflowResult.email_body || '',
      email_body: workflowResult.email_body
        .replace(/style="[^"]*"/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    };

    // Split name
    const nameParts = (workflowResult.lead_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const leadData = {
      first_name: firstName,
      last_name: lastName,
      website: workflowResult.website_url,
      custom_variables: customVariables,
    };

    console.log('📤 Adding lead to Instantly AI with custom variables...');
    console.log(`   Campaign: ${campaignId}`);
    console.log(`   Custom Variables:`);
    console.log(`     - email_subject: "${customVariables.email_subject.substring(0, 50)}..."`);
    console.log(`     - email_body_html: ${customVariables.email_body_html.length} chars`);
    console.log(`     - email_body: ${customVariables.email_body.length} chars\n`);

    const result = await instantlyService.addLeadToCampaign(
      workflowResult.lead_email.trim().toLowerCase(),
      campaignId,
      leadData
    );

    console.log('✅ Lead added successfully!\n');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    if (result.created_leads && result.created_leads.length > 0) {
      console.log(`\n✅ Lead ID: ${result.created_leads[0].id}`);
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Go to Instantly AI dashboard');
    console.log('2. Navigate to Leads section');
    console.log('3. Click on the lead:', workflowResult.lead_email);
    console.log('4. Look for "Custom Variables" or "Variables" section');
    console.log('5. You should see: email_subject, email_body_html, email_body');
    console.log('\nNote: Custom variables may not show in the list view.');
    console.log('      You need to click INTO the individual lead to see them.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('401')) {
      console.error('   Check your INSTANTLY_AI_API_KEY');
    }
    process.exit(1);
  }
}

reAddLeadWithVariables().catch(console.error);
