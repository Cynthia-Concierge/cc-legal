# Quick Fix: Resend 403 Error for Welcome Emails

## The Problem
Your Resend logs show:
```
403 Forbidden - validation_error
"You can only send testing emails to your own email address (rickibodner@gmail.com)"
```

**From address in error:** `onboarding@resend.dev` ❌  
**Should be:** `welcome@consciouscounsel.ca` ✅

## Why This Happens
Firebase Functions doesn't have access to `EMAIL_FROM_ADDRESS` secret, so it defaults to `onboarding@resend.dev`, which can only send to the account owner.

## The Fix (2 Steps)

### Step 1: Set the Secret
```bash
firebase functions:secrets:set EMAIL_FROM_ADDRESS
```
When prompted, enter: `welcome@consciouscounsel.ca`

### Step 2: Deploy
```bash
firebase deploy --only functions
```

## Verification
After deployment, check Firebase Functions logs when sending a welcome email. You should see:
```
[Firebase Functions] Email service configured with FROM address: welcome@consciouscounsel.ca
[EmailService]   From: welcome@consciouscounsel.ca
```

Instead of the previous:
```
[Firebase Functions] WARNING: EMAIL_FROM_ADDRESS is not set. Emails may fail...
```

## What Was Fixed
✅ Added `EMAIL_FROM_ADDRESS` to Firebase Functions secrets array  
✅ Improved error logging to show the FROM address being used  
✅ Added diagnostic script to check configuration

## After Fix
Welcome emails should work for all recipients, not just the admin!
