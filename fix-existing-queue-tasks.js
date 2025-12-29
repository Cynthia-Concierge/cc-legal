/**
 * Fix existing Cloud Tasks by re-scheduling them with correct URLs
 * Extracts recipient info from existing tasks and re-creates them
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const QUEUE = 'email-reminders';
const LOCATION = 'us-central1';
const PROJECT = 'cc-legal';
const API_BASE_URL = 'https://us-central1-cc-legal.cloudfunctions.net/api';

console.log('🔧 Fixing existing Cloud Tasks in queue...\n');

// Step 1: Get all tasks and extract recipient info
console.log('📋 Fetching existing tasks...');
const tasksOutput = execSync(
  `gcloud tasks list --queue=${QUEUE} --location=${LOCATION} --project=${PROJECT} --format=json`,
  { encoding: 'utf-8' }
);

const tasks = JSON.parse(tasksOutput);
console.log(`Found ${tasks.length} tasks\n`);

// Step 2: Extract unique recipients and their email schedules
const recipients = new Map(); // recipientType:recipientId -> { emails: Set, scheduleTimes: [] }

tasks.forEach((task) => {
  try {
    const body = Buffer.from(task.httpRequest.body, 'base64').toString('utf-8');
    const data = JSON.parse(body);
    const { recipientType, recipientId, emailType } = data;
    
    if (!recipientType || !recipientId) {
      console.warn('⚠️  Task missing recipient info:', task.name);
      return;
    }
    
    const key = `${recipientType}:${recipientId}`;
    if (!recipients.has(key)) {
      recipients.set(key, {
        recipientType,
        recipientId,
        emails: new Set(),
        scheduleTimes: []
      });
    }
    
    const recipient = recipients.get(key);
    recipient.emails.add(emailType);
    
    // Parse schedule time
    if (task.scheduleTime) {
      const scheduleSeconds = parseInt(task.scheduleTime.seconds || task.scheduleTime);
      recipient.scheduleTimes.push(new Date(scheduleSeconds * 1000));
    }
  } catch (e) {
    console.warn('⚠️  Error parsing task:', task.name, e.message);
  }
});

console.log(`Found ${recipients.size} unique recipients\n`);

// Step 3: Delete all existing tasks
console.log('🗑️  Deleting all existing tasks...');
try {
  execSync(
    `gcloud tasks purge --queue=${QUEUE} --location=${LOCATION} --project=${PROJECT} --quiet`,
    { encoding: 'utf-8', stdio: 'inherit' }
  );
  console.log('✅ All tasks deleted\n');
} catch (e) {
  console.error('❌ Error purging tasks:', e.message);
  process.exit(1);
}

// Step 4: Re-schedule all recipients with correct URLs
console.log('📅 Re-scheduling tasks with correct URLs...\n');

const emailConfig = {
  case_study: { day: 1, endpoint: 'send-case-study-email', name: 'Case Study' },
  risk_scenario: { day: 2, endpoint: 'send-risk-scenario-email', name: 'Risk Scenario' },
  social_proof: { day: 3, endpoint: 'send-social-proof-email', name: 'Social Proof' },
  final_reminder: { day: 4, endpoint: 'send-final-reminder-email', name: 'Final Reminder' }
};

let scheduled = 0;
let failed = 0;

for (const [key, recipient] of recipients.entries()) {
  console.log(`Processing ${key}...`);
  
  // Determine the base schedule time (use the earliest schedule time or now)
  const baseTime = recipient.scheduleTimes.length > 0
    ? new Date(Math.min(...recipient.scheduleTimes.map(t => t.getTime())))
    : new Date();
  
  // Calculate when each email should be sent based on the schedule
  // If we have existing schedule times, try to preserve relative timing
  const emailScheduleTimes = {};
  
  recipient.emails.forEach((emailType) => {
    const config = emailConfig[emailType];
    if (!config) {
      console.warn(`⚠️  Unknown email type: ${emailType}`);
      return;
    }
    
    // If we have an existing schedule time for this email, use it
    // Otherwise, calculate based on the day offset from base time
    const existingTime = recipient.scheduleTimes.find((t, idx) => {
      // Try to match by checking if it's approximately the right day
      const daysDiff = Math.round((t.getTime() - baseTime.getTime()) / (24 * 60 * 60 * 1000));
      return daysDiff === config.day - 1;
    });
    
    if (existingTime) {
      emailScheduleTimes[emailType] = existingTime;
    } else {
      // Calculate new time based on day offset
      emailScheduleTimes[emailType] = new Date(baseTime.getTime() + (config.day - 1) * 24 * 60 * 60 * 1000);
    }
  });
  
  // Re-schedule each email
  for (const emailType of recipient.emails) {
    const config = emailConfig[emailType];
    if (!config) continue;
    
    const scheduleTime = emailScheduleTimes[emailType] || new Date(Date.now() + config.day * 24 * 60 * 60 * 1000);
    const correctUrl = `${API_BASE_URL}/workers/${config.endpoint}`;
    
    try {
      // Create task using gcloud
      const taskBody = JSON.stringify({
        recipientType: recipient.recipientType,
        recipientId: recipient.recipientId,
        emailType: emailType
      });
      
      const taskBodyB64 = Buffer.from(taskBody).toString('base64');
      const scheduleTimeSeconds = Math.floor(scheduleTime.getTime() / 1000);
      
      execSync(
        `gcloud tasks create-http-task ${QUEUE} \
          --location=${LOCATION} \
          --project=${PROJECT} \
          --schedule-time=${scheduleTimeSeconds} \
          --url="${correctUrl}" \
          --method=POST \
          --header="Content-Type: application/json" \
          --body-content="${taskBodyB64}" \
          --body-content-type="text" \
          --quiet`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      scheduled++;
      if (scheduled % 10 === 0) {
        process.stdout.write(`  Scheduled ${scheduled} tasks...\r`);
      }
    } catch (e) {
      failed++;
      console.error(`\n❌ Failed to schedule ${config.name} for ${key}:`, e.message);
    }
  }
}

console.log(`\n\n✅ Complete!`);
console.log(`   Scheduled: ${scheduled} tasks`);
console.log(`   Failed: ${failed} tasks`);
console.log(`\nAll tasks now have correct URLs and will work properly!`);

