# 📧 Nurture Sequence Emails - Cloud Tasks Setup

## Overview

The nurture sequence emails are scheduled using **Google Cloud Tasks** to send emails at precise times:
- **Day 3**: Case Study Email
- **Day 5**: Risk Scenario Email  
- **Day 7**: Social Proof Email
- **Day 10**: Final Reminder Email

## ✅ What's Been Created

### 1. **Email Service Methods** (`server/services/emailService.ts`)
- ✅ `sendCaseStudyEmail()` - Day 3
- ✅ `sendRiskScenarioEmail()` - Day 5
- ✅ `sendSocialProofEmail()` - Day 7
- ✅ `sendFinalReminderEmail()` - Day 10

### 2. **Cloud Tasks Scheduling Endpoint** (`functions/src/index.ts`)
- ✅ `POST /api/emails/schedule-nurture-sequence` - Schedules all 4 emails at once

### 3. **Worker Endpoints** (`functions/src/index.ts`)
- ✅ `POST /api/workers/send-case-study-email` - Day 3 worker
- ✅ `POST /api/workers/send-risk-scenario-email` - Day 5 worker
- ✅ `POST /api/workers/send-social-proof-email` - Day 7 worker
- ✅ `POST /api/workers/send-final-reminder-email` - Day 10 worker

### 4. **Database Migration** (`migration_add_nurture_sequence_tracking.sql`)
- ✅ Adds tracking fields to `users` table
- ✅ Prevents duplicate emails

### 5. **Frontend Trigger** (`src/pages/wellness/Onboarding.tsx`)
- ✅ Automatically schedules emails when user creates password

## 🚀 Setup Steps

### Step 1: Run Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Copy contents of migration_add_nurture_sequence_tracking.sql
```

Or run:
```bash
psql -h your-supabase-host -U postgres -d postgres -f migration_add_nurture_sequence_tracking.sql
```

This adds:
- `case_study_email_sent_at`
- `risk_scenario_email_sent_at`
- `social_proof_email_sent_at`
- `final_reminder_email_sent_at`

### Step 2: Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Step 3: Create Cloud Tasks Queue (One-Time Setup)

You need to create the Cloud Tasks queue in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Tasks** → **Queues**
3. Click **Create Queue**
4. Name: `email-reminders`
5. Location: `us-central1` (or your preferred region)
6. Click **Create**

**Or use gcloud CLI:**
```bash
gcloud tasks queues create email-reminders \
  --location=us-central1 \
  --project=your-project-id
```

### Step 4: Grant Permissions

The Firebase Functions service account needs permission to create Cloud Tasks:

```bash
# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant Cloud Tasks Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/cloudtasks.admin"
```

### Step 5: Verify Trigger is Working

The emails are automatically scheduled when a user creates their password in the onboarding flow.

**To test manually:**
```bash
curl -X POST https://your-function-url/api/emails/schedule-nurture-sequence \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'
```

## 📋 How It Works

### Flow Diagram

```
User Creates Password
        ↓
Frontend calls: POST /api/emails/schedule-nurture-sequence
        ↓
Cloud Tasks creates 4 scheduled tasks:
  - Day 3: Case Study Email
  - Day 5: Risk Scenario Email
  - Day 7: Social Proof Email
  - Day 10: Final Reminder Email
        ↓
At scheduled time, Cloud Tasks triggers worker endpoint
        ↓
Worker endpoint:
  1. Checks if email already sent (prevents duplicates)
  2. Gets user data from database
  3. Gets business profile data
  4. Sends personalized email
  5. Marks email as sent in database
```

### Scheduling Details

- **Day 3**: 3 days (72 hours) after password creation
- **Day 5**: 5 days (120 hours) after password creation
- **Day 7**: 7 days (168 hours) after password creation
- **Day 10**: 10 days (240 hours) after password creation

## 🔍 Monitoring

### Check Cloud Tasks Queue

```bash
# List tasks in queue
gcloud tasks list --queue=email-reminders --location=us-central1

# View task details
gcloud tasks describe TASK_NAME --queue=email-reminders --location=us-central1
```

### Check Database

```sql
-- See which users have received which emails
SELECT 
  email,
  password_created_at,
  case_study_email_sent_at,
  risk_scenario_email_sent_at,
  social_proof_email_sent_at,
  final_reminder_email_sent_at
FROM users
WHERE password_created_at IS NOT NULL
ORDER BY password_created_at DESC
LIMIT 20;
```

### Check Firebase Functions Logs

```bash
firebase functions:log --only api
```

## 🐛 Troubleshooting

### Emails Not Being Scheduled

1. **Check Cloud Tasks queue exists:**
   ```bash
   gcloud tasks queues describe email-reminders --location=us-central1
   ```

2. **Check permissions:**
   ```bash
   gcloud projects get-iam-policy your-project-id
   ```

3. **Check function logs:**
   ```bash
   firebase functions:log
   ```

### Emails Not Being Sent

1. **Check worker endpoint logs:**
   - Look for `[Case Study Worker]`, `[Risk Scenario Worker]`, etc.
   - Check for errors in Firebase Functions logs

2. **Verify email service:**
   - Check Resend API key is set
   - Check email templates are rendering correctly

3. **Check database:**
   - Verify user exists
   - Verify business profile exists
   - Check if email was already sent (duplicate prevention)

### Manual Testing

**Test scheduling:**
```bash
curl -X POST http://localhost:5001/your-project/us-central1/api/api/emails/schedule-nurture-sequence \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

**Test worker directly (bypass Cloud Tasks):**
```bash
curl -X POST http://localhost:5001/your-project/us-central1/api/api/workers/send-case-study-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

## 📊 Email Sequence Timeline

```
Day 0: User creates password
  → Welcome email (immediate)
  → Nurture sequence scheduled

Day 1: Legal Health Score Email
  → (Already implemented via daily cron)

Day 3: Case Study Email
  → "How a wellness business avoided a $50K lawsuit"

Day 5: Risk Scenario Email
  → "What happens if something goes wrong?"

Day 7: Social Proof Email
  → "Join 1,247+ protected wellness businesses"

Day 10: Final Reminder Email
  → "Last chance: Free consultation expires in 48 hours"
```

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Deploy Firebase Functions
3. ✅ Create Cloud Tasks queue
4. ✅ Grant permissions
5. ✅ Test with a real user
6. ✅ Monitor first few emails

## 📝 Notes

- **Duplicate Prevention**: Each worker checks if email was already sent before sending
- **Idempotent**: Safe to call multiple times - won't send duplicates
- **Error Handling**: If email fails, task can be retried by Cloud Tasks
- **Personalization**: All emails pull user data from database dynamically
- **Business Profile Required**: Some emails require business profile data (will skip if missing)

---

**Ready to automate your nurture sequence!** 🚀

