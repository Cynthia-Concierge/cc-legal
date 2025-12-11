-- 1. Create the user_documents table
create table if not exists user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  file_path text not null, -- Path in Supabase Storage
  file_type text, -- 'pdf', 'docx', etc.
  category text default 'other',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table user_documents enable row level security;

-- 3. Create Security Policies
-- Allow users to view their own documents
create policy "Users can view their own documents"
  on user_documents for select
  using ( auth.uid() = user_id );

-- Allow users to upload their own documents
create policy "Users can insert their own documents"
  on user_documents for insert
  with check ( auth.uid() = user_id );

-- Allow users to update their own documents
create policy "Users can update their own documents"
  on user_documents for update
  using ( auth.uid() = user_id );

-- Allow users to delete their own documents
create policy "Users can delete their own documents"
  on user_documents for delete
  using ( auth.uid() = user_id );

-- INSTRUCTIONS FOR USER:
-- 1. Run this SQL in your Supabase SQL Editor.
-- 2. Go to 'Storage' in Supabase Dashboard.
-- 3. Create a new bucket named 'wellness-documents'.
-- 4. Set bucket to 'Private' (requires authentication).
