/*
  # Fix Chat RLS Policies

  1. Changes
    - Add missing RLS policies for chat_messages
    - Ensure proper cascading delete
    - Fix session handling policies

  2. Security
    - Strengthen RLS policies
    - Ensure proper user access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from own chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own chat sessions" ON chat_messages;

-- Create more specific policies for chat_messages
CREATE POLICY "Users can view messages from own chat sessions"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own chat sessions"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Ensure chat_sessions has proper delete policy
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());