/*
  # Fix API Config Initial Data

  1. Changes
    - Add default row to api_config table
    - Update policies to handle empty state
*/

-- Insert default row if it doesn't exist
INSERT INTO api_config (id, api_key, assistant_id)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Update policies to be more permissive for admins
DROP POLICY IF EXISTS "Only admins can view api config" ON api_config;
DROP POLICY IF EXISTS "Only admins can insert api config" ON api_config;
DROP POLICY IF EXISTS "Only admins can update api config" ON api_config;

CREATE POLICY "Admins have full access to api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());