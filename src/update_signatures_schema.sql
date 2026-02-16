-- 1. Ensure columns exist
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS customer_signature_url text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone;

-- 2. Allow Public Update (for signing link)
-- DROP POLICY IF EXISTS "Allow Public Update Signature" ON proposals;
-- CREATE POLICY "Allow Public Update Signature" 
-- ON proposals FOR UPDATE 
-- USING (true) 
-- WITH CHECK (true);

-- BETTER SECURITY (Optional but recommended):
-- changing USING to true allows anyone to update any proposal if they have the ID.
-- Ideally we would have a way to verify, but for now we follow the request.
DROP POLICY IF EXISTS "Enable update for everyone" ON proposals;
CREATE POLICY "Enable update for everyone" ON proposals FOR UPDATE USING (true) WITH CHECK (true);
