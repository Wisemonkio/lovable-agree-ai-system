-- Add name column to profiles table
ALTER TABLE public.profiles ADD COLUMN name TEXT;

-- Migrate existing data: combine first_name and last_name into name
UPDATE public.profiles 
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE name IS NULL;

-- Handle cases where both first_name and last_name are null
UPDATE public.profiles 
SET name = 'User'
WHERE name IS NULL OR name = '';

-- Update the handle_new_user function to use single name field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name',           -- Google OAuth full name
      new.raw_user_meta_data->>'full_name',      -- Alternative Google field
      TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')), -- Email signup
      'User'  -- Fallback
    ),
    new.email
  );
  RETURN new;
END;
$$;

-- Make name column NOT NULL after migration
ALTER TABLE public.profiles ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE public.profiles DROP COLUMN first_name;
ALTER TABLE public.profiles DROP COLUMN last_name;