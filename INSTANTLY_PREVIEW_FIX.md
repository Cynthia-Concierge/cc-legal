# How to See Email Preview in Instantly AI

## Issue: Blank Preview

If the email preview is blank, follow these steps:

## Step 1: Select the Lead in Preview Modal

1. **In the Test Email modal**, find the **"Load data for lead:"** dropdown
2. **Click the dropdown** and select: `rickibodner11@gmail.com`
3. This will load the custom variables for that lead
4. The preview should now populate with the email content

## Step 2: Verify Sequence Template Uses Variables

Make sure your sequence email template uses these variables:

### Subject Line:
```
{{email_subject}}
```

### Email Body:
```
{{email_body_html}}
```

**Important:** The variables must match exactly:
- `{{email_subject}}` (not `{{email_subject}}` with spaces)
- `{{email_body_html}}` (not `{{email_body}}` or `{{emailBody}}`)

## Step 3: Enable HTML Rendering

1. In the email editor, look for an **HTML/code view toggle** (usually `<>` icon)
2. Make sure HTML rendering is enabled
3. The `{{email_body_html}}` variable contains full HTML that needs to be rendered

## Step 4: Check Custom Variables

If preview is still blank after selecting the lead:

1. **Go to Leads section** in Instantly AI
2. **Find the lead:** `rickibodner11@gmail.com`
3. **Click on the lead** to view details
4. **Check if custom variables are present:**
   - `email_subject`
   - `email_body_html`
   - `email_body`

If variables are missing, the lead might not have been added correctly.

## Alternative: Manual Test

If the preview still doesn't work, you can manually test by:

1. **In the sequence editor**, replace the body with:
   ```
   {{email_body_html}}
   ```

2. **Save the sequence**

3. **Go back to preview** and select the lead again

4. The preview should now show the HTML email content

## Troubleshooting

### Preview shows variables but not content:
- The lead might not have custom variables
- Re-run the test script: `node test-send-lead-to-instantly.js`

### Variables show as `{{email_subject}}` literally:
- The sequence template isn't recognizing the variables
- Make sure you're using the exact variable names
- Check that the lead has these custom variables set

### HTML doesn't render:
- Enable HTML rendering in the email editor
- Use the `<>` code view toggle to check the HTML
- The email body contains full HTML that needs to be rendered

## Quick Test

To verify the lead has the variables, you can:

1. Go to **Leads** section
2. Find `rickibodner11@gmail.com`
3. Click on it to see lead details
4. Look for "Custom Variables" section
5. You should see:
   - `email_subject`: "Spotted a few things that might need attention..."
   - `email_body_html`: [HTML content]
   - `email_body`: [cleaned text version]

If these are present, the preview should work when you select this lead in the preview modal.
