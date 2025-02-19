-- Update the role check constraint to include 'plus'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'inactive', 'plus'));

-- Update api_limits role constraint
ALTER TABLE api_limits
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE api_limits
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'plus'));

-- Update API limits for plus users
INSERT INTO api_limits (role, daily_message_limit)
VALUES ('plus', 20)
ON CONFLICT (role) 
DO UPDATE SET daily_message_limit = 20;

-- Update free tier limit to 5
UPDATE api_limits 
SET daily_message_limit = 5
WHERE role = 'user';