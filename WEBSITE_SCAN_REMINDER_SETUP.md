# Website Scan Reminder Email Setup

## Overview

This system automatically sends reminder emails to users who have completed their business profile but haven't scanned their website yet. The email is sent 24 hours after they first save their business profile.

## How It Works

1. **User completes business profile** → Profile saved to `business_profiles` table with `created_at` timestamp
2. **24 hours pass** → System checks if user has scanned website
3. **If not scanned** → Reminder email is sent
4. **Email sent tracked** → `website_scan_reminder_sent_at` is set to prevent duplicates

## Setup Steps

### 1. Run Database Migration

Run `migration_add_website_scan_tracking.sql` in Supabase SQL Editor to add:
- `has_scanned_website` (boolean) - Tracks if user has scanned
- `website_scan_completed_at` (timestamp) - When scan was completed
- `website_scan_reminder_sent_at` (timestamp) - When reminder was sent

### 2. Set Up Daily Automation

✅ **AUTOMATED - Already Set Up!**

The cron job is already configured in Firebase Functions. The scheduled function `sendWebsiteScanReminders` runs automatically every day at 10:00 AM UTC.

**What's already done:**
- ✅ Scheduled function created in `functions/src/index.ts`
- ✅ Runs daily at 10:00 AM UTC
- ✅ Has access to all required secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY)
- ✅ Endpoint `/api/emails/send-website-scan-reminders` is available for manual triggers

**To deploy the scheduled function:**
```bash
cd functions
npm run build
firebase deploy --only functions:sendWebsiteScanReminders
```

**Manual trigger (for testing):**
```bash
# Via HTTP endpoint
curl -X POST https://your-domain.com/api/emails/send-website-scan-reminders

# Or trigger the scheduled function directly (after deployment)
# The function will run automatically, but you can also test it manually
```

## Query Logic

The endpoint finds users who:
- ✅ Have `business_name` (profile is complete)
- ✅ Have `website_url` (they have a website to scan)
- ✅ `has_scanned_website = false` (haven't scanned yet)
- ✅ `created_at < 24 hours ago` (24 hours have passed since profile creation)
- ✅ `website_scan_reminder_sent_at IS NULL` OR `website_scan_reminder_sent_at < 7 days ago` (haven't been sent reminder recently)

## Email Flow

```
User saves business profile
    ↓
24 hours pass
    ↓
Daily cron job runs
    ↓
System checks: Has user scanned? (has_scanned_website = false)
    ↓
If NO → Send reminder email
    ↓
Update: website_scan_reminder_sent_at = now()
```

## Testing

1. **Create a test profile** with business name and website
2. **Wait 24 hours** (or manually adjust the timestamp in database)
3. **Call the endpoint** manually:
   ```bash
   curl -X POST http://localhost:3001/api/emails/send-website-scan-reminders
   ```
4. **Check response** - should show how many emails were sent

## Monitoring

The endpoint returns:
```json
{
  "success": true,
  "message": "Sent 5 reminder emails",
  "sent": 5,
  "failed": 0,
  "total": 5,
  "results": [...]
}
```

## Preventing Duplicate Emails

- `website_scan_reminder_sent_at` tracks when reminder was sent
- System won't send another reminder for 7 days (allows re-engagement if they still haven't scanned)
- Once user scans website, `has_scanned_website = true` and they're removed from eligible list

## Notes

- The system uses `created_at` (when profile was first saved) not `updated_at` (which changes on every edit)
- Emails are only sent to users with both `business_name` and `website_url`
- The endpoint is idempotent - safe to call multiple times

