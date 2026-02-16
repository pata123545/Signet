-- 1. Add Columns to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS access_code TEXT,
ADD COLUMN IF NOT EXISTS access_code_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Secure the table (Disable public SELECT)
DROP POLICY IF EXISTS "Enable select for everyone" ON public.proposals;
-- Only allow users to see their own proposals (Creator)
CREATE POLICY "Enable select for users based on user_id" ON public.proposals
FOR SELECT USING (auth.uid() = user_id);

-- 3. RPC: Request Code (Simulation Mode: Returns the code)
CREATE OR REPLACE FUNCTION request_proposal_code(proposal_id UUID, email_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_check BOOLEAN;
  new_code TEXT;
  returned_data JSONB;
BEGIN
  -- Check if proposal exists and email matches
  SELECT EXISTS (
    SELECT 1 FROM proposals 
    WHERE id = proposal_id AND client_email = email_input
  ) INTO exists_check;

  IF NOT exists_check THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email not found or proposal does not exist');
  END IF;

  -- Generate 6-digit code
  new_code := floor(random() * (999999 - 100000 + 1) + 100000)::text;

  -- Update proposal with code and expiration (15 mins)
  UPDATE proposals
  SET access_code = new_code,
      access_code_expires_at = now() + interval '15 minutes'
  WHERE id = proposal_id;

  -- Return the code (For Simulation/Debugging)
  RETURN jsonb_build_object('success', true, 'code', new_code);
END;
$$;

-- 4. RPC: Verify Code (Returns Proposal Data on success)
CREATE OR REPLACE FUNCTION verify_proposal_code(proposal_id UUID, email_input TEXT, code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_record RECORD;
BEGIN
  -- Fetch proposal if ID, Email, Code match and not expired
  SELECT * INTO p_record
  FROM proposals
  WHERE id = proposal_id 
    AND client_email = email_input
    AND access_code = code_input
    AND access_code_expires_at > now();

  IF FOUND THEN
    -- Clear the code after successful use (optional, but good for security)
    -- UPDATE proposals SET access_code = NULL WHERE id = proposal_id;
    
    -- Return the proposal data as JSON
    RETURN to_jsonb(p_record);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
