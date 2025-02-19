-- Drop existing functions
DROP FUNCTION IF EXISTS upgrade_to_plus(uuid);
DROP FUNCTION IF EXISTS renew_subscription(uuid);
DROP FUNCTION IF EXISTS process_subscription_end();
DROP FUNCTION IF EXISTS request_downgrade(uuid);
DROP FUNCTION IF EXISTS downgrade_to_free(uuid);

-- Create or replace function to handle subscription upgrades
CREATE OR REPLACE FUNCTION upgrade_to_plus(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role text;
  end_date timestamptz;
BEGIN
  -- Get current role
  SELECT role INTO current_role
  FROM profiles
  WHERE id = user_id_param;

  -- Set subscription end date (1 month from now)
  end_date := now() + interval '1 month';

  -- Update profile
  UPDATE profiles
  SET 
    role = 'plus',
    previous_role = current_role,
    subscription_end = end_date,
    pending_downgrade = true -- Always set to pending downgrade
  WHERE id = user_id_param;

  -- Insert payment record
  INSERT INTO payments (
    user_id,
    amount,
    status,
    subscription_period_start,
    subscription_period_end
  ) VALUES (
    user_id_param,
    5.00,
    'completed',
    now(),
    end_date
  );
END;
$$;

-- Create or replace function to handle immediate downgrade
CREATE OR REPLACE FUNCTION downgrade_to_free(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    role = 'user',
    subscription_end = NULL,
    pending_downgrade = false,
    previous_role = 'plus'
  WHERE id = user_id_param
  AND role = 'plus';
END;
$$;

-- Create or replace function to process subscription end
CREATE OR REPLACE FUNCTION process_subscription_end()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find all expired subscriptions and downgrade them
  UPDATE profiles
  SET 
    role = 'user',
    subscription_end = NULL,
    pending_downgrade = false,
    previous_role = 'plus'
  WHERE role = 'plus'
  AND subscription_end <= now();
END;
$$;

-- Create or replace function to renew subscription
CREATE OR REPLACE FUNCTION renew_subscription(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_end_date timestamptz;
BEGIN
  -- Set new end date to 1 month from now
  new_end_date := now() + interval '1 month';

  -- Update profile
  UPDATE profiles
  SET 
    role = 'plus',
    subscription_end = new_end_date,
    pending_downgrade = false -- Set to false when renewing
  WHERE id = user_id_param;

  -- Insert payment record
  INSERT INTO payments (
    user_id,
    amount,
    status,
    subscription_period_start,
    subscription_period_end
  ) VALUES (
    user_id_param,
    5.00,
    'completed',
    now(),
    new_end_date
  );
END;
$$;

-- Ensure cron job exists and runs every hour to check for expired subscriptions
SELECT cron.schedule(
  'check-subscriptions',
  '0 * * * *', -- Run every hour
  $$
    SELECT process_subscription_end();
  $$
);