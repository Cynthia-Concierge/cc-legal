# Deploy ConfigService Fix to Production

## What Changed

✅ **Code Changes** (needs deployment):
- Updated `server/services/configService.ts` to handle missing `workflow_config` table gracefully
- Now logs a warning instead of error when table doesn't exist
- Returns empty config so workflow continues with defaults

✅ **Database Changes** (already done):
- You created the `workflow_config` table in Supabase
- No deployment needed for this

---

## Deployment Steps

### Step 1: Build Functions

```bash
cd functions
npm run build
cd ..
```

This compiles TypeScript and copies the updated `configService.ts` to the build output.

### Step 2: Deploy to Firebase

**Option A: Deploy only functions (faster)**
```bash
firebase deploy --only functions
```

**Option B: Deploy everything (functions + hosting)**
```bash
firebase deploy
```

### Step 3: Verify Deployment

After deployment, check the logs:
```bash
firebase functions:log --only api
```

You should see:
- ✅ No more `PGRST205` errors about missing table
- ✅ Warnings instead of errors (if table is missing)
- ✅ Workflow continues to work normally

---

## What Happens After Deployment

1. **If `workflow_config` table exists** (which it does now):
   - ✅ No errors
   - ✅ Custom prompts/configs will be loaded if you add any
   - ✅ Everything works normally

2. **If `workflow_config` table is missing** (future-proof):
   - ⚠️ Warning logged (not an error)
   - ✅ Workflow continues with default prompts
   - ✅ No crashes or failures

---

## Quick Deploy Command

Run this from the project root:

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

Or if you want to deploy everything:

```bash
cd functions && npm run build && cd .. && firebase deploy
```

---

## Testing After Deployment

1. **Check production logs:**
   ```bash
   firebase functions:log --only api
   ```

2. **Test the workflow:**
   - Go to your production site
   - Run a legal analysis
   - Check that it completes successfully
   - Verify no errors about `workflow_config` table

3. **Verify in Supabase:**
   - The `workflow_config` table should be accessible
   - No errors when the workflow tries to load configs

---

## Summary

- ✅ **Database**: Already done (you created the table)
- ⚠️ **Code**: Needs deployment (run the commands above)
- 🎯 **Result**: Production will use the improved error handling

The deployment will take 2-5 minutes. Once complete, your production site will have the fix!

