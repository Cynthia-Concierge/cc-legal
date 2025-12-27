-- ============================================
-- Migration: Add Quiz Answers to trademark_requests
-- ============================================
-- This migration adds columns to store the actual quiz answers and answer details

-- Step 1: Add quiz_answers column (JSONB to store the answers array)
ALTER TABLE trademark_requests 
ADD COLUMN IF NOT EXISTS quiz_answers JSONB;

-- Step 2: Add answer_details column (JSONB to store detailed answer information)
ALTER TABLE trademark_requests 
ADD COLUMN IF NOT EXISTS answer_details JSONB;

-- Step 3: Add comments
COMMENT ON COLUMN trademark_requests.quiz_answers IS 'Stores the quiz answers array (scores for each question)';
COMMENT ON COLUMN trademark_requests.answer_details IS 'Stores detailed answer information including question IDs and answer text';

-- Step 4: Create index for querying by answers (optional, but useful for analytics)
CREATE INDEX IF NOT EXISTS idx_trademark_requests_quiz_answers ON trademark_requests USING GIN (quiz_answers);
CREATE INDEX IF NOT EXISTS idx_trademark_requests_answer_details ON trademark_requests USING GIN (answer_details);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added quiz_answers and answer_details columns to trademark_requests';
END $$;
