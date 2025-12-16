# Legal Health Score Email Setup (Day 1 Nurture Sequence)

## Overview

This is a **personalized Legal Health Score email** that should be sent **24 hours after users create their password** (Day 1 of your nurture sequence). The email dynamically pulls user data from their business profile, calculates their unique risk score, and sends a customized message based on their specific risk factors.

## ✅ What's Been Created

### 1. **React Email Template** (`src/emails/LegalHealthScoreEmail.tsx`)
A beautiful, personalized email template that adapts based on:
- **Risk Level** (High/Moderate/Low)
  - Different colors, messaging, and CTAs for each level
  - High risk = red theme with urgent CTA to book call
  - Moderate risk = orange theme with balanced CTA
  - Low risk = green theme with growth-focused CTA
- **Business Details**
  - User's name
  - Business name and type
  - Specific risk factors (physical movement, retreats, hiring, etc.)
- **Risk Score Breakdown**
  - Shows their exact score (0-100)
  - Lists which factors contribute to their score
  - Explains what the score means for their business

### 2. **Email Service Method** (`server/services/emailService.ts`)
`sendLegalHealthScoreEmail()` - Handles:
- Rendering the React email template
- Dynamic subject lines based on risk level:
  - High: "{Name}, your business has {score} risk points"
  - Moderate: "Your Legal Health Score: {score}/100"
  - Low: "Good news about your legal protection"
- Error handling and logging

### 3. **API Endpoint** (`server/index.ts`)
`POST /api/emails/send-legal-health-score`
- Queries users who created password 24+ hours ago
- Haven't received the Legal Health Score email yet
- Pulls their business profile data
- Calculates personalized risk score
- Sends customized email
- Tracks that email was sent

### 4. **Database Migration** (`migration_add_legal_health_score_email_tracking.sql`)
Adds `legal_health_score_email_sent_at` timestamp field to `users` table to prevent duplicate emails.

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# Copy the contents of migration_add_legal_health_score_email_tracking.sql
# and paste into Supabase SQL Editor
```

Or run it via psql:
```bash
psql -h your-supabase-host -U postgres -d postgres -f migration_add_legal_health_score_email_tracking.sql
```

### Step 2: Test the Email Locally

1. **Start your local server:**
   ```bash
   npm run dev
   # or
   cd server && npm run dev
   ```

2. **Test with a single user:**
   ```bash
   curl -X POST http://localhost:3001/api/emails/send-legal-health-score
   ```

3. **Check the response:**
   - Should show how many emails were sent
   - Check console logs for detailed output
   - Verify email arrives in inbox (if using production Resend API key)

### Step 3: Set Up Automation (Choose One)

#### Option A: Daily Cron Job (Recommended)

Set up a daily cron job to run at 10:00 AM every day:

**Using Vercel Cron:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/emails/send-legal-health-score",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Using GitHub Actions:**
```yaml
# .github/workflows/send-legal-health-score-emails.yml
name: Send Legal Health Score Emails
on:
  schedule:
    - cron: '0 10 * * *'  # 10:00 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Send Legal Health Score Emails
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/emails/send-legal-health-score
```

**Using your server's crontab:**
```bash
# Open crontab
crontab -e

# Add this line (runs at 10:00 AM daily)
0 10 * * * curl -X POST https://your-domain.com/api/emails/send-legal-health-score
```

#### Option B: Trigger from User Signup Flow

If you want to send exactly 24 hours after signup (more precise):

```typescript
// After user creates password in your signup flow
// Schedule a task to run 24 hours later

// Option 1: Using setTimeout (not recommended for production)
setTimeout(async () => {
  await fetch('/api/emails/send-legal-health-score', { method: 'POST' });
}, 24 * 60 * 60 * 1000);

// Option 2: Use a job queue (recommended)
// - Bull Queue with Redis
// - Firebase Cloud Tasks
// - AWS SQS
```

---

## 📧 Email Personalization Examples

### Example 1: High-Risk User (Score: 85/100)
**Profile:**
- Business: "ZenFlow Yoga Studio"
- Type: Yoga Studio
- Has physical movement ✅
- Hosts retreats ✅
- Hires staff ✅
- 50-200 clients/month

**Email Received:**
- Subject: "Sarah, your business has 85 risk points"
- Risk score card: **85** in red
- Risk level: **HIGH RISK**
- Messaging: Urgent, fear-based
  - "One lawsuit could devastate your business"
  - "Legal fees average $50,000-$150,000"
- CTA: "Book My Free 15-Min Legal Audit" (prominent button)
- Case study about yoga studio lawsuit

### Example 2: Moderate-Risk User (Score: 55/100)
**Profile:**
- Business: "Mindful Coaching"
- Type: Online Coaching
- No physical movement
- No retreats
- No staff
- Collects online payments ✅

**Email Received:**
- Subject: "Your Legal Health Score: 55/100"
- Risk score card: **55** in orange
- Risk level: **MODERATE**
- Messaging: Balanced, educational
  - "Some protection gaps exist"
  - "Prevention is easier than defense"
- CTA: "View My Dashboard" (primary) + "or schedule a free call" (secondary)

### Example 3: Low-Risk User (Score: 25/100)
**Profile:**
- Business: "Wellness Blog"
- Type: Content Creator
- No physical movement
- No retreats
- No staff

**Email Received:**
- Subject: "Good news about your legal protection"
- Risk score card: **25** in green
- Risk level: **LOW RISK**
- Messaging: Positive, growth-focused
  - "You're in good shape!"
  - "Lock in your protection before you scale"
- CTA: "Get My Free Documents"

---

## 📊 Monitoring & Analytics

### Check Email Delivery Status

1. **View logs in your server console:**
   ```bash
   # Look for lines like:
   [Legal Health Score Emails] Found 15 eligible users
   [Legal Health Score Emails] Sent to: user@example.com (Score: 75, Risk: High)
   ```

2. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - View delivery status, open rates, click rates

3. **Query Supabase to see who received emails:**
   ```sql
   SELECT
     email,
     name,
     legal_health_score_email_sent_at,
     password_created_at
   FROM users
   WHERE legal_health_score_email_sent_at IS NOT NULL
   ORDER BY legal_health_score_email_sent_at DESC;
   ```

### Track Conversion Metrics

Track these KPIs:
- **Email open rate** (benchmark: 25-35%)
- **Link click rate** (benchmark: 5-10%)
- **Dashboard visits after email** (track in analytics)
- **Calendly bookings from email** (use UTM parameters)
- **Call booking rate by risk segment** (High vs Moderate vs Low)

### Add UTM Parameters (Recommended)

Update the email template to add tracking:
```typescript
const dashboardLink = `https://free.consciouscounsel.ca/wellness/dashboard?utm_source=email&utm_medium=nurture&utm_campaign=day1_health_score&utm_content=${riskLevel.toLowerCase()}`;

const calendlyLink = `https://calendly.com/chad-consciouscounsel/connection-call-with-chad?utm_source=email&utm_medium=nurture&utm_campaign=day1_health_score&utm_content=${riskLevel.toLowerCase()}`;
```

---

## 🧪 Testing Checklist

Before going live, test with real data:

- [ ] Create test user accounts with different business profiles
- [ ] Run the endpoint manually
- [ ] Verify emails arrive in inbox (not spam)
- [ ] Check email rendering on:
  - [ ] Gmail (desktop & mobile)
  - [ ] Outlook (desktop & mobile)
  - [ ] Apple Mail
  - [ ] Yahoo Mail
- [ ] Click all CTAs to ensure links work
- [ ] Verify tracking field updates in database
- [ ] Confirm no duplicate emails are sent (run endpoint twice)
- [ ] Test with high/moderate/low risk profiles
- [ ] Check subject lines display correctly

---

## 🔧 Troubleshooting

### Issue: "No eligible users found"
**Cause:** No users match the criteria (24+ hours after signup, haven't received email)
**Fix:**
```sql
-- Manually reset a test user to re-send email
UPDATE users
SET legal_health_score_email_sent_at = NULL
WHERE email = 'test@example.com';
```

### Issue: "Configuration error: Email service is not configured"
**Cause:** `RESEND_API_KEY` environment variable not set
**Fix:**
```bash
# Add to .env
RESEND_API_KEY=re_your_key_here
```

### Issue: "User skipped - no business profile"
**Cause:** User created account but didn't complete onboarding
**Fix:** This is expected behavior. Only users with completed profiles receive the email.

### Issue: Emails go to spam
**Cause:** Using `onboarding@resend.dev` (sandbox mode)
**Fix:**
1. Verify your domain in Resend Dashboard
2. Update `EMAIL_FROM_ADDRESS` env var to use your verified domain
3. Add SPF, DKIM, and DMARC records to your domain

---

## 📈 Next Steps (Full 7-Day Sequence)

This is **Day 1** of your nurture sequence. Here's the full recommended sequence:

- **Day 0** (Immediate): Welcome email ✅ (already exists)
- **Day 1** (24 hours): Legal Health Score Explained ✅ (just created)
- **Day 2** (48 hours): Website scan results + compliance gaps
- **Day 3** (72 hours): Case study email (lawsuit story)
- **Day 5** (5 days): "3 Legal Mistakes Killing Your Peace of Mind"
- **Day 7** (7 days): Urgency email ("Chad has X spots left")

Would you like me to help you create the Day 2 email next?

---

## 💡 Pro Tips

1. **Segment by risk level:** Send different follow-up sequences based on High/Moderate/Low risk
2. **A/B test subject lines:** Try different variations to improve open rates
3. **Add social proof:** Include testimonials from similar businesses
4. **Use scarcity:** "Only 5 consultation spots left this week"
5. **Track everything:** Use UTM parameters on all links
6. **Re-engagement:** If user doesn't open email, send a different subject line 3 days later
7. **Personalize even more:** Include specific documents they need based on business type

---

## 🎯 Success Metrics

**Target Metrics (30 days):**
- Email open rate: 30%+
- Click-through rate: 8%+
- Dashboard visit rate: 15%+
- Call booking conversion: 5-10% (up from your current 2%)

**By Risk Segment:**
- High risk → 10-15% call bookings
- Moderate risk → 5-8% call bookings
- Low risk → 2-3% call bookings

---

Need help setting up automation or want to customize the email? Let me know!
