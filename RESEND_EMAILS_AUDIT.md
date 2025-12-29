# Resend Emails Audit - Complete List

## Summary
This document lists all Resend emails currently configured in the codebase, where they're triggered, and their current status.

---

## ✅ **ACTIVE EMAILS (Currently Being Sent)**

### 1. **Welcome Email** ✅ WORKING
- **Method**: `EmailService.sendWelcomeEmail()`
- **Endpoint**: `POST /api/emails/welcome`
- **Triggered From**:
  - `src/pages/wellness/Onboarding.tsx` (line 262) - When user creates password
  - `src/pages/wellness/BusinessProfile.tsx` (line 449) - When user saves business profile
- **Status**: ✅ **ACTIVE** - You confirmed this is working in Resend logs
- **Subject**: "Welcome to Conscious Counsel! 🛡️"
- **When Sent**: Immediately after user creates password during onboarding

---

## 📧 **SCHEDULED/REMINDER EMAILS (May or May Not Be Active)**

### 3. **Website Scan Reminder Email** ⚠️ STATUS UNKNOWN
- **Method**: `EmailService.sendWebsiteScanReminder()`
- **Endpoint**: `POST /api/emails/send-website-scan-reminders`
- **Triggered From**:
  - Scheduled cron job (should run daily at 10:00 AM UTC via Firebase Functions)
  - Can be manually triggered via endpoint
- **Status**: ⚠️ **NEEDS VERIFICATION** - Endpoint exists but unclear if cron is active
- **Subject**: "Found something on your website..."
- **When Sent**: 24 hours after user creates business profile, if they haven't scanned their website yet
- **Requirements**:
  - User has `business_name` and `website_url` in profile
  - `has_scanned_website = false`
  - Profile created >24 hours ago
  - `website_scan_reminder_sent_at` is NULL or >7 days ago
- **Documentation**: See `WEBSITE_SCAN_REMINDER_SETUP.md`

---

### 4. **Profile Completion Reminder Email** ⚠️ STATUS UNKNOWN
- **Method**: `EmailService.sendProfileCompletionReminder()`
- **Endpoint**: `POST /api/emails/schedule-profile-completion-reminder` (schedules via Cloud Tasks)
- **Worker Endpoint**: `POST /api/workers/send-profile-completion-reminder`
- **Triggered From**:
  - Should be scheduled when user creates password (via Cloud Tasks)
  - Firebase Functions endpoint exists (line 806 in `functions/src/index.ts`)
- **Status**: ⚠️ **NEEDS VERIFICATION** - Endpoint exists but unclear if it's being triggered
- **Subject**: "Quick question about your business..."
- **When Sent**: 24 hours after user creates password, if profile is incomplete
- **Note**: Uses Google Cloud Tasks for scheduling

---

### 5. **Legal Health Score Email** ⚠️ STATUS UNKNOWN
- **Method**: `EmailService.sendLegalHealthScoreEmail()`
- **Endpoint**: `POST /api/emails/send-legal-health-score`
- **Triggered From**:
  - Should be called via daily cron job
  - Can be manually triggered via endpoint
- **Status**: ⚠️ **NEEDS VERIFICATION** - Endpoint exists but unclear if cron is active
- **Subject**: Dynamic based on risk level:
  - High risk: "{Name}, your business has {score} risk points"
  - Moderate: "Your Legal Health Score: {score}/100"
  - Low: "Good news about your legal protection"
- **When Sent**: 24 hours after user creates password, if they have completed business profile
- **Requirements**:
  - User created password >24 hours ago
  - Has completed business profile (`business_name` is set and not default)
  - `legal_health_score_email_sent_at` is NULL
- **Documentation**: See `LEGAL_HEALTH_SCORE_EMAIL_SETUP.md`

---

## 🎯 **ACTION-BASED EMAILS (Triggered by User Actions)**

### 6. **Trademark Risk Report Email** ⚠️ STATUS UNKNOWN
- **Method**: `EmailService.sendTrademarkRiskReport()`
- **Endpoint**: `POST /api/trademark/risk-report` (Firebase Functions)
- **Triggered From**:
  - `src/components/wellness/TrademarkQuizModal.tsx` - When user completes trademark quiz
  - `src/pages/wellness/dashboard/TrademarkScanPage.tsx` - When user submits trademark quiz
- **Status**: ⚠️ **NEEDS VERIFICATION** - Code exists but unclear if real users are receiving it
- **Subject**: "Your Trademark Risk Snapshot for {businessName}"
- **Attachments**: PDF report (if generated successfully)
- **When Sent**: Immediately after user completes trademark quiz
- **Note**: Also sends admin alert (see #7 below)

---

### 7. **Admin Trademark Alert** ⚠️ STATUS UNKNOWN
- **Method**: `EmailService.sendAdminTrademarkAlert()`
- **Endpoint**: Called internally from trademark risk report endpoint
- **Triggered From**: Same as #6 above
- **Status**: ⚠️ **NEEDS VERIFICATION**
- **Subject**: "[NEW LEAD] Trademark Risk Report: {businessName}"
- **Recipient**: `rickibodner@gmail.com` (admin email)
- **When Sent**: Immediately after trademark risk report is sent to user

---

## 🚫 **DISABLED EMAILS**

### 8. **Admin Alert (New User Signup)** ❌ DISABLED
- **Method**: `EmailService.sendAdminAlert()`
- **Status**: ❌ **DISABLED** - Method exists but returns immediately without sending (line 388-390 in `emailService.ts`)
- **Note**: Code comment says "Disabled per user request"

---

## 📊 **EMAIL SUMMARY TABLE**

| Email Type | Status | Trigger | Frequency | Verified? |
|------------|--------|---------|-----------|-----------|
| Welcome Email | ✅ Active | Password creation | Immediate | ✅ Yes |
| Onboarding Package | ⚠️ Unknown | Onboarding step | Immediate | ❓ Needs check |
| Website Scan Reminder | ⚠️ Unknown | Cron job | Daily (if scheduled) | ❓ Needs check |
| Profile Completion Reminder | ⚠️ Unknown | Cloud Tasks | 24h after signup | ❓ Needs check |
| Legal Health Score | ⚠️ Unknown | Cron job | Daily (if scheduled) | ❓ Needs check |
| Trademark Risk Report | ⚠️ Unknown | User action | On-demand | ❓ Needs check |
| Admin Trademark Alert | ⚠️ Unknown | User action | On-demand | ❓ Needs check |
| Admin Alert (Signup) | ❌ Disabled | Password creation | Immediate | N/A |

---

## 🔍 **VERIFICATION CHECKLIST**

To verify which emails are actually being sent to real users:

1. **Check Resend Dashboard Logs**:
   - Go to https://resend.com/emails
   - Filter by date range
   - Look for emails matching the subjects above
   - Check recipient emails to see if they're real users or just test emails

2. **Check Onboarding Package Email**:
   - Look for emails with subject "Your Free Legal Documents are Ready! 📄"
   - These should have 3 PDF attachments
   - Verify recipients are real users (not just test accounts)

3. **Check Scheduled Emails**:
   - Verify cron jobs are actually running:
     - Firebase Functions: Check `sendWebsiteScanReminders` scheduled function
     - Check if `/api/emails/send-website-scan-reminders` is being called
     - Check if `/api/emails/send-legal-health-score` is being called
   - Look for reminder emails in Resend logs

4. **Check Trademark Emails**:
   - Look for "Trademark Risk Snapshot" emails
   - Verify these are being sent when users complete the trademark quiz

5. **Check Server Logs**:
   - Firebase Functions logs: Check for email sending activity
   - Local server logs: Check for email service calls
   - Look for error messages related to email sending

---

## 🐛 **POTENTIAL ISSUES**

1. **Onboarding Package Email**:
   - Triggered automatically in `GeneratedDocumentsCard` component
   - Uses `sessionStorage` to prevent duplicates
   - If user navigates away before component mounts, email won't be sent
   - **Recommendation**: Check if users are actually reaching this step in onboarding

2. **Scheduled Emails**:
   - Website Scan Reminder and Legal Health Score emails require cron jobs
   - Firebase Functions scheduled functions may not be deployed
   - **Recommendation**: Verify scheduled functions are deployed and running

3. **Email Configuration**:
   - All emails use `EMAIL_FROM_ADDRESS` environment variable
   - If not set, defaults to `onboarding@resend.dev` (can only send to account owner)
   - **Recommendation**: Verify `EMAIL_FROM_ADDRESS` is set in production

---

## 📝 **NEXT STEPS**

1. ✅ **Verify Onboarding Package Email**: Check Resend logs for "Your Free Legal Documents are Ready!" emails to real users
2. ✅ **Check Scheduled Functions**: Verify Firebase Functions cron jobs are deployed and running
3. ✅ **Review Server Logs**: Check for any email sending errors
4. ✅ **Test Endpoints**: Manually trigger reminder email endpoints to verify they work
5. ✅ **Check User Flow**: Verify users are actually reaching the steps that trigger emails

---

## 📚 **Related Documentation**

- `RESEND_EMAIL_FIX.md` - Fix for 403 errors
- `QUICK_FIX_RESEND_403.md` - Quick fix guide
- `WEBSITE_SCAN_REMINDER_SETUP.md` - Website scan reminder setup
- `LEGAL_HEALTH_SCORE_EMAIL_SETUP.md` - Legal health score email setup
- `PERSONALIZED_EMAIL_SUMMARY.md` - Email personalization guide
