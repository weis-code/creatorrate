-- Run this in Supabase SQL Editor
create table if not exists pending_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  username text not null,
  password text not null,
  tier text not null check (tier in ('BASIC', 'PRO')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '1 hour'
);

-- Only service role can access
alter table pending_signups enable row level security;
create policy "Service role only" on pending_signups using (false);
