/*
  # API Limits and Message Tracking System

  1. New Tables
    - `api_limits`
      - `id` (uuid, primary key)
      - `role` (text) - user role (user/admin)
      - `daily_message_limit` (integer) - max messages per day
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `message_counts`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references profiles
      - `date` (date) - the date of counting
      - `count` (integer) - number of messages sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - check_message_limit() - Verifies if user can send more messages
    - increment_message_count() - Increments user's message count
    - reset_daily_counts() - Resets counts at midnight

  3. Security
    - RLS policies for both tables
    - Only admins can modify limits
    - Users can view their own counts
*/

-- Create api_limits table
CREATE TABLE IF NOT EXISTS api_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  daily_message_limit integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Create message_counts table
CREATE TABLE IF NOT EXISTS message_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_count CHECK (count >= 0)
);

-- Create composite unique constraint
ALTER TABLE message_counts
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);

-- Enable RLS
ALTER TABLE api_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_counts ENABLE ROW LEVEL SECURITY;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_api_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_limits_updated_at
  BEFORE UPDATE ON api_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_api_limits_updated_at();

CREATE OR REPLACE FUNCTION update_message_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_counts_updated_at
  BEFORE UPDATE ON message_counts
  FOR EACH ROW
  EXECUTE FUNCTION update_message_counts_updated_at();

-- Function to check if user can send more messages
CREATE OR REPLACE FUNCTION can_send_message(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  daily_limit integer;
  current_count integer;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id_param;

  -- Get daily limit for user's role
  SELECT daily_message_limit INTO daily_limit
  FROM api_limits
  WHERE role = user_role;

  -- Get current count
  SELECT count INTO current_count
  FROM message_counts
  WHERE user_id = user_id_param
  AND date = CURRENT_DATE;

  -- If no count exists for today, user can send message
  IF current_count IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN current_count < daily_limit;
END;
$$;

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO message_counts (user_id, date, count)
  VALUES (user_id_param, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = message_counts.count + 1;
END;
$$;

-- RLS Policies

-- api_limits policies
CREATE POLICY "Everyone can view api limits"
  ON api_limits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify api limits"
  ON api_limits
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- message_counts policies
CREATE POLICY "Users can view own message counts"
  ON message_counts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (SELECT is_admin() FROM is_admin())
  );

CREATE POLICY "System can insert/update message counts"
  ON message_counts
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (SELECT is_admin() FROM is_admin())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (SELECT is_admin() FROM is_admin())
  );

-- Insert default limits
INSERT INTO api_limits (role, daily_message_limit)
VALUES 
  ('user', 50),
  ('admin', 1000)
ON CONFLICT DO NOTHING;