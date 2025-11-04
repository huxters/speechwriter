-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('admin','editor','user')) default 'user',
  full_name text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create RLS policies
create policy "select own" on profiles for select using (auth.uid() = id);
create policy "insert own" on profiles for insert with check (auth.uid() = id);
create policy "update own" on profiles for update using (auth.uid() = id);


