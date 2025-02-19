/*
  # Update advisories table for in-platform responses

  1. Changes
    - Add response column for admin replies
    - Add status column with check constraint
    - Add responded_at timestamp
    - Add responded_by for admin tracking

  2. Security
    - Update RLS policies for admin access
*/

-- Add new columns to advisories
ALTER TABLE advisories
ADD COLUMN IF NOT EXISTS response text,
ADD COLUMN IF NOT EXISTS responded_at timestamptz,
ADD COLUMN IF NOT EXISTS responded_by uuid REFERENCES auth.users(id);

-- Update status column with proper constraints
ALTER TABLE advisories
DROP CONSTRAINT IF EXISTS advisories_status_check;

ALTER TABLE advisories
ALTER COLUMN status SET DEFAULT 'pending',
ADD CONSTRAINT advisories_status_check 
CHECK (status IN ('pending', 'reviewed'));

-- Create policy for admin access
CREATE POLICY "Admins can view all advisories"
ON advisories
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin() FROM is_admin())
);

CREATE POLICY "Admins can update advisories"
ON advisories
FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin() FROM is_admin())
)
WITH CHECK (
  (SELECT is_admin() FROM is_admin())
);