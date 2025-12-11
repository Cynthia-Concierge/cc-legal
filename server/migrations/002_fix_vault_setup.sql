-- FIX VAULT SETUP
-- This script will ensure the Storage Bucket and Database Tables are correctly set up.
-- Run this in your Supabase SQL Editor.

-- 1. Create the 'wellness-documents' storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('wellness-documents', 'wellness-documents', false)
on conflict (id) do nothing;

-- 2. (Skipped) RLS on storage.objects is usually enabled by default.
-- attempt to enable it often causes permissions errors if not owner.

-- 3. Create Storage Policies for 'wellness-documents'

-- Policy: Allow users to upload files to their own folder (auth.uid matches folder name)
create policy "Users can upload their own documents"
on storage.objects for insert
with check (
  bucket_id = 'wellness-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view/download their own documents
create policy "Users can view their own documents"
on storage.objects for select
using (
  bucket_id = 'wellness-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own documents
create policy "Users can delete their own documents"
on storage.objects for delete
using (
  bucket_id = 'wellness-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Create the user_documents table (if it was missed previously)
create table if not exists user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  file_path text not null,
  file_type text,
  category text default 'other',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable RLS on user_documents
alter table user_documents enable row level security;

-- 6. Re-apply user_documents policies (drop first to avoid errors if they exist)
drop policy if exists "Users can view their own documents" on user_documents;
drop policy if exists "Users can insert their own documents" on user_documents;
drop policy if exists "Users can update their own documents" on user_documents;
drop policy if exists "Users can delete their own documents" on user_documents;

create policy "Users can view their own documents"
  on user_documents for select using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
  on user_documents for insert with check ( auth.uid() = user_id );

create policy "Users can update their own documents"
  on user_documents for update using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
  on user_documents for delete using ( auth.uid() = user_id );
