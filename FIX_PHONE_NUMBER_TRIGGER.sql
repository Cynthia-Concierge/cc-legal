-- ============================================
-- FIX: Remove broken trigger trying to access phone_number field
-- ============================================

BEGIN;

-- List all triggers on users table to see what's there
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- Drop any triggers on users table that might be causing issues
-- (Keep only the update timestamp trigger)

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS sync_phone_number ON users;
DROP TRIGGER IF EXISTS handle_user_phone_update ON users;
DROP TRIGGER IF EXISTS update_user_phone ON users;

-- Recreate ONLY the updated_at trigger
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

SELECT '✅ Removed broken triggers from users table' as status;
