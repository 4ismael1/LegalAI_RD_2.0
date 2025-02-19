-- Ensure api_config table exists with correct structure
CREATE TABLE IF NOT EXISTS api_config (
  id integer PRIMARY KEY CHECK (id = 1),
  api_key text NOT NULL,
  assistant_id text NOT NULL,
  default_model text NOT NULL DEFAULT 'gpt-4o',
  subscriptions_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default row if it doesn't exist
INSERT INTO api_config (id, api_key, assistant_id, subscriptions_enabled)
VALUES (1, '', '', true)
ON CONFLICT (id) DO UPDATE
SET subscriptions_enabled = EXCLUDED.subscriptions_enabled;

-- Ensure RLS policies exist
DROP POLICY IF EXISTS "Admins have full access to api config" ON api_config;

CREATE POLICY "Admins have full access to api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());