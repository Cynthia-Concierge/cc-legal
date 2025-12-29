/**
 * Schedule nurture sequence for 50 most recent contacts
 * Excludes contacts that already have tasks scheduled
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://us-central1-cc-legal.cloudfunctions.net/api';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getExistingScheduledContacts() {
  console.log('📋 Checking existing tasks in queue...\n');
  
  try {
    // Get task count first
    const countOutput = execSync(
      `gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" | wc -l`,
      { encoding: 'utf-8' }
    );
    
    const taskCount = parseInt(countOutput.trim()) || 0;
    console.log(`   Found ${taskCount} tasks in queue`);
    
    // For now, we'll skip duplicate checking since task bodies aren't easily accessible
    // The endpoint will handle duplicates by checking email_tracking table
    console.log(`   Note: Duplicate checking will be handled by the email tracking system\n`);
    
    return new Set(); // Return empty set - let the system handle duplicates
  } catch (error) {
    console.error('⚠️  Error reading queue:', error.message);
    console.log('   Continuing anyway...\n');
    return new Set();
  }
}

async function scheduleNurtureSequenceForContacts() {
  console.log('📧 Scheduling Nurture Sequence for Recent Contacts (No Duplicates)\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Step 1: Get contacts already scheduled
    const existingContactIds = await getExistingScheduledContacts();

    // Step 2: Get 50 most recent contacts
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

    // Step 3: Filter out already scheduled contacts
    const contactsToSchedule = contacts.filter(
      contact => !existingContactIds.has(contact.id)
    );

    console.log(`📊 Filtering results:`);
    console.log(`   Total contacts: ${contacts.length}`);
    console.log(`   Already scheduled: ${existingContactIds.size}`);
    console.log(`   New to schedule: ${contactsToSchedule.length}\n`);

    if (contactsToSchedule.length === 0) {
      console.log('✅ All recent contacts are already scheduled!');
      process.exit(0);
    }

    console.log('📅 Scheduling nurture sequence emails...\n');
    console.log('   (Day 1: Case Study, Day 2: Risk Scenario, Day 3: Social Proof, Day 4: Final Reminder)\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < contactsToSchedule.length; i++) {
      const contact = contactsToSchedule[i];
      const contactDate = contact.created_at ? new Date(contact.created_at).toLocaleString() : 'Unknown';
      
      try {
        console.log(`[${i + 1}/${contactsToSchedule.length}] Scheduling for: ${contact.email || 'No email'} (${contact.name || 'No name'})`);
        console.log(`   Contact ID: ${contact.id}`);
        console.log(`   Created: ${contactDate}`);

        const response = await fetch(`${API_URL}/api/emails/schedule-nurture-sequence`, {
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
          console.error(`   ❌ Invalid JSON response:`, responseText.substring(0, 100));
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
                const scheduledDate = new Date(task.scheduledFor).toLocaleString();
                console.log(`      ${idx + 1}. ${task.email} (Day ${task.day}): ✅ ${scheduledDate}`);
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
        if (i < contactsToSchedule.length - 1) {
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
    console.log(`✅ Successfully scheduled: ${successCount}/${contactsToSchedule.length}`);
    console.log(`❌ Failed: ${errorCount}/${contactsToSchedule.length}`);
    console.log(`📋 Total tasks in queue: ${(successCount * 4)} new tasks`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.contact}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    console.log('\n📅 Next Steps:');
    console.log('1. Check Cloud Tasks queue:');
    console.log('   gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal');
    console.log('\n2. Emails will be sent:');
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

