/*
  # Add user role to profiles

  1. Changes
    - Add role column to profiles table with default 'user'
    - Add admin role policy
*/

-- Add role column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;