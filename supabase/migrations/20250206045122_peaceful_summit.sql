/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Update existing profiles with email from auth.users
  
  2. Notes
    - This ensures email is stored in profiles for easier access
    - Maintains sync with auth.users email
*/

-- Add email column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id;

-- Create trigger to keep email in sync with auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON auth.users;
CREATE TRIGGER sync_profile_email_trigger
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();