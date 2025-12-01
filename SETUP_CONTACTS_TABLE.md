# Contacts Table Setup Guide

## ✅ Current Status

**Supabase Connection:** ✅ Working
- Environment variables are properly configured
- Connection to Supabase is successful

**Form Integration:** ✅ Ready
- Form submits to `/api/save-contact`
- All form fields (name, email, phone, website) are properly mapped

**Missing:** ❌ Contacts table needs to be created

---

## 📋 Step 1: Create the Contacts Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase_contacts_table.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

The SQL will:
- Create the `contacts` table with all required fields
- Add indexes for better performance
- Set up Row Level Security (RLS) policies
- Allow public inserts (for form submissions)

---

## 🧪 Step 2: Verify the Setup

Run the test script to verify everything works:

```bash
node test-supabase-connection.js
```

You should see:
- ✅ Environment variables found
- ✅ Contacts table is accessible
- ✅ Successfully inserted test contact
- ✅ Test contact cleaned up
- 🎉 All tests passed!

---

## 📝 Step 3: Test the Form

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to your landing page
3. Fill out the "Enter Your Info" form:
   - Name: Test User
   - Email: test@example.com
   - Phone: (555) 123-4567
   - Website: test.com

4. Submit the form

5. Check Supabase Dashboard:
   - Go to **Table Editor** → `contacts`
   - You should see the new contact!

---

## 🔍 Troubleshooting

### "Could not find the table 'public.contacts'"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that the table was created in the correct schema (should be `public`)

### "new row violates row-level security policy"
- The RLS policy should allow public inserts
- Check the SQL script includes: `CREATE POLICY "Allow public inserts"`
- Or disable RLS temporarily: `ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;`

### "duplicate key value violates unique constraint"
- This means the email already exists (expected if someone submits twice)
- The form will still work, but duplicate emails won't be saved

### Form submits but contact doesn't appear
- Check browser console for errors
- Check server logs for Supabase errors
- Verify the API endpoint `/api/save-contact` is accessible
- Make sure your server is running on the correct port

---

## 📊 Table Structure

The `contacts` table has these fields:
- `id` (UUID) - Auto-generated unique ID
- `email` (TEXT) - Required, unique
- `name` (TEXT) - Required, full name
- `first_name` (TEXT) - Auto-split from name
- `last_name` (TEXT) - Auto-split from name
- `phone` (TEXT) - Optional
- `website` (TEXT) - Optional
- `created_at` (TIMESTAMPTZ) - Auto-set timestamp

---

## 🎯 Next Steps

Once the table is created and tested:
1. ✅ Form submissions will automatically save to Supabase
2. ✅ You can view all contacts in Supabase Dashboard
3. ✅ You can export contacts or integrate with other tools
4. ✅ Contacts are stored securely with timestamps

