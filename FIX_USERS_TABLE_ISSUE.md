# Fix: Authenticated Users Not Being Added to Users Table

## Problem
New users who authenticate are not being added to the `users` table in Supabase, even though they exist in `auth.users`.

## Root Cause
The application-level code attempts to insert users into the users table after password creation, but fails silently due to:
1. Potential timing issues with session establishment
2. RLS policy restrictions
3. Errors being caught and ignored ("continue anyway")

## Solution

### 1. Database Trigger (Automatic & Reliable)
A database trigger now automatically creates users table entries when auth users set their password.

**File:** `supabase_auto_create_users_trigger.sql`

**To apply this fix:**

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the entire contents of `supabase_auto_create_users_trigger.sql`
5. Click **"Run"** or press `Cmd+Enter`

**What this does:**
- ✅ Creates a trigger that automatically adds users to the `users` table when they set a real password
- ✅ Backfills all existing authenticated users who are missing from the users table
- ✅ Runs a verification query to show any remaining missing users (should be 0)

### 2. Improved Error Handling (Application-Level)
Enhanced logging and error visibility in the onboarding flow.

**File:** `src/pages/wellness/Onboarding.tsx`

**Changes made:**
- ✅ Added session verification logging
- ✅ Added detailed error logging with full error details (message, code, hint)
- ✅ Added `.select()` to the upsert to confirm successful insertion
- ✅ Shows user-visible alerts if insertion fails
- ✅ Logs all parameters being sent to help debug RLS issues

## Verification Steps

### Step 1: Apply the Database Trigger
Run the SQL script in Supabase as described above.

### Step 2: Check for Missing Users
In Supabase SQL Editor, run:

```sql
-- Find auth users NOT in users table
SELECT
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'temp_password' as is_temp_password
FROM auth.users au
LEFT JOIN users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true;
```

**Expected result:** 0 rows (after running the trigger script)

### Step 3: Test New User Signup
1. Open your app in an incognito window
2. Sign up with a new email
3. Complete the onboarding and set a password
4. Check the browser console for these logs:
   - `🔐 Session check:` - Should show hasSession: true, hasUser: true
   - `📝 Attempting upsert with data:` - Shows the data being inserted
   - `✅ User added to users table successfully` - Confirms success

5. Verify in Supabase:
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

### Step 4: Monitor Logs
After deploying:
1. Go to Supabase Dashboard → **Logs** → **Postgres Logs**
2. Watch for any errors related to the trigger
3. Should see successful INSERT statements

## What Happens Now

### For Existing Users
- ✅ All existing authenticated users have been backfilled to the users table
- They can now use the app normally

### For New Users
- ✅ When they set their password, they're automatically added to the users table via the database trigger
- ✅ If the trigger fails for any reason, the application code will still attempt the insert and show a detailed error
- ✅ Errors are now visible in both the browser console and to the user via alerts

## Rollback (if needed)

If you need to remove the trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created();
```

## Long-term Monitoring

To check if the issue recurs:

```sql
-- Run this weekly to check for any gaps
SELECT
  COUNT(*) as missing_users,
  array_agg(au.email) as emails
FROM auth.users au
LEFT JOIN users u ON au.id = u.user_id
WHERE u.user_id IS NULL
  AND (au.raw_user_meta_data->>'temp_password')::boolean IS DISTINCT FROM true;
```

Expected result: `missing_users: 0`
