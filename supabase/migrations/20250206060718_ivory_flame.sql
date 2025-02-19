-- Create initial admin user
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Insert admin user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@legalai.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_id;

  -- Insert admin profile
  INSERT INTO profiles (
    id,
    full_name,
    email,
    role,
    email_notifications,
    created_at,
    updated_at
  )
  VALUES (
    admin_id,
    'Administrador',
    'admin@legalai.com',
    'admin',
    false,
    NOW(),
    NOW()
  );

  -- Initialize message count for admin
  INSERT INTO message_counts (
    user_id,
    date,
    count
  )
  VALUES (
    admin_id,
    CURRENT_DATE,
    0
  );
END $$;