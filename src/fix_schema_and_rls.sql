-- Fix Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#D4AF37';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Heebo';

-- Fix Proposals Table
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS total_amount numeric;
-- Note: 'proposal_data' and 'client_name' already exist based on previous check, but adding IF NOT EXISTS is safe
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposal_data jsonb;

-- NOTIFICATION: The Requirement asked for 'id' to be UUID. 
-- If your 'proposals' table currently has 'id' as bigint, you cannot simply ALTER it to UUID.
-- If you need to strictly follow the UUID requirement, you must drop and recreate the table.
-- Uncomment the following lines ONLY if you are okay with losing existing proposal data:
/*
DROP TABLE IF EXISTS public.proposals;
CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid references auth.users(id),
    client_name text,
    business_name text,
    proposal_number text,
    proposal_data jsonb,
    total_amount numeric
);
*/

-- Enable Realtime
-- This requires the table to be in the publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'proposals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Remove insecure/default policies to ensure clean slate (optional, but good for "audit")
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.proposals;
DROP POLICY IF EXISTS "Enable select for everyone" ON public.proposals;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create Secure Policies

-- Profiles: Authenticated users can do everything to their own profile. Public can view.
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Proposals: Users can only see/edit their OWN proposals
CREATE POLICY "Users can view own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions if needed (usually handled by Supabase defaults, but good to ensure)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.proposals TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
