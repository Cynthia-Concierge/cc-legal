# Testing Cloud Tasks Queue - Quick Reference

## 📊 View Queue Status

### Basic Queue Info
```bash
# List all tasks (first 10)
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal

# Count total tasks
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal --format="value(name)" | wc -l
```

### Detailed View
```bash
# See schedule times and URLs
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="table(name,scheduleTime,httpRequest.url)" \
  --limit=20

# Sort by schedule time (see what's next)
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="table(scheduleTime,httpRequest.url)" \
  --sort-by=scheduleTime \
  --limit=10
```

### Tasks by Date
```bash
# Tasks scheduled for tomorrow (Day 1 emails)
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="table(scheduleTime,httpRequest.url)" \
  --filter="scheduleTime:2025-12-30"

# Tasks by email type
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="value(httpRequest.url)" | grep -oE "(case-study|risk-scenario|social-proof|final-reminder)" | sort | uniq -c
```

## 🧪 Test a Task Manually

### Option 1: Run the Test Script
```bash
# Use the helper script
./test-cloud-tasks-queue.sh
```

### Option 2: Manually Trigger a Worker Endpoint
```bash
# Test Case Study email worker directly
curl -X POST https://us-central1-cc-legal.cloudfunctions.net/api/workers/send-case-study-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipientType": "contact",
    "recipientId": "YOUR_CONTACT_ID_HERE",
    "emailType": "case_study"
  }'
```

### Option 3: Get a Specific Task Details
```bash
# Get details of a specific task
gcloud tasks describe TASK_NAME \
  --queue=email-reminders \
  --location=us-central1 \
  --project=cc-legal
```

## 📈 Monitor Task Execution

### Check Dispatch Attempts (After Tasks Run)
```bash
# See tasks that have been attempted
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="table(name,scheduleTime,DISPATCH_ATTEMPTS,LAST_ATTEMPT_STATUS)" \
  --filter="DISPATCH_ATTEMPTS>0"
```

### Monitor Firebase Logs
```bash
# Watch for nurture sequence emails being sent
firebase functions:log --only api | grep -E "Case Study|Risk Scenario|Social Proof|Final Reminder|Nurture Sequence"

# Watch for worker endpoint calls
firebase functions:log --only api | grep "Worker"
```

### Check Email Tracking in Supabase
```sql
-- See which emails have been sent
SELECT 
  recipient_type,
  email_type,
  email_address,
  status,
  created_at
FROM email_tracking
WHERE email_type IN ('case_study', 'risk_scenario', 'social_proof', 'final_reminder')
ORDER BY created_at DESC
LIMIT 50;
```

## 🐛 Troubleshooting

### If Tasks Fail (Check Status)
```bash
# See failed tasks
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="table(name,scheduleTime,LAST_ATTEMPT_STATUS)" \
  --filter="LAST_ATTEMPT_STATUS:FAILED"
```

### Delete Failed Tasks (if needed)
```bash
# Delete a specific task
gcloud tasks delete TASK_NAME \
  --queue=email-reminders \
  --location=us-central1 \
  --project=cc-legal

# Delete all tasks (use with caution!)
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal \
  --format="value(name)" | xargs -I {} gcloud tasks delete {} \
  --queue=email-reminders \
  --location=us-central1 \
  --project=cc-legal
```

## 📅 Current Queue Status

Based on the latest check:
- **Total Tasks**: 224
- **Day 1 (Case Study)**: 56 tasks scheduled for Dec 30
- **Day 2 (Risk Scenario)**: 56 tasks scheduled for Dec 31
- **Day 3 (Social Proof)**: 56 tasks scheduled for Jan 1
- **Day 4 (Final Reminder)**: 56 tasks scheduled for Jan 2

## ⚠️ Known Issue

The existing tasks have URLs with double `/api/api/` which may cause failures. The code has been fixed, but existing tasks need to be re-scheduled.

To fix: Delete existing tasks and re-run the scheduling script.

