-- Add subscriptions_enabled column to api_config
ALTER TABLE api_config
ADD COLUMN IF NOT EXISTS subscriptions_enabled boolean DEFAULT true;

-- Update existing row
UPDATE api_config
SET subscriptions_enabled = true
WHERE id = 1;