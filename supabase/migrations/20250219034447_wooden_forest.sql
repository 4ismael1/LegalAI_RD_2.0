-- Insert default row if it doesn't exist
INSERT INTO api_config (id, api_key, assistant_id)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop all existing policies for api_config
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON api_config;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'api_config'
  );
END $$;

-- Create new admin access policy
CREATE POLICY "Admins have full access to api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());