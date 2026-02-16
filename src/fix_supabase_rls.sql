-- FIX FOR ERROR 401: "new row violates row-level security policy"

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.proposals;
DROP POLICY IF EXISTS "Enable select for everyone" ON public.proposals;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.proposals;

-- 3. Create a PERMISSIVE policy for development (allows anyone with the Anon Key to Insert/View)
CREATE POLICY "Enable all access for anon"
ON public.proposals
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Double check columns exist (just in case)
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS proposal_number text,
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS proposal_data jsonb;
