# Debugging Trademark Database Save Issue

## Quick Checks

### 1. Check Server Console Logs

When you submit the quiz, look for these log messages in your terminal:

```
[Trademark] Received request for: [business name] ([email])
[Trademark] Attempting to save to database with user_id: [user_id]
```

**If you see "No user_id provided":**
- The frontend isn't sending the user_id
- Check browser console for errors
- Verify user is logged in

**If you see "Database insert error":**
- Check the error details that follow
- Common issues:
  - Table doesn't exist
  - RLS policy blocking insert
  - Column type mismatch

### 2. Verify Table Exists

Run this in Supabase SQL Editor:

```sql
SELECT * FROM trademark_requests LIMIT 5;
```

**If you get "relation does not exist":**
- Run the `supabase_trademark_tables.sql` script

### 3. Check RLS Policies

The service role key should bypass RLS, but verify:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'trademark_requests';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'trademark_requests';
```

### 4. Test Database Connection

Create a test file `test-trademark-db.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  const testData = {
    user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
    business_name: 'Test Business',
    quiz_score: 5,
    risk_level: 'MODERATE RISK',
    status: 'completed'
  };

  console.log('Testing insert...');
  const { data, error } = await supabase
    .from('trademark_requests')
    .insert(testData)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

testInsert();
```

Run: `node test-trademark-db.js`

## Common Issues & Solutions

### Issue 1: Table Doesn't Exist
**Solution:** Run `supabase_trademark_tables.sql` in Supabase SQL Editor

### Issue 2: RLS Blocking Insert
**Solution:** Service role key should bypass RLS, but if issues persist:
```sql
-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE trademark_requests DISABLE ROW LEVEL SECURITY;
```

### Issue 3: user_id Not Being Sent
**Check frontend:**
- Open browser DevTools → Network tab
- Submit the quiz
- Find the `/api/trademarks/request` request
- Check the request payload - does it include `user_id`?

### Issue 4: Column Type Mismatch
**Check:** The `status` value must be one of: 'pending', 'completed', 'error'
- Current code uses 'completed' which should work

## Enhanced Logging

The code now logs:
- When attempting to save
- The user_id being used
- Full error details if insert fails
- Success confirmation with returned data

Check your server console for these messages!

