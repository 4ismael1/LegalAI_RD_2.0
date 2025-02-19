/*
  # Add admin policies for chat sessions and messages

  1. Changes
    - Add policy for admins to view all chat sessions
    - Add policy for admins to view all chat messages
    - Update existing policies to include admin access

  2. Security
    - Maintains RLS
    - Adds proper admin access checks
*/

-- Drop existing policies to update them
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view messages from own chat sessions" ON chat_messages;

-- Create updated policies for chat_sessions
CREATE POLICY "Users and admins can view chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (SELECT is_admin() FROM is_admin())
  );

-- Create updated policies for chat_messages
CREATE POLICY "Users and admins can view chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND (
        chat_sessions.user_id = auth.uid()
        OR (SELECT is_admin() FROM is_admin())
      )
    )
  );