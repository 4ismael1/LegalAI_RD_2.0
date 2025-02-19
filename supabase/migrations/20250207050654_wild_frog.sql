-- Create function to increment message count atomically
CREATE OR REPLACE FUNCTION increment_message_count(
  p_user_id uuid,
  p_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE message_counts
  SET count = count + 1
  WHERE user_id = p_user_id
  AND date = p_date;
END;
$$;