-- ==============================================================================
-- FACETUBE DATABASE SCHEMA & MIGRATION
-- Tables: profiles, user_roles
-- Roles: 'admin', 'user' (Default: 'user')
-- Includes Row Level Security (RLS) policies and automatic trigger for new users
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast query lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to check if the current or specified user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uid
      AND role = 'admin'
  );
$$;

-- 6. Profiles Table RLS Policies
-- Anyone can view profiles (for displaying creator info, comment authors, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile, or admins can update any profile
CREATE POLICY "Users can update their own profile or admins can update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- Users can delete their own profile or admins can delete
CREATE POLICY "Users can delete own profile or admins can delete"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 7. User Roles Table RLS Policies
-- Authenticated users can view their own role; admins can view all roles
CREATE POLICY "Users can view their own role or admins can view all"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Only admins can insert new roles directly (triggers handle initial creation)
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- Only admins can update roles (e.g. promoting user to admin)
CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete user roles
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 8. Automatic Profile & Role Creation on User Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_username TEXT;
  extracted_fullname TEXT;
  assigned_role TEXT;
BEGIN
  -- Extract username from metadata or derive from email
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Ensure username is unique if clash occurs
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = extracted_username) THEN
    extracted_username := extracted_username || '_' || substr(NEW.id::text, 1, 6);
  END IF;

  extracted_fullname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    extracted_username
  );

  -- Determine default role: 'user', unless specified
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  IF assigned_role NOT IN ('admin', 'user') THEN
    assigned_role := 'user';
  END IF;

  -- 1. Insert Profile
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email, created_at, updated_at)
  VALUES (
    NEW.id,
    extracted_username,
    extracted_fullname,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();

  -- 2. Insert User Role (Default 'user')
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    assigned_role,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 9. Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. Optional: Helper procedure to promote a user to admin by username or email
CREATE OR REPLACE FUNCTION public.set_user_role(target_email TEXT, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_uid UUID;
BEGIN
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or user.';
  END IF;

  SELECT id INTO target_uid FROM auth.users WHERE email = target_email LIMIT 1;
  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (target_uid, new_role, now())
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role, updated_at = now();
END;
$$;
