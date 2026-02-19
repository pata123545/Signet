-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table profiles (
  user_id uuid references auth.users not null primary key,
  business_name text,
  business_address text,
  business_phone text,
  business_email text,
  logo_url text,
  signature_url text,
  brand_color text default '#334155',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

-- 2. CHATS TABLE
create table chats (
  chat_id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Chats
alter table chats enable row level security;
create policy "Users can view own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can update own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete own chats" on chats for delete using (auth.uid() = user_id);

-- 3. MESSAGES TABLE
create table messages (
  message_id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(chat_id) on delete cascade not null,
  user_id uuid references auth.users not null,
  content text,
  role text check (role in ('user', 'model')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Messages
alter table messages enable row level security;
create policy "Users can view own messages" on messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on messages for insert with check (auth.uid() = user_id);

-- 4. DOCUMENTS TABLE (Archive)
create table documents (
  doc_id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  type text check (type in ('הצעות מחיר', 'חשבוניות', 'חוזים', 'סיכומי פגישות')),
  client_name text,
  json_data jsonb,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Documents
alter table documents enable row level security;
create policy "Users can view own documents" on documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on documents for insert with check (auth.uid() = user_id);

-- 5. STORAGE BUCKETS
-- Note: Buckets must be created via the Supabase Dashboard, but policies can be SQL.
-- Assume buckets 'branding' and 'documents' are created manually.

-- Storage Policies (Branding)
create policy "Give users access to own folder 1ok12a_0" on storage.objects for select to authenticated using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Give users access to own folder 1ok12a_1" on storage.objects for insert to authenticated with check (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies (Documents)
create policy "Give users access to own folder 1ok12a_2" on storage.objects for select to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Give users access to own folder 1ok12a_3" on storage.objects for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
