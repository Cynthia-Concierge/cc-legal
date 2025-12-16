# Fix for Resend Email 403 Errors

## Problem
Welcome emails (and other Resend emails) are failing with **403 Forbidden** errors, except:
- ✅ Emails to the admin (rickibodner@gmail.com) work
- ✅ Password reset emails work (they use Supabase Auth, not Resend)

## Root Cause
The 403 errors occur because:

1. **In Production (Firebase Functions):** `EMAIL_FROM_ADDRESS` was not declared in the secrets array, so it's `undefined`
2. **When undefined:** The code defaults to `onboarding@resend.dev`
3. **Resend restriction:** `onboarding@resend.dev` can **only send TO** the Resend account owner's email (rickibodner@gmail.com)
4. **Error message:** "You can only send testing emails to your own email address (rickibodner@gmail.com). To send emails to other recipients..."

### Current Situation
- ✅ Your domain `consciouscounsel.ca` IS verified in Resend
- ✅ Local `.env` has `EMAIL_FROM_ADDRESS=welcome@consciouscounsel.ca` 
- ❌ **Firebase Functions doesn't have access to `EMAIL_FROM_ADDRESS` secret**
- ❌ Production is using `onboarding@resend.dev` (the default)

## Solution

### Step 1: Verify Your Domain in Resend

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/domains
   - Log in with your Resend account

2. **Add Your Domain**
   - Click "Add Domain"
   - Enter your domain (e.g., `consciouscounsel.ca`)
   - Follow the DNS verification steps

3. **Verify DNS Records**
   - Resend will provide DNS records to add to your domain
   - Add them to your domain's DNS settings
   - Wait for verification (usually a few minutes)

### Step 2: Set EMAIL_FROM_ADDRESS Secret in Firebase Functions

**This is the critical step that was missing!** Set `EMAIL_FROM_ADDRESS` as a Firebase secret:

```bash
firebase functions:secrets:set EMAIL_FROM_ADDRESS
# When prompted, enter: welcome@consciouscounsel.ca
```

**Important:** The code has been updated to include `EMAIL_FROM_ADDRESS` in the secrets array, but you must:
1. Set the secret (command above)
2. Deploy the updated function (see Step 3)

**For Local Development (.env):**
```env
EMAIL_FROM_ADDRESS=hello@consciouscounsel.ca
```

**Common email addresses to use:**
- `hello@consciouscounsel.ca`
- `noreply@consciouscounsel.ca`
- `support@consciouscounsel.ca`
- `chad@consciouscounsel.ca` (if you want to use Chad's email)

### Step 3: Deploy Updated Firebase Functions

After setting the secret, deploy the updated function code:

```bash
firebase deploy --only functions
```

The code has been updated to:
- ✅ Include `EMAIL_FROM_ADDRESS` in the secrets array
- ✅ Use the secret value instead of defaulting to `onboarding@resend.dev`

### Step 4: Verify Configuration

Run the diagnostic script (checks local .env):
```bash
npm run check-resend-config
```

**Note:** This checks your local `.env` file. To verify Firebase Functions secrets, check the Firebase Functions logs after deployment.

### Step 5: Test Email Sending

After configuration, test sending a welcome email:
```bash
# Test script (if available)
node test-resend-email.ts
```

Or trigger a welcome email through your application and check the logs.

## Why Password Reset Emails Work

Password reset emails use **Supabase Auth**, which has its own email system. They don't use Resend, so they're not affected by Resend domain verification.

## Why Admin Emails Work

Emails to `rickibodner@gmail.com` (the Resend account owner) work because Resend allows sending to the account owner even with unverified domains.

## Improved Error Logging

I've improved error handling in `server/services/emailService.ts` to:
- Log the FROM email address being used
- Show detailed Resend API error responses
- Provide specific guidance for 403 errors
- Log full error details for debugging

## Next Steps

1. ✅ Run `scripts/check-resend-config.ts` to diagnose the current state
2. ✅ Verify your domain in Resend Dashboard
3. ✅ Set `EMAIL_FROM_ADDRESS` to use the verified domain
4. ✅ Test sending a welcome email
5. ✅ Monitor logs for improved error messages

## Troubleshooting

### Still Getting 403 Errors?

1. **Check domain verification status:**
   ```bash
   npx tsx scripts/check-resend-config.ts
   ```

2. **Verify DNS records are correct:**
   - Go to Resend Dashboard → Domains
   - Check that all DNS records show as verified

3. **Check API key permissions:**
   - Ensure your API key has "Send Emails" permission
   - Try creating a new API key if needed

4. **Check Resend logs:**
   - Go to Resend Dashboard → Logs
   - Look for specific error messages

### Domain Verification Taking Too Long?

- DNS propagation can take up to 48 hours (usually much faster)
- Make sure DNS records are added correctly
- Use a DNS checker tool to verify records are live

## Additional Resources

- [Resend Domain Verification Docs](https://resend.com/docs/dashboard/domains/introduction)
- [Resend API Docs](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Dashboard](https://resend.com/domains)
