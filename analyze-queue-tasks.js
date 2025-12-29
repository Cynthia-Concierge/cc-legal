/**
 * Analyze Cloud Tasks queue to see recipient types
 */

import { execSync } from 'child_process';

const queue = 'email-reminders';
const location = 'us-central1';
const project = 'cc-legal';

// Get all tasks
const tasksOutput = execSync(
  `gcloud tasks list --queue=${queue} --location=${location} --project=${project} --format="json"`,
  { encoding: 'utf-8' }
);

const tasks = JSON.parse(tasksOutput);

console.log(`Total tasks: ${tasks.length}\n`);

// Analyze recipient types
const recipientTypes = { user: 0, contact: 0, unknown: 0 };
const recipients = new Set();

tasks.forEach((task, idx) => {
  try {
    const body = Buffer.from(task.httpRequest.body, 'base64').toString('utf-8');
    const data = JSON.parse(body);
    const type = data.recipientType || 'unknown';
    recipientTypes[type] = (recipientTypes[type] || 0) + 1;
    
    if (data.recipientId) {
      recipients.add(`${type}:${data.recipientId}`);
    }
  } catch (e) {
    recipientTypes.unknown++;
  }
});

console.log('Recipient Types:');
console.log(`  Users: ${recipientTypes.user}`);
console.log(`  Contacts: ${recipientTypes.contact}`);
console.log(`  Unknown: ${recipientTypes.unknown}`);
console.log(`\nUnique recipients: ${recipients.size}`);
console.log(`Expected (50 contacts × 4 emails): 200`);
console.log(`Actual total: ${tasks.length}`);
console.log(`Difference: ${tasks.length - 200}`);

