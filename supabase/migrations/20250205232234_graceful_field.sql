/*
  # Add cascade delete to chat_messages

  1. Changes
    - Add ON DELETE CASCADE to chat_messages.session_id foreign key
    This ensures that when a chat session is deleted, all its associated messages are also deleted.

  2. Security
    - No changes to RLS policies
*/

-- First drop the existing foreign key constraint
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;

-- Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES chat_sessions(id)
ON DELETE CASCADE;