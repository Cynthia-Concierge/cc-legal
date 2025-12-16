-- Add document_type column to user_documents table
-- This stores the specific document type (template ID) for accurate matching
alter table user_documents 
add column if not exists document_type text;

-- Comment for clarity
comment on column user_documents.document_type is 'Stores the specific document type/template ID (e.g., template-1, template-intake) for accurate checklist matching';

