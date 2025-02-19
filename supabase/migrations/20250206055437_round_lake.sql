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

-- Create secure function to manage api_config
CREATE OR REPLACE FUNCTION manage_api_config(
  p_api_key text,
  p_assistant_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only administrators can manage API configuration';
  END IF;

  INSERT INTO api_config (id, api_key, assistant_id)
  VALUES (1, p_api_key, p_assistant_id)
  ON CONFLICT (id) DO UPDATE
  SET api_key = EXCLUDED.api_key,
      assistant_id = EXCLUDED.assistant_id;
END;
$$;

-- Insert initial row directly (bypassing RLS)
ALTER TABLE api_config DISABLE ROW LEVEL SECURITY;
INSERT INTO api_config (id, api_key, assistant_id)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;
ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

-- Create admin access policies
CREATE POLICY "Admins can view api config"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update api config"
  ON api_config
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete api config"
  ON api_config
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert api config"
  ON api_config
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());