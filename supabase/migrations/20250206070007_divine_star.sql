/*
  # Add admin stats RPC function

  1. New Functions
    - `get_admin_stats`: Secure RPC function for admin dashboard statistics
      - Validates admin access
      - Returns aggregated statistics for the dashboard
      - Handles weekly and total counts

  2. Security
    - Function is SECURITY DEFINER to ensure proper access control
    - Validates admin role before returning data
    - Uses search_path for security
*/

-- Create the RPC function for admin stats
CREATE OR REPLACE FUNCTION get_admin_stats(
  week_ago timestamptz,
  two_weeks_ago timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verify admin access
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get all required stats
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM profiles) as total_users,
      (SELECT COUNT(*) FROM chat_sessions) as total_chats,
      (SELECT COUNT(*) FROM advisories) as total_advisories,
      (SELECT COUNT(*) FROM advisories WHERE status = 'pending') as pending_advisories,
      (SELECT COUNT(*) FROM profiles WHERE created_at >= week_ago) as new_users_week,
      (SELECT COUNT(*) FROM profiles WHERE created_at >= two_weeks_ago AND created_at < week_ago) as new_users_prev_week,
      (SELECT COUNT(*) FROM chat_sessions WHERE created_at >= week_ago) as new_chats_week,
      (SELECT COUNT(*) FROM advisories WHERE created_at >= week_ago) as new_advisories_week,
      (SELECT COUNT(*) FROM advisories WHERE status = 'reviewed' AND responded_at >= week_ago) as resolved_advisories_week
  )
  SELECT json_build_object(
    'total_users', total_users,
    'total_chats', total_chats,
    'total_advisories', total_advisories,
    'pending_advisories', pending_advisories,
    'weekly_stats', json_build_object(
      'new_users', new_users_week,
      'new_chats', new_chats_week,
      'new_advisories', new_advisories_week,
      'resolved_advisories', resolved_advisories_week
    ),
    'user_growth', CASE 
      WHEN new_users_prev_week = 0 THEN 100
      ELSE ((new_users_week::float - new_users_prev_week::float) / new_users_prev_week::float * 100)
    END,
    'advisory_resolution_rate', CASE 
      WHEN total_advisories = 0 THEN 0
      ELSE ((total_advisories - pending_advisories)::float / total_advisories::float * 100)
    END
  ) INTO result
  FROM stats;

  RETURN result;
END;
$$;