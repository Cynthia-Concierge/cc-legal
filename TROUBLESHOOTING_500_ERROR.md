# Troubleshooting 500 Error on Contact Save

## Issue
Getting a 500 Internal Server Error when trying to save a contact via `/api/save-contact` endpoint.

## Possible Causes

### 1. Missing Supabase Credentials in Firebase Functions

The most common cause is that Supabase environment variables are not set in Firebase Functions.

**Solution:**
```bash
# Set Supabase secrets in Firebase Functions
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY

# Then redeploy functions
firebase deploy --only functions
```

**Verify secrets are set:**
```bash
firebase functions:secrets:access SUPABASE_URL
firebase functions:secrets:access SUPABASE_ANON_KEY
```

### 2. Contacts Table Doesn't Exist

The `contacts` table might not exist in your Supabase database.

**Solution:**
1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Run the SQL from `supabase_contacts_table.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS contacts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     first_name TEXT,
     last_name TEXT,
     phone TEXT,
     website TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   
   CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
   CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
   
   ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow anonymous inserts" ON contacts
     FOR INSERT
     TO anon, authenticated
     WITH CHECK (true);
   ```

### 3. Row Level Security (RLS) Policy Issues

RLS might be blocking the insert operation.

**Solution:**
1. Check if RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'contacts';
   ```

2. Verify the policy exists:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'contacts';
   ```

3. If needed, recreate the policy (see SQL above) or temporarily disable RLS:
   ```sql
   ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
   ```
   (Note: Only do this for testing, re-enable RLS for production)

### 4. Wrong Supabase URL or Key

The credentials might be incorrect.

**Solution:**
1. Verify your Supabase URL and anon key in the Supabase dashboard:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key
2. Update Firebase Functions secrets with correct values

### 5. Network/Firebase Functions Not Deployed

The Firebase Functions might not be deployed or accessible.

**Solution:**
1. Check if functions are deployed:
   ```bash
   firebase functions:list
   ```

2. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only api
   ```

3. Redeploy if needed:
   ```bash
   firebase deploy --only functions
   ```

## Debugging Steps

### 1. Check Firebase Functions Logs
```bash
firebase functions:log
```

Look for:
- `[Save Contact] Request received` - confirms request reached the function
- `[Save Contact] Error saving contact` - shows the actual error
- `hasSupabaseUrl` and `hasSupabaseKey` - should both be `true`

### 2. Test Supabase Connection Locally
Create a test script to verify Supabase connection:

```javascript
// test-supabase-connection.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    // Test insert
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        email: 'test@example.com',
        name: 'Test User',
        phone: '1234567890',
        website: 'https://example.com'
      }])
      .select();
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

test();
```

Run it:
```bash
node test-supabase-connection.js
```

### 3. Check Browser Console
Open browser DevTools and check:
- Network tab: Look at the `/api/save-contact` request
- Console tab: Check for error messages with details

## Quick Fix Checklist

- [ ] Supabase credentials set in Firebase Functions secrets
- [ ] Firebase Functions deployed
- [ ] Contacts table exists in Supabase
- [ ] RLS policy allows anonymous inserts
- [ ] Supabase URL and key are correct
- [ ] Check Firebase Functions logs for detailed error messages

## After Fixing

Once you've resolved the issue:
1. Test the form submission again
2. Check Firebase Functions logs to confirm success
3. Verify the contact appears in Supabase `contacts` table

## Additional Notes

The improved error handling will now:
- Show detailed error messages in the console
- Validate Supabase configuration before attempting to save
- Handle duplicate email errors gracefully
- Provide better error details (code, message, hint) from Supabase

