-- Add model column to api_config
ALTER TABLE api_config
ADD COLUMN IF NOT EXISTS default_model text NOT NULL DEFAULT 'gpt-4o';

-- Update manage_api_config function to include model
CREATE OR REPLACE FUNCTION manage_api_config(
  p_api_key text,
  p_assistant_id text,
  p_default_model text DEFAULT 'gpt-4o'
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

  -- Validate model
  IF p_default_model NOT IN ('gpt-4-turbo-preview', 'gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo') THEN
    RAISE EXCEPTION 'Invalid model specified';
  END IF;

  INSERT INTO api_config (id, api_key, assistant_id, default_model)
  VALUES (1, p_api_key, p_assistant_id, p_default_model)
  ON CONFLICT (id) DO UPDATE
  SET api_key = EXCLUDED.api_key,
      assistant_id = EXCLUDED.assistant_id,
      default_model = EXCLUDED.default_model;
END;
$$;