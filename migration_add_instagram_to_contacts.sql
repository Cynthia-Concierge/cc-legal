-- Add instagram column to contacts for lead capture (replaces website for main form)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS instagram TEXT;

COMMENT ON COLUMN contacts.instagram IS 'Instagram handle from opt-in form (e.g. @handle). Replaces website for wellness lead capture.';
