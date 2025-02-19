/*
  # Fix API Config Table and Initial Data

  1. Changes
    - Drop and recreate api_config table with proper constraints
    - Ensure initial row exists
    - Update policies for better admin access
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS api_config CASCADE;

-- Recreate table with proper constraints
CREATE TABLE api_config (
  id integer PRIMARY KEY CHECK (id = 1),
  api_key text NOT NULL,
  assistant_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_config_updated_at
  BEFORE UPDATE ON api_config
  FOR EACH ROW
  EXECUTE FUNCTION update_api_config_updated_at();

-- Insert initial row
INSERT INTO api_config (id, api_key, assistant_id)
VALUES (1, '', '')
ON CONFLICT (id) DO UPDATE
SET api_key = EXCLUDED.api_key,
    assistant_id = EXCLUDED.assistant_id;

-- Create admin access policy
CREATE POLICY "Admins have full access to api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());