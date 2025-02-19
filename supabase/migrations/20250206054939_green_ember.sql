/*
  # Create API Configuration Table

  1. New Tables
    - `api_config`
      - `id` (integer, primary key)
      - `api_key` (text)
      - `assistant_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policy for admin access only
*/

-- Create api_config table
CREATE TABLE IF NOT EXISTS api_config (
  id integer PRIMARY KEY DEFAULT 1,
  api_key text NOT NULL,
  assistant_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
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

-- Create policies
CREATE POLICY "Only admins can view api config"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can insert api config"
  ON api_config
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update api config"
  ON api_config
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());