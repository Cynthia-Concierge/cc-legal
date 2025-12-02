# How to Fix the 500 Error - Restart Instructions

## The Problem
The Firebase emulator is running old code that doesn't use the `SUPABASE_SERVICE_ROLE_KEY`. You need to rebuild and restart.

## Quick Fix Steps

1. **Stop the current dev server** (press `Ctrl+C` in the terminal running `npm run dev`)

2. **Rebuild the functions**:
   ```bash
   cd functions
   npm run build
   cd ..
   ```

3. **Kill any remaining emulator processes**:
   ```bash
   pkill -f "firebase.*emulator"
   ```

4. **Restart the dev server**:
   ```bash
   npm run dev
   ```

5. **Test the form** - it should work now!

## Verify It's Working

After restarting, you can check if the service_role key is being used:

1. Open: http://localhost:5001/cc-legal/us-central1/api/debug/env
2. You should see: `"usingKeyType": "service_role"`

## Why This Happened

The Firebase Functions code was updated to use `SUPABASE_SERVICE_ROLE_KEY`, but:
- The functions needed to be rebuilt (TypeScript → JavaScript)
- The emulator needed to be restarted to load the new code
- The old emulator process was still running with the old code

## If It Still Doesn't Work

1. Check that your `.env` file has `SUPABASE_SERVICE_ROLE_KEY`:
   ```bash
   grep SUPABASE_SERVICE_ROLE_KEY .env
   ```

2. Check the emulator logs when you submit the form - you should see:
   ```
   [Firebase Functions] Using Supabase key type: service_role
   ```

3. If you see `"usingKeyType": "anon"` in the debug endpoint, the `.env` file isn't being loaded. Make sure:
   - The `.env` file is in the root directory (same level as `package.json`)
   - The emulator is started with `--env-file .env` (which `start-emulators.sh` does automatically)

