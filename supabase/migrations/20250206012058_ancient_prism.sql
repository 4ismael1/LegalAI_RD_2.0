/*
  # Fix Database Relationships

  1. Changes
    - Add foreign key relationship between profiles and auth.users
    - Add foreign key relationship between chat_sessions and profiles
    - Update queries to use proper joins

  2. Security
    - Maintain existing RLS policies
*/

-- Add foreign key relationship between profiles and auth.users
DO $$ 
BEGIN
  -- First ensure the auth.users table exists in the search path
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'auth.users table not found';
  END IF;

  -- Then create the foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key relationship between chat_sessions and profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;