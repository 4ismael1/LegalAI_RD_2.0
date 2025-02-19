-- Add subscription related columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_end timestamptz,
ADD COLUMN IF NOT EXISTS pending_downgrade boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_role text;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
  created_at timestamptz DEFAULT now(),
  subscription_period_start timestamptz NOT NULL,
  subscription_period_end timestamptz NOT NULL
);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (SELECT is_admin() FROM is_admin())
  );

CREATE POLICY "System can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (SELECT is_admin() FROM is_admin())
  );

-- Create function to handle subscription upgrades
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
    pending_downgrade = false
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

-- Create function to handle subscription downgrades
CREATE OR REPLACE FUNCTION request_downgrade(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET pending_downgrade = true
  WHERE id = user_id_param
  AND role = 'plus';
END;
$$;

-- Create function to process subscription end
CREATE OR REPLACE FUNCTION process_subscription_end(user_id_param uuid)
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
    pending_downgrade = false
  WHERE id = user_id_param
  AND role = 'plus'
  AND subscription_end <= now();
END;
$$;

-- Create function to renew subscription
CREATE OR REPLACE FUNCTION renew_subscription(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_end_date timestamptz;
BEGIN
  -- Calculate new end date
  SELECT 
    CASE 
      WHEN subscription_end IS NULL OR subscription_end < now()
      THEN now() + interval '1 month'
      ELSE subscription_end + interval '1 month'
    END
  INTO new_end_date
  FROM profiles
  WHERE id = user_id_param;

  -- Update profile
  UPDATE profiles
  SET 
    role = 'plus',
    subscription_end = new_end_date,
    pending_downgrade = false
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
    CASE 
      WHEN new_end_date - interval '1 month' < now()
      THEN now()
      ELSE new_end_date - interval '1 month'
    END,
    new_end_date
  );
END;
$$;