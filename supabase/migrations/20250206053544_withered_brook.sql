-- First ensure role is unique in api_limits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'api_limits_role_key'
  ) THEN
    ALTER TABLE api_limits
    ADD CONSTRAINT api_limits_role_key UNIQUE (role);
  END IF;
END $$;

-- Insert default API limits
INSERT INTO api_limits (role, daily_message_limit)
VALUES 
  ('user', 50),
  ('admin', 1000)
ON CONFLICT (role) 
DO UPDATE SET 
  daily_message_limit = EXCLUDED.daily_message_limit,
  updated_at = now();

-- Initialize message counts for existing users using a procedure
-- This is safer than a direct insert as it handles conflicts properly
CREATE OR REPLACE PROCEDURE initialize_message_counts()
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles
  LOOP
    INSERT INTO message_counts (user_id, date, count)
    VALUES (user_record.id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, date) DO NOTHING;
  END LOOP;
END;
$$;

-- Execute the procedure
CALL initialize_message_counts();