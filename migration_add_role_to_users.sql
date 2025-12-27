-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update RLS policies to allow admins to see everything

-- Policy for admins to view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
  );

-- Policy for admins to update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
  );

-- Function to check if user is admin (optional helper)
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
