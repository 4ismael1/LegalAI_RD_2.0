/*
  # Add delete chat history RPC function

  1. New Functions
    - `delete_user_chat_history`: RPC function to delete all chat history for a user
      - Input: user_id_param (uuid)
      - Returns: void
      - Deletes all chat sessions and associated messages for the specified user

  2. Security
    - Function is only accessible to authenticated users
    - Users can only delete their own chat history
*/

-- Create the RPC function to delete chat history
CREATE OR REPLACE FUNCTION delete_user_chat_history(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all chat sessions for the user (messages will be deleted via CASCADE)
  DELETE FROM chat_sessions
  WHERE user_id = user_id_param
  AND auth.uid() = user_id_param;
END;
$$;