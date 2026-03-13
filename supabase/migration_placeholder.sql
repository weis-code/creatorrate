-- Make user_id nullable to support placeholder profiles
ALTER TABLE public.creators ALTER COLUMN user_id DROP NOT NULL;

-- Add is_claimed column (existing profiles are considered claimed)
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS is_claimed boolean default true;

-- Allow service role to insert placeholder creators (user_id = null)
-- The placeholder API route uses service role key, so RLS is bypassed there.
-- No extra policy needed.
