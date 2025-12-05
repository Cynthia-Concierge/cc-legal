/**
 * Delete a lead from Instantly AI and re-add it with custom variables
 * This ensures the custom variables are properly attached
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const instantlyApiKey = process.env.INSTANTLY_AI_API_KEY;
const campaignId = process.env.INSTANTLY_CAMPAIGN_ID || '7f93b98c-f8c6-4c2b-b707-3ea4d0df6934';

if (!supabaseUrl || !supabaseKey || !instantlyApiKey) {
  console.error('❌ Missing required credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = 'https://api.instantly.ai/api/v2';

async function deleteAndReAddLead() {
  console.log('🔍 Finding lead with generated email...\n');

  try {
    // Find the lead
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
      console.log('❌ No leads found');
      process.exit(1);
    }

    const workflowResult = results[0];
    const leadEmail = workflowResult.lead_email.trim().toLowerCase();
    
    console.log('✅ Found lead:', leadEmail);
    console.log(`   Subject: ${workflowResult.email_subject?.substring(0, 50)}...\n`);

    // Step 1: Try to delete the lead from the campaign
    console.log('🗑️  Attempting to remove lead from campaign...');
    try {
      const deleteResponse = await fetch(`${BASE_URL}/leads/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instantlyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [leadEmail],
          campaign_id: campaignId,
        }),
      });

      if (deleteResponse.ok) {
        console.log('✅ Lead removed from campaign\n');
      } else {
        const deleteData = await deleteResponse.json().catch(() => ({}));
        console.log(`⚠️  Could not remove lead (may not exist): ${deleteData.error || deleteResponse.statusText}\n`);
      }
    } catch (deleteError) {
      console.log(`⚠️  Delete attempt failed (continuing anyway): ${deleteError.message}\n`);
    }

    // Step 2: Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Re-add the lead with custom variables
    console.log('📤 Adding lead with custom variables...');
    
    const nameParts = (workflowResult.lead_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const leadData = {
      leads: [{
        email: leadEmail,
        first_name: firstName,
        last_name: lastName,
        website: workflowResult.website_url,
        custom_variables: {
          email_subject: workflowResult.email_subject || '',
          email_body_html: workflowResult.email_body || '',
          email_body: workflowResult.email_body
            .replace(/style="[^"]*"/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
        },
      }],
      campaign_id: campaignId,
      skip_if_in_workspace: false,
      skip_if_in_campaign: false, // Don't skip - we want to add it fresh
      skip_if_in_list: false,
    };

    const addResponse = await fetch(`${BASE_URL}/leads/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instantlyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!addResponse.ok) {
      const errorData = await addResponse.json().catch(() => ({}));
      throw new Error(`Failed to add lead: ${addResponse.status} - ${errorData.error || addResponse.statusText}`);
    }

    const result = await addResponse.json();
    
    console.log('✅ Lead added successfully!\n');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    if (result.created_leads && result.created_leads.length > 0) {
      console.log(`\n✅ New Lead ID: ${result.created_leads[0].id}`);
    }

    console.log('\n💡 IMPORTANT: Custom variables are NOT visible in the lead list.');
    console.log('   To see them:');
    console.log('   1. Click on the lead:', leadEmail);
    console.log('   2. Look for "Custom Variables" or "Variables" section');
    console.log('   3. You should see: email_subject, email_body_html, email_body');
    console.log('\n   In the preview modal:');
    console.log('   1. Click "Load data for lead:" dropdown');
    console.log('   2. Select:', leadEmail);
    console.log('   3. The preview should populate with the email content');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAndReAddLead().catch(console.error);
