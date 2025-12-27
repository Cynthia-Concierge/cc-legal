# 📧 Nurture Sequence Email Templates

## Overview

I've created 4 beautifully designed email templates for your nurture sequence. These are React Email templates that match your brand aesthetic (teal/emerald colors, clean design) and are ready to use with Resend.

## 📋 Email Templates Created

### 1. **Case Study Email** (Day 3)
- **File**: `CaseStudyEmail.tsx`
- **Subject**: "How a [business type] avoided a $50K lawsuit with proper legal protection"
- **Purpose**: Share a real success story to build trust and show value
- **CTA**: "Get My Free Legal Documents" + "Book a free call"

### 2. **Risk Scenario Email** (Day 5)
- **File**: `RiskScenarioEmail.tsx`
- **Subject**: Dynamic based on business type (e.g., "What happens if a client gets injured during class?")
- **Purpose**: Fear-based messaging to create urgency
- **Features**: Personalized scenarios based on business type (retreats, physical movement, online, etc.)
- **CTA**: "Get My Free Legal Protection" + "Book a free call"

### 3. **Social Proof Email** (Day 7)
- **File**: `SocialProofEmail.tsx`
- **Subject**: "[1,247]+ wellness businesses trust Conscious Counsel for legal protection"
- **Purpose**: Build credibility with numbers and testimonials
- **Features**: Shows total protected, recent signups, business type breakdown, testimonials
- **CTA**: "Get My Free Legal Protection" + "Book a free call"

### 4. **Final Reminder Email** (Day 10)
- **File**: `FinalReminderEmail.tsx`
- **Subject**: "Last chance: Free consultation expires in 48 hours"
- **Purpose**: Create urgency with expiration deadline
- **CTA**: "Book My Free Consultation Now" (primary) + "Access your dashboard" (secondary)

## Design Features

All emails feature:
- ✅ **Brand colors**: Teal (#0d9488) and emerald accents
- ✅ **Clean, modern design**: Professional layout with proper spacing
- ✅ **Mobile-responsive**: Works on all devices
- ✅ **Clear CTAs**: Prominent buttons with secondary options
- ✅ **Personalization**: Dynamic content based on user data
- ✅ **Trust elements**: Testimonials, stats, and social proof

## How to Use with Resend

### Option 1: Use React Email (Recommended)

These templates are built with React Email, which Resend supports natively:

1. **Install React Email** (if not already installed):
   ```bash
   npm install @react-email/components
   ```

2. **Render the email** in your email service:
   ```typescript
   import { render } from '@react-email/render';
   import { CaseStudyEmail } from './emails/CaseStudyEmail';

   const html = render(
     <CaseStudyEmail
       name="Sarah"
       businessName="ZenFlow Yoga"
       businessType="yoga studio"
       dashboardLink="https://free.consciouscounsel.ca/wellness/dashboard"
       calendlyLink="https://calendly.com/chad-consciouscounsel/connection-call-with-chad"
     />
   );

   await resend.emails.send({
     from: 'chad@consciouscounsel.ca',
     to: 'user@example.com',
     subject: 'How a yoga studio avoided a $50K lawsuit',
     html: html,
   });
   ```

### Option 2: Export to HTML

You can export these to HTML using React Email CLI:

```bash
npx react-email export CaseStudyEmail.tsx --out ./html
```

This will generate HTML files you can use directly in Resend.

### Option 3: Use HTML Template

I've also created a basic HTML version in `html/CaseStudyEmail.html` that you can customize and use directly.

## Implementation Steps

### 1. Add Email Service Methods

Add these methods to `server/services/emailService.ts`:

```typescript
async sendCaseStudyEmail(
  email: string,
  data: {
    name?: string;
    businessName?: string;
    businessType?: string;
  }
): Promise<any> {
  const html = render(
    <CaseStudyEmail
      name={data.name}
      businessName={data.businessName}
      businessType={data.businessType}
    />
  );

  return await this.resend.emails.send({
    from: this.fromEmail,
    to: email,
    subject: `How a ${data.businessType || 'wellness business'} avoided a $50K lawsuit`,
    html: html,
  });
}

// Similar methods for RiskScenarioEmail, SocialProofEmail, FinalReminderEmail
```

### 2. Create API Endpoints

Add endpoints in `server/index.ts`:

```typescript
// Day 3: Case Study Email
app.post("/api/emails/send-case-study", async (req, res) => {
  // Find users who signed up 3 days ago
  // Send case study email
});

// Day 5: Risk Scenario Email
app.post("/api/emails/send-risk-scenario", async (req, res) => {
  // Find users who signed up 5 days ago
  // Send risk scenario email
});

// Day 7: Social Proof Email
app.post("/api/emails/send-social-proof", async (req, res) => {
  // Find users who signed up 7 days ago
  // Send social proof email
});

// Day 10: Final Reminder Email
app.post("/api/emails/send-final-reminder", async (req, res) => {
  // Find users who signed up 10 days ago
  // Send final reminder email
});
```

### 3. Set Up Scheduled Jobs

Use Firebase Functions or a cron job to send these emails automatically:

```typescript
// Run daily at 10 AM
// Check for users who signed up 3, 5, 7, or 10 days ago
// Send appropriate email if they haven't received it yet
```

### 4. Track Email Sends

Add tracking fields to your `users` table:
- `case_study_email_sent_at`
- `risk_scenario_email_sent_at`
- `social_proof_email_sent_at`
- `final_reminder_email_sent_at`

## Personalization Variables

All emails support these variables:
- `name` - User's name
- `businessName` - Their business name
- `businessType` - Type of business (Yoga Studio, Retreat Leader, etc.)
- `dashboardLink` - Link to their dashboard
- `calendlyLink` - Link to book a call

**Risk Scenario Email** also supports:
- `hasPhysicalMovement` - Show physical activity scenario
- `hostsRetreats` - Show retreat scenario
- `hiresStaff` - Show staff-related scenario
- `collectsOnline` - Show online payment scenario

**Social Proof Email** also supports:
- `totalProtected` - Total number of protected businesses
- `recentSignups` - Number of signups this week

## Testing

1. **Test locally**:
   ```bash
   npx react-email dev
   ```
   This opens a preview server where you can see all emails.

2. **Test with Resend**:
   Send a test email to yourself first before deploying.

3. **Check rendering**:
   Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)

## Next Steps

1. ✅ Email templates created (DONE)
2. ⏳ Add email service methods
3. ⏳ Create API endpoints
4. ⏳ Set up scheduled jobs
5. ⏳ Add database tracking fields
6. ⏳ Test and deploy

## Files Created

```
src/emails/
├── CaseStudyEmail.tsx          # Day 3 email
├── RiskScenarioEmail.tsx        # Day 5 email
├── SocialProofEmail.tsx         # Day 7 email
├── FinalReminderEmail.tsx       # Day 10 email
├── html/
│   └── CaseStudyEmail.html      # HTML version (example)
└── README_NURTURE_SEQUENCE.md   # This file
```

## Notes

- All emails are in **draft mode** - they won't be sent automatically
- You need to implement the API endpoints and scheduled jobs
- Personalization is built-in - just pass the user data
- All emails match your brand colors and design aesthetic
- Mobile-responsive and email client compatible

## Support

If you need help implementing these:
1. Check the existing `LegalHealthScoreEmail.tsx` for reference
2. Look at `server/services/emailService.ts` for email sending patterns
3. Review `server/index.ts` for API endpoint examples

---

**Ready to boost your call booking rate!** 🚀


