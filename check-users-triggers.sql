-- Check all triggers on users table
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'users'::regclass
  AND NOT t.tgisinternal;

-- Check the source code of trigger functions
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname IN (
  SELECT p2.proname
  FROM pg_trigger t
  JOIN pg_proc p2 ON t.tgfoid = p2.oid
  WHERE t.tgrelid = 'users'::regclass
    AND NOT t.tgisinternal
);
