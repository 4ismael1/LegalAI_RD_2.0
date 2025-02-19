/*
  # Add created_at column to profiles table

  1. Changes
    - Add created_at column to profiles table with default value
    - Set created_at to match auth.users creation date for existing profiles
*/

-- Add created_at column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing profiles to match auth.users creation date
UPDATE profiles
SET created_at = auth.users.created_at
FROM auth.users
WHERE profiles.id = auth.users.id;