# Quick Import Instructions

The import is being blocked by Row Level Security (RLS). Here are two ways to fix it:

## Option 1: Fix RLS Policy (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
DROP POLICY IF EXISTS "Allow anonymous inserts" ON cold_leads;
CREATE POLICY "Allow anonymous inserts" ON cold_leads
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);
```

3. Then run the import again:
```bash
tsx scripts/import-cold-leads.js /Users/rickybodner/Downloads/leads.csv
```

## Option 2: Use Service Role Key (Easier for Bulk Imports)

1. Get your service role key from Supabase:
   - Go to Settings → API
   - Copy the `service_role` key (NOT the anon key)

2. Add it to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Run the import:
```bash
tsx scripts/import-cold-leads.js /Users/rickybodner/Downloads/leads.csv
```

The service role key bypasses RLS, so it's perfect for bulk imports.

## Option 3: Temporarily Disable RLS

If you just want to import quickly:

1. Run this in Supabase SQL Editor:
```sql
ALTER TABLE cold_leads DISABLE ROW LEVEL SECURITY;
```

2. Import your leads
3. Re-enable RLS:
```sql
ALTER TABLE cold_leads ENABLE ROW LEVEL SECURITY;
```

