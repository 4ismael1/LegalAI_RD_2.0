/*
  # Create Advisory System Tables

  1. New Tables
    - `advisories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `subject` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `advisories` table
    - Add policies for authenticated users to manage their advisories
*/

-- Create advisories table
CREATE TABLE IF NOT EXISTS advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_advisories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advisories_updated_at
  BEFORE UPDATE ON advisories
  FOR EACH ROW
  EXECUTE FUNCTION update_advisories_updated_at();

-- Create policies
CREATE POLICY "Users can view own advisories"
  ON advisories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own advisories"
  ON advisories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);