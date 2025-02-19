/*
  # Add INSERT policy for profiles table

  1. Changes
    - Add INSERT policy to allow authenticated users to create their own profile

  2. Security
    - Policy ensures users can only create profiles with their own user ID
*/

-- Add INSERT policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;