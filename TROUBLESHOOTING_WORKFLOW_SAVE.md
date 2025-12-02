# Troubleshooting: Workflow Not Saving to Database

## Quick Checks

### 1. **Restart Your Server**
The code has been updated to use `SUPABASE_SERVICE_ROLE_KEY`. **You MUST restart your server** for changes to take effect.

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
# or
node server/index.ts
```

### 2. **Check Server Console Logs**
When you run the analyzer, watch your server console. You should see:

**✅ Success:**
```
[Workflow] Successfully saved workflow results to Supabase
[Workflow] Saved record ID: <uuid>
[WorkflowResults] Successfully saved workflow result: <uuid>
```

**❌ Error:**
```
[Workflow] Error saving workflow results to Supabase: <error>
[Workflow] Error code: <code>
[Workflow] Error message: <message>
```

### 3. **Check API Response**
The API now returns whether the save succeeded. Check the browser console or network tab:

```json
{
  "success": true,
  "savedToDatabase": true,  // Should be true if saved
  "saveError": null,         // Should be null if saved
  "data": { ... }
}
```

If `savedToDatabase` is `false`, check `saveError` for details.

## Common Errors

### Error: Column does not exist (code: 42703)
**Solution:** Run the migration script in Supabase SQL Editor:
- File: `migration_add_contact_info_and_analyzed_at.sql`

### Error: Permission denied (code: 42501)
**Solution:** Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Error: Invalid input syntax (code: 22P02)
**Solution:** Check that all JSONB fields are valid JSON. The code should handle this automatically.

## Testing

### Test 1: Check Environment Variables
```bash
# Make sure these are set in your .env file
grep SUPABASE .env
```

Should show:
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (preferred)
- `SUPABASE_ANON_KEY=...` (fallback)

### Test 2: Check Database Connection
1. Go to Supabase Dashboard
2. Check Table Editor → `workflow_results`
3. See if any records exist

### Test 3: Run Analyzer and Check Logs
1. Run the legal analyzer from the UI
2. Watch server console for save messages
3. Check browser console for API response
4. Check Supabase dashboard for new record

## What Was Fixed

1. ✅ Updated `workflowResultsService` to use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
2. ✅ Added detailed error logging
3. ✅ Added `savedToDatabase` flag to API response
4. ✅ Added error details to API response

## Still Not Working?

1. **Check server is running the updated code:**
   - Restart the server
   - Check that console shows the new log messages

2. **Check Supabase credentials:**
   - Verify `.env` file has correct keys
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

3. **Check database schema:**
   - Run migration script if you haven't
   - Verify columns exist in `workflow_results` table

4. **Check RLS policies:**
   - Should allow inserts with service_role key
   - Check Supabase dashboard → Authentication → Policies

5. **Share error details:**
   - Copy the full error from server console
   - Include the `saveError` object from API response

