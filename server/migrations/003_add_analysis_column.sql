-- Add analysis column to user_documents table
alter table user_documents 
add column if not exists analysis text;

-- Comment for clarity
comment on column user_documents.analysis is 'Stores the AI-generated analysis of the contract';
