/*
  # Add laws table

  1. New Tables
    - `laws`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `icon` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `laws` table
    - Add policies for admin access
*/

-- Create laws table
CREATE TABLE IF NOT EXISTS laws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'scale',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_laws_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_laws_updated_at
  BEFORE UPDATE ON laws
  FOR EACH ROW
  EXECUTE FUNCTION update_laws_updated_at();

-- Create policies
CREATE POLICY "Everyone can view laws"
  ON laws
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert laws"
  ON laws
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update laws"
  ON laws
  FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can delete laws"
  ON laws
  FOR DELETE
  TO authenticated
  USING (is_admin());