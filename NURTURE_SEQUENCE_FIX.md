# Nurture Sequence Email Scheduling - Fix Summary

## Problem Identified

The nurture sequence emails were not being scheduled because:

1. **Wrong Project ID**: The Cloud Tasks queue was created in `gen-lang-client-0046334557` but Firebase Functions run in `cc-legal`
2. **Missing Queue**: No queue existed in the correct project
3. **Project ID Detection**: The code wasn't reliably detecting the project ID in Firebase Functions v2

## Fixes Applied

### 1. Created Cloud Tasks Queue in Correct Project ✅
```bash
gcloud tasks queues create email-reminders --location=us-central1 --project=cc-legal
```

### 2. Granted Permissions ✅
```bash
gcloud projects add-iam-policy-binding cc-legal \
  --member="serviceAccount:923928456440-compute@developer.gserviceaccount.com" \
  --role="roles/cloudtasks.admin"
```

### 3. Improved Project ID Detection ✅
Updated `functions/src/index.ts` to detect project ID using multiple methods:
- Extract from request host (most reliable)
- Firebase Admin SDK
- Environment variables
- Metadata service (fallback)

## Next Steps

### 1. Rebuild and Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 2. Test the Scheduling
After deployment, test with a real user:
```bash
node test-nurture-sequence-scheduling.js <user-id>
```

Or manually:
```bash
curl -X POST https://cc-legal.web.app/api/emails/schedule-nurture-sequence \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id-here"}'
```

### 3. Verify Tasks Are Created
```bash
gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal
```

You should see 4 tasks (one for each email: Day 3, 5, 7, 10).

### 4. Monitor Logs
```bash
firebase functions:log --only api | grep "Nurture Sequence"
```

## How It Works Now

1. **User creates password** → Frontend calls `/api/emails/schedule-nurture-sequence`
2. **Endpoint detects project ID** → Uses `cc-legal` (extracted from request host)
3. **Creates 4 Cloud Tasks** → One for each email (Day 3, 5, 7, 10)
4. **Tasks stored in queue** → `email-reminders` queue in `cc-legal` project
5. **At scheduled time** → Cloud Tasks triggers worker endpoint
6. **Worker sends email** → Checks for duplicates, sends personalized email

## Email Schedule

- **Day 3**: Case Study Email (72 hours after password creation)
- **Day 5**: Risk Scenario Email (120 hours after password creation)
- **Day 7**: Social Proof Email (168 hours after password creation)
- **Day 10**: Final Reminder Email (240 hours after password creation)

## Troubleshooting

### If tasks still aren't being created:

1. **Check project ID detection**:
   ```bash
   firebase functions:log --only api | grep "Using project ID"
   ```

2. **Check for errors**:
   ```bash
   firebase functions:log --only api | grep "Nurture Sequence"
   ```

3. **Verify queue exists**:
   ```bash
   gcloud tasks queues describe email-reminders --location=us-central1 --project=cc-legal
   ```

4. **Check permissions**:
   ```bash
   gcloud projects get-iam-policy cc-legal --flatten="bindings[].members" \
     --filter="bindings.members:*compute@developer.gserviceaccount.com"
   ```

## Status

✅ Queue created in correct project
✅ Permissions granted
✅ Code updated with better project ID detection
⏳ **Pending**: Rebuild and deploy functions

