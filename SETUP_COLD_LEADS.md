# Cold Leads Table Setup Guide

## ✅ What's Been Done

**New Table Created:** `cold_leads`
- Stores normalized lead data from Instantly CSV exports
- Includes first name, last name, company, location, LinkedIn, and up to 2 email addresses

**Integration Complete:**
- ✅ Service to import and manage cold leads
- ✅ API endpoints for importing and querying leads
- ✅ CSV import script for bulk imports

---

## 📋 Step 1: Create the Cold Leads Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase_cold_leads_table.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

The SQL will:
- Create the `cold_leads` table with normalized fields
- Add indexes for better performance
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically update `updated_at` timestamp

---

## 📊 Table Structure

The `cold_leads` table stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated unique ID |
| `first_name` | TEXT | Lead's first name |
| `last_name` | TEXT | Lead's last name |
| `company` | TEXT | Company name |
| `location` | TEXT | Location (city, state, country, etc.) |
| `linkedin_url` | TEXT | Full LinkedIn profile URL |
| `email_1` | TEXT | Primary email address |
| `email_2` | TEXT | Secondary email address (if available) |
| `company_website` | TEXT | Company website URL |
| `source` | TEXT | Source of the lead (default: "instantly") |
| `imported_at` | TIMESTAMPTZ | When the lead was imported |
| `created_at` | TIMESTAMPTZ | When the record was created |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

---

## 📥 Step 2: Import Leads from CSV

### Option 1: Using the Import Script (Recommended)

1. Make sure your `.env` file has Supabase credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Run the import script:
   ```bash
   node scripts/import-cold-leads.js /path/to/leads.csv
   ```

   Or use the default path:
   ```bash
   node scripts/import-cold-leads.js
   ```

The script will:
- ✅ Read and parse the CSV file
- ✅ Normalize the data (clean up LinkedIn URLs, websites, etc.)
- ✅ Extract up to 2 email addresses
- ✅ Import in batches of 100 for efficiency
- ✅ Show progress and results

### Option 2: Using the API Endpoint

You can also import leads programmatically via the API:

```bash
curl -X POST http://localhost:3001/api/import-cold-leads \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "company": "Acme Inc",
        "location": "New York, NY",
        "linkedinUrl": "https://linkedin.com/in/johndoe",
        "email1": "john@acme.com",
        "email2": "j.doe@acme.com",
        "companyWebsite": "https://acme.com",
        "source": "instantly"
      }
    ]
  }'
```

---

## 🔍 Querying Cold Leads

### Get All Leads (with pagination)
```bash
GET /api/cold-leads?limit=50&offset=0
```

### Search Leads
```bash
GET /api/cold-leads?search=john
```

This searches across:
- First name
- Last name
- Company
- Email addresses

### In Supabase SQL Editor

```sql
-- Get all leads
SELECT * FROM cold_leads 
ORDER BY imported_at DESC 
LIMIT 50;

-- Search by company
SELECT * FROM cold_leads 
WHERE company ILIKE '%fitness%'
ORDER BY imported_at DESC;

-- Find leads with LinkedIn profiles
SELECT * FROM cold_leads 
WHERE linkedin_url IS NOT NULL
ORDER BY imported_at DESC;

-- Find leads by location
SELECT * FROM cold_leads 
WHERE location ILIKE '%New York%'
ORDER BY imported_at DESC;
```

---

## 📝 Data Normalization

The import script automatically normalizes:

1. **LinkedIn URLs:**
   - Adds `https://` if missing
   - Converts `linkedin.com/in/...` to full URL
   - Handles various LinkedIn URL formats

2. **Company Websites:**
   - Adds `https://` if missing
   - Removes "No data found" and "Skipped" values

3. **Emails:**
   - Validates email format
   - Stores up to 2 emails per lead
   - Skips invalid or placeholder emails

4. **Location:**
   - Trims whitespace
   - Removes "Skipped" values

5. **Company:**
   - Trims whitespace
   - Removes "Skipped" values

---

## 🎯 Example CSV Format

Your CSV should have these columns (case-insensitive):
- `Email` - Primary email address
- `First Name` - First name
- `Last Name` - Last name
- `companyName` or `Company` - Company name
- `location` - Location
- `linkedIn` - LinkedIn profile URL or path
- `companyWebsite` or `companyDomain` - Company website

The script handles variations in column names and missing data gracefully.

---

## 🔧 Troubleshooting

### "Could not find the table 'public.cold_leads'"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that the table was created in the correct schema (should be `public`)

### "new row violates row-level security policy"
- The RLS policy should allow anonymous inserts
- Check the SQL script includes: `CREATE POLICY "Allow anonymous inserts"`
- **Quick fix:** If you're using the import script, you can temporarily disable RLS:
  ```sql
  ALTER TABLE cold_leads DISABLE ROW LEVEL SECURITY;
  ```
- **Better fix:** Make sure the policy exists and is correct:
  ```sql
  DROP POLICY IF EXISTS "Allow anonymous inserts" ON cold_leads;
  CREATE POLICY "Allow anonymous inserts" ON cold_leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  ```
- **Alternative:** Use the service role key instead of anon key for imports (more secure for bulk operations)

### Import script fails with "Missing environment variables"
- Make sure your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Run the script from the project root directory

### Some leads not imported
- Check the script output for errors
- Leads without names or emails are skipped
- Invalid email formats are skipped

---

## 📁 Files Created

1. **`supabase_cold_leads_table.sql`** - SQL script to create the table
2. **`server/services/coldLeadsService.ts`** - Service to manage cold leads
3. **`scripts/import-cold-leads.js`** - CSV import script
4. **`server/index.ts`** - Updated with API endpoints

---

## ✅ Next Steps

Once the table is created:
1. ✅ Import your CSV file using the script
2. ✅ Query leads via API or Supabase dashboard
3. ✅ Use the data for outreach campaigns
4. ✅ Track which leads convert to contacts

---

## 🔗 Related Tables

- **`contacts`** - Warm leads from form submissions
- **`workflow_results`** - Legal analysis results for websites
- **`cold_leads`** - Cold leads from Instantly or other sources

You can join these tables to track the full lead journey!

