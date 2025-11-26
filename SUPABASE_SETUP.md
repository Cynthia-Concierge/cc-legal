# Supabase Setup Guide

This guide will walk you through setting up Supabase to store form submissions as contacts.

## Step 1: Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or log in if you already have one)
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Choose a name (e.g., "CClegal Contacts")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for it to finish setting up (takes ~2 minutes)

## Step 2: Create the Contacts Table

1. In your Supabase project dashboard, go to **Table Editor** (left sidebar)
2. Click **"New table"**
3. Configure the table:
   - **Name**: `contacts`
   - **Description**: "Form submissions from landing page"
4. Add the following columns (click "Add column" for each):

   | Column Name | Type | Default Value | Nullable | Unique |
   |------------|------|---------------|----------|--------|
   | `id` | `uuid` | `gen_random_uuid()` | ❌ | ✅ (Primary Key) |
   | `email` | `text` | - | ❌ | ✅ |
   | `name` | `text` | - | ❌ | ❌ |
   | `first_name` | `text` | - | ✅ | ❌ |
   | `last_name` | `text` | - | ✅ | ❌ |
   | `phone` | `text` | - | ✅ | ❌ |
   | `website` | `text` | - | ✅ | ❌ |
   | `created_at` | `timestamptz` | `now()` | ❌ | ❌ |

5. Set `id` as the **Primary Key**:
   - Click on the `id` column
   - Check "Is Primary Key"
   
6. Set `email` as **Unique**:
   - Click on the `email` column
   - Check "Is Unique"

7. Click **"Save"** to create the table

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 4: Add Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add these two lines to your `.env` file:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace the values with your actual Project URL and anon key from Step 3.

**Important**: 
- Never commit your `.env` file to git (it should already be in `.gitignore`)
- The `anon` key is safe to use in server-side code (it's public, but Row Level Security will protect your data)

## Step 5: Set Up Row Level Security (Optional but Recommended)

1. In Supabase, go to **Authentication** → **Policies**
2. Click on the `contacts` table
3. Create a new policy:
   - **Policy name**: "Allow insert for authenticated users"
   - **Allowed operation**: INSERT
   - **Policy definition**: 
     ```sql
     true
     ```
   - **Target roles**: `authenticated`, `anon`
4. Click **"Save"**

**Note**: For a simple contact form, you can also disable RLS on the `contacts` table if you prefer. Go to **Table Editor** → `contacts` → **Settings** → uncheck "Enable RLS".

## Step 6: Test the Integration

1. Make sure your server is running:
   ```bash
   npm run dev
   ```

2. Submit the form on your landing page

3. Check your Supabase dashboard:
   - Go to **Table Editor** → `contacts`
   - You should see the new contact appear in the table!

## Troubleshooting

### "Failed to save contact to Supabase"
- Check that your `.env` file has the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Make sure your server restarted after adding the environment variables
- Check the server console for detailed error messages

### "new row violates row-level security policy"
- Make sure RLS is either disabled or you've set up the correct policies (see Step 5)

### "duplicate key value violates unique constraint"
- This means the email already exists in the database (which is expected if someone submits twice)

## What Happens Now?

Every time someone fills out your form:
1. ✅ Contact is saved to Supabase `contacts` table
2. ✅ Contact is also sent to Instantly.ai (existing functionality)
3. ✅ User sees the thank you page

You can now:
- View all contacts in your Supabase dashboard
- Export contacts as CSV
- Set up email notifications
- Create custom reports
- Integrate with other tools via Supabase API

## Next Steps (Optional)

- Set up email notifications when a new contact is added
- Create a dashboard to view contacts
- Add tags or categories to contacts
- Set up automated follow-up sequences

