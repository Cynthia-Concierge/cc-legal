# Fixed: 500 Error on Contact Save

## Problem Identified

The 500 error was caused by **Row Level Security (RLS) blocking inserts** when using the `anon` key. The error was:
```
Code: 42501
Message: "new row violates row-level security policy for table 'contacts'"
```

## Root Cause

The Supabase `contacts` table has RLS enabled, but the RLS policy wasn't allowing anonymous inserts even though the SQL script was supposed to create a policy for it. The `anon` key doesn't have sufficient permissions to insert records.

## Solution Applied

✅ **Updated code to use `service_role` key when available**

The `service_role` key bypasses RLS and has full database access, making it perfect for server-side operations like saving form submissions.

### Changes Made:

1. **`functions/src/index.ts`**:
   - Updated to use `SUPABASE_SERVICE_ROLE_KEY` if available, falls back to `SUPABASE_ANON_KEY`
   - Updated validation to check for either key

2. **`server/index.ts`**:
   - Updated to use `SUPABASE_SERVICE_ROLE_KEY` if available, falls back to `SUPABASE_ANON_KEY`

## Verification

✅ Tested with service_role key - **SUCCESS**
- Successfully inserted test contact
- Service role key bypasses RLS correctly

## Your Secrets Status

✅ `SUPABASE_URL` - Set
✅ `SUPABASE_ANON_KEY` - Set  
✅ `SUPABASE_SERVICE_ROLE_KEY` - Set (this is what we're using now)

## Next Steps

1. **Rebuild and redeploy functions** (if using Firebase):
   ```bash
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions
   ```

2. **For local development**, make sure your `.env` file has:
   ```env
   SUPABASE_URL=https://pwwdihmajwbhrjmfathm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Test the form** - it should now work correctly!

## Alternative Solution (If You Prefer Anon Key)

If you want to use the `anon` key instead, you need to fix the RLS policy in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL to ensure the policy exists:

```sql
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous inserts" ON contacts;

-- Create the policy
CREATE POLICY "Allow anonymous inserts" ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

However, **using service_role key is recommended** for server-side operations as it's more secure and reliable.

## Security Note

⚠️ **Important**: The `service_role` key should **NEVER** be exposed in client-side code. It's safe to use in:
- Firebase Functions (server-side)
- Express server (server-side)
- Any backend code

It should **NOT** be used in:
- Frontend React code
- Browser JavaScript
- Public repositories

The current implementation is secure because it only uses the service_role key in server-side code (Firebase Functions and Express server).

