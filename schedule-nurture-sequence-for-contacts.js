/**
 * Script to schedule nurture sequence emails for the 50 most recent contacts
 * This allows testing that Cloud Tasks are working properly
 * 
 * Usage: node schedule-nurture-sequence-for-contacts.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple env file locations
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Use production Firebase Functions URL (override localhost)
const API_URL = process.env.VITE_SERVER_URL?.includes('localhost') 
  ? 'https://us-central1-cc-legal.cloudfunctions.net/api'
  : (process.env.VITE_SERVER_URL || 'https://us-central1-cc-legal.cloudfunctions.net/api');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function scheduleNurtureSequenceForContacts() {
  console.log('📧 Scheduling Nurture Sequence for Recent Contacts\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Get 50 most recent contacts
    console.log('🔍 Fetching 50 most recent contacts...\n');
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching contacts:', error);
      process.exit(1);
    }

    if (!contacts || contacts.length === 0) {
      console.log('⚠️  No contacts found in database');
      process.exit(0);
    }

    console.log(`✅ Found ${contacts.length} contacts\n`);
    console.log('📅 Scheduling nurture sequence emails for each contact...\n');
    console.log('   (Day 1: Case Study, Day 2: Risk Scenario, Day 3: Social Proof, Day 4: Final Reminder)\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const contactDate = contact.created_at ? new Date(contact.created_at).toLocaleString() : 'Unknown';
      
      try {
        console.log(`[${i + 1}/${contacts.length}] Scheduling for: ${contact.email || 'No email'} (${contact.name || 'No name'})`);
        console.log(`   Contact ID: ${contact.id}`);
        console.log(`   Created: ${contactDate}`);

        // API_URL already includes /api, and routes are at /api/..., so we need /api/api/...
        const response = await fetch(`${API_URL}/api/api/emails/schedule-nurture-sequence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId: contact.id
          }),
        });

        const responseText = await response.text();
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error(`   ❌ Invalid JSON response:`, responseText);
          console.error(`   Status: ${response.status}`);
          errorCount++;
          errors.push({ contact: contact.email, error: 'Invalid JSON response', status: response.status });
          continue;
        }

        if (response.status === 200 && result.success) {
          console.log(`   ✅ Scheduled successfully`);
          if (result.tasks && result.tasks.length > 0) {
            console.log(`   📋 Tasks created: ${result.tasks.length}`);
            result.tasks.forEach((task, idx) => {
              if (task.error) {
                console.log(`      ${idx + 1}. ${task.email} (Day ${task.day}): ❌ ${task.error}`);
              } else {
                console.log(`      ${idx + 1}. ${task.email} (Day ${task.day}): ✅ Scheduled for ${new Date(task.scheduledFor).toLocaleString()}`);
              }
            });
          }
          successCount++;
        } else {
          console.error(`   ❌ Scheduling failed:`, result.error || 'Unknown error');
          errorCount++;
          errors.push({ contact: contact.email, error: result.error || 'Unknown error' });
        }

        // Small delay to avoid rate limiting
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(''); // Empty line for readability
      } catch (error) {
        console.error(`   ❌ Error scheduling for ${contact.email}:`, error.message);
        errorCount++;
        errors.push({ contact: contact.email, error: error.message });
        console.log('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully scheduled: ${successCount}/${contacts.length}`);
    console.log(`❌ Failed: ${errorCount}/${contacts.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.contact}: ${err.error}`);
      });
    }

    console.log('\n📅 Next Steps:');
    console.log('1. Check Cloud Tasks queue:');
    console.log('   gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal');
    console.log('\n2. Monitor logs:');
    console.log('   firebase functions:log --only api | grep "Nurture Sequence"');
    console.log('\n3. Emails will be sent:');
    console.log('   - Day 1 (24 hours): Case Study Email');
    console.log('   - Day 2 (48 hours): Risk Scenario Email');
    console.log('   - Day 3 (72 hours): Social Proof Email');
    console.log('   - Day 4 (96 hours): Final Reminder Email');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
scheduleNurtureSequenceForContacts();

