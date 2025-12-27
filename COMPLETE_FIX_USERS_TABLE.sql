-- ============================================
-- COMPLETE FIX: Remove ALL broken triggers from users table
-- ============================================
-- This removes all triggers that might be interfering
-- and recreates only the essential ones

BEGIN;

-- ============================================
-- STEP 1: Drop ALL user-created triggers on users table
-- ============================================

DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN
    SELECT t.tgname
    FROM pg_trigger t
    WHERE t.tgrelid = 'users'::regclass
      AND NOT t.tgisinternal
      AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON users', trigger_record.tgname);
    RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
  END LOOP;
END $$;

-- ============================================
-- STEP 2: Recreate ONLY the updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

COMMIT;

SELECT '✅ Cleaned up users table triggers' as status;
SELECT 'Now test the signup flow again' as next_step;
