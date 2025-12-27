# Firebase Functions Migration Guide

## Current Status

You've set up Firebase Functions config using the **deprecated** `functions.config()` API. This will work until **March 2026**, but you should migrate to the modern secrets approach.

## Migration Options

### Option 1: Migrate to Firebase Secrets (Recommended)

Firebase Secrets are automatically available as environment variables and are the modern, secure way to handle configuration.

#### Step 1: Set Secrets

```bash
# You'll be prompted to enter each value securely
firebase functions:secrets:set FIRECRAWL_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
firebase functions:secrets:set INSTANTLY_AI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
```

#### Step 2: Update Function Code

The code already supports both methods! Secrets automatically take precedence over legacy config. Once you set secrets, they'll be used automatically.

#### Step 3: Deploy

```bash
firebase deploy --only functions
```

#### Step 4: (Optional) Remove Legacy Config

After verifying secrets work, you can remove the legacy config:

```bash
firebase functions:config:unset firecrawl
firebase functions:config:unset openai
firebase functions:config:unset supabase
firebase functions:config:unset instantly
firebase functions:config:unset gemini
firebase functions:config:unset autogen
```

### Option 2: Keep Using Legacy Config (Until March 2026)

You can continue using the current setup until March 2026. The code supports it for backward compatibility.

**Important:** You'll need to migrate before March 2026, or deployments will fail.

## Current Implementation

The `functions/src/index.ts` file now:
- ✅ Supports both legacy config and modern secrets
- ✅ Secrets take precedence if both are set
- ✅ Falls back to legacy config if secrets aren't available
- ✅ Works with .env files for local development

## Local Development

For local development, create a `.env` file in the root directory:

```env
FIRECRAWL_API_KEY=your-key
OPENAI_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
INSTANTLY_AI_API_KEY=your-key
GEMINI_API_KEY=your-key
USE_AUTOGEN=true
```

Or use Firebase emulators with environment variables:

```bash
firebase emulators:start --env-file .env
```

## Next Steps

1. **For now:** Your current setup works! The legacy config will continue working until March 2026.
2. **Before March 2026:** Migrate to secrets using Option 1 above.
3. **For production:** Consider migrating sooner for better security and to avoid last-minute issues.

## Troubleshooting

### Secrets not working?
- Make sure you've deployed after setting secrets: `firebase deploy --only functions`
- Check that secrets are set: `firebase functions:secrets:access SECRET_NAME`

### Legacy config not working?
- Verify config is set: `firebase functions:config:get`
- Make sure you've deployed: `firebase deploy --only functions`

### Both not working?
- Check that environment variables are being read in the function logs
- Verify the function is using the correct region and project
























