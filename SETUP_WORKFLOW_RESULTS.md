# Workflow Results Table Setup Guide

## ✅ What's Been Done

**New Table Created:** `workflow_results`
- Stores all data from the Legal Analyzer workflow
- Includes website URL, legal documents, analysis, generated email, and execution details

**Integration Complete:**
- ✅ Workflow results are automatically saved after each workflow run
- ✅ Both server endpoint (`/api/scrape-and-analyze`) and Vercel API endpoint save results
- ✅ Error results are also saved for debugging

---

## 📋 Step 1: Create the Workflow Results Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase_workflow_results_table.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

The SQL will:
- Create the `workflow_results` table with all required fields
- Add indexes for better performance (including GIN indexes for JSONB columns)
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically update `updated_at` timestamp
- Allow anonymous inserts (for workflow submissions)

---

## 📊 Table Structure

The `workflow_results` table stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated unique ID |
| `website_url` | TEXT | The website that was analyzed |
| `lead_name` | TEXT | Optional lead name |
| `lead_company` | TEXT | Optional lead company |
| `lead_email` | TEXT | Optional lead email |
| `legal_documents` | JSONB | Legal documents found (privacy policy, terms, etc.) |
| `analysis` | JSONB | Complete legal analysis results |
| `email_subject` | TEXT | Generated email subject line |
| `email_body` | TEXT | Generated email body (HTML) |
| `execution_details` | JSONB | Workflow execution metadata |
| `status` | TEXT | Workflow status: pending, running, completed, error |
| `error_message` | TEXT | Error message if workflow failed |
| `created_at` | TIMESTAMPTZ | When the workflow was created |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

---

## 🧪 Step 2: Verify It Works

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the Lead Scraper page in your app
3. Enter a website URL and run the workflow
4. After the workflow completes, check Supabase:
   - Go to **Table Editor** → `workflow_results`
   - You should see a new row with all the workflow data!

---

## 📝 What Gets Saved

Every time the Legal Analyzer workflow runs, it automatically saves:

1. **Website Information:**
   - Website URL
   - Lead information (if provided)

2. **Legal Documents Found:**
   - Privacy Policy
   - Terms of Service
   - Cookie Policy
   - Any other legal documents detected

3. **Legal Analysis:**
   - Missing documents
   - Document issues (with severity)
   - Marketing risks
   - Operational risks
   - Recommendations
   - Summary

4. **Generated Email:**
   - Subject line
   - Email body (HTML)

5. **Execution Details:**
   - Workflow node execution times
   - Status of each step
   - Any errors encountered

---

## 🔍 Querying the Data

You can query workflow results in Supabase:

### Get all results for a website:
```sql
SELECT * FROM workflow_results 
WHERE website_url = 'https://example.com'
ORDER BY created_at DESC;
```

### Get recent results:
```sql
SELECT * FROM workflow_results 
ORDER BY created_at DESC 
LIMIT 10;
```

### Get results with errors:
```sql
SELECT * FROM workflow_results 
WHERE status = 'error';
```

### Query JSONB fields:
```sql
-- Get all results missing privacy policy
SELECT * FROM workflow_results 
WHERE analysis->'missingDocuments' @> '["Privacy Policy"]'::jsonb;
```

---

## 🎯 Benefits

1. **Historical Tracking:** See all websites analyzed over time
2. **Debugging:** Review failed workflows and errors
3. **Analytics:** Analyze which documents are most commonly missing
4. **Email History:** Access previously generated emails
5. **Lead Tracking:** Connect workflow results with lead information

---

## 🔧 Troubleshooting

### "Could not find the table 'public.workflow_results'"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that the table was created in the correct schema (should be `public`)

### "new row violates row-level security policy"
- The RLS policy should allow anonymous inserts
- Check the SQL script includes: `CREATE POLICY "Allow anonymous inserts"`
- Or disable RLS temporarily: `ALTER TABLE workflow_results DISABLE ROW LEVEL SECURITY;`

### Workflow runs but no data is saved
- Check server logs for Supabase errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `.env`
- Check that the workflow completed successfully (not just started)

---

## 📁 Files Created/Updated

1. **`supabase_workflow_results_table.sql`** - SQL script to create the table
2. **`server/services/workflowResultsService.ts`** - Service to save/retrieve workflow results
3. **`server/index.ts`** - Updated to save results after workflow completes
4. **`api/scrape-and-analyze.ts`** - Updated Vercel API endpoint to save results

---

## ✅ Next Steps

Once the table is created:
1. ✅ All workflow runs will automatically save to Supabase
2. ✅ You can view all results in Supabase Dashboard
3. ✅ You can query and analyze the data
4. ✅ You can build dashboards or reports using this data

