-- Add admin access policy to profiles table
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin() FROM is_admin())
  OR auth.uid() = id
);

-- Update existing update policy to allow admin access
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile or admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin() FROM is_admin())
  OR auth.uid() = id
)
WITH CHECK (
  (SELECT is_admin() FROM is_admin())
  OR auth.uid() = id
);