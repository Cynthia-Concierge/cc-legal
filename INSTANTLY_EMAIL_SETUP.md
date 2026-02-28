# Instantly AI Email Setup Guide

## Overview

The system automatically adds leads to Instantly AI when they submit the main form. For the **post-funnel (thank-you page) flow**, leads are added **immediately** to the **"Post Funnel Nurture"** campaign so they can receive your nurture sequence.

## Post Funnel Nurture Campaign (Main Form)

When someone submits the main landing form (name, email, phone, Instagram), they are added to Supabase and then to Instantly.ai in one request.

### Configure the campaign ID

1. In [Instantly.ai](https://app.instantly.ai), open your campaign named **"Post Funnel Nurture"**.
2. Copy the **Campaign ID** (from the URL or campaign settings).
3. In your project `.env`, set **one** of:
   - **`INSTANTLY_POST_FUNNEL_NURTURE_CAMPAIGN_ID`** – recommended, used for main-form leads.
   - Or **`INSTANTLY_CAMPAIGN_ID`** – fallback if the above is not set.

Example:
```bash
INSTANTLY_AI_API_KEY=your_api_key_here
INSTANTLY_POST_FUNNEL_NURTURE_CAMPAIGN_ID=your-post-funnel-nurture-campaign-id
```

If both are missing, the code falls back to a hardcoded ID; ensure it matches your "Post Funnel Nurture" campaign or set the env var.

### Variables available in the campaign

Leads added from the main form include:
- `{{first_name}}` – first name  
- `{{last_name}}` – last name  
- `{{phone}}` – phone number  
- `{{website}}` – empty for this form (we capture Instagram instead)  
- `{{instagram}}` – Instagram handle (custom variable)

Use `{{instagram}}` in your nurture emails if you want to reference their handle.

---

## How It Works (Immediate Add)

1. **Lead submits form** → Saved to Supabase and added to Instantly.ai in the same request.
2. **Campaign** → "Post Funnel Nurture" (ID from `INSTANTLY_POST_FUNNEL_NURTURE_CAMPAIGN_ID` or `INSTANTLY_CAMPAIGN_ID`).
3. **Instantly AI** → Sends your sequence using the variables above.

## Legacy: Workflow-Based Email (Optional)

The system now automatically adds leads to Instantly AI **after** the AI email is generated (not immediately). The personalized email content is passed as custom variables that your Instantly AI campaign can use.
2. **Workflow runs** → Generates personalized email (takes a few minutes)
3. **Lead added to Instantly AI** → With email content as custom variables:
   - `{{email_subject}}` - The personalized subject line
   - `{{email_body_html}}` - The full HTML email body
   - `{{email_body}}` - A cleaned version (backup)

4. **Instantly AI campaign** → Sends email 24 hours later using these variables

## Campaign Setup in Instantly AI

### Step 1: Create/Edit Your Campaign

1. Go to your Instantly AI dashboard
2. Navigate to your campaign (ID: `7f93b98c-f8c6-4c2b-b707-3ea4d0df6934` or your custom ID)
3. Click on **Sequence** or **Edit Sequence**

### Step 2: Configure the First Email

1. **Set 24-Hour Delay:**
   - In the sequence editor, set the delay for the first email to **24 hours** (1 day)
   - This ensures the email is sent exactly 24 hours after the lead is added

2. **Configure Email Template:**
   - **Subject Line:** Use `{{email_subject}}`
     ```
     {{email_subject}}
     ```
   
   - **Email Body:** Use `{{email_body_html}}`
     ```
     {{email_body_html}}
     ```

### Step 3: Enable HTML Rendering

1. In the email editor, make sure **HTML rendering is enabled**
2. The `{{email_body_html}}` variable contains full HTML formatting
3. Instantly AI will render the HTML properly

### Step 4: Test the Setup

1. Submit a test lead through your form
2. Wait for the workflow to complete (check server logs)
3. Verify the lead appears in Instantly AI with the custom variables
4. Check that the email preview shows the personalized content

## Custom Variables Available

When a lead is added to Instantly AI, these custom variables are available:

- `{{email_subject}}` - Personalized subject line (e.g., "Hey quick question")
- `{{email_body_html}}` - Full HTML email body with all formatting
- `{{email_body}}` - Cleaned text version (backup, if needed)
- `{{first_name}}` - Lead's first name
- `{{last_name}}` - Lead's last name
- `{{website}}` - Lead's website URL
- `{{phone}}` - Lead's phone number

## Email Formatting

The generated email includes:
- Proper HTML structure with `<p>` tags
- Bullet points using `<ul>` and `<li>` tags
- Links with proper `<a>` tags
- Clean spacing and formatting

The HTML is optimized for email clients and will render correctly in Instantly AI.

## Troubleshooting

### Email not showing custom variables

1. **Check server logs** - Verify the lead was added with custom variables:
   ```
   [Save Contact] Adding lead to Instantly.ai with email content
   ```

2. **Verify campaign ID** - Make sure `INSTANTLY_CAMPAIGN_ID` in `.env` matches your campaign

3. **Check Instantly AI dashboard** - View the lead details to see if custom variables are present

### Email formatting issues

- The `{{email_body_html}}` variable contains full HTML
- Make sure HTML rendering is enabled in your Instantly AI email template
- If issues persist, you can use `{{email_body}}` which is a cleaned version

### Timing issues

- The 24-hour delay is set in the Instantly AI campaign sequence
- The lead is added to Instantly AI immediately after the workflow completes
- The email will be sent 24 hours after the lead is added

## Example Email Template in Instantly AI

```
Subject: {{email_subject}}

Body:
{{email_body_html}}
```

That's it! The system will automatically populate these variables with the personalized email content.

## Notes

- The lead is **not** added to Instantly AI immediately when the form is submitted
- The lead is added **after** the workflow completes (usually 2-5 minutes)
- If the workflow fails, the lead won't be added to Instantly AI (this prevents sending incomplete emails)
- The email content is stored in the `workflow_results` table for reference
