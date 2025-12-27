-- Drop potentially recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Ensure is_admin function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create policies using the safe function
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
