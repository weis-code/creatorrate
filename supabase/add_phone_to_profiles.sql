-- Run this in Supabase SQL Editor
alter table public.profiles add column if not exists phone text;

alter table pending_signups add column if not exists phone text;
