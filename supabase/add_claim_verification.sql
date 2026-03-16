-- Add verification columns to creators table for the claim verification flow
alter table public.creators
  add column if not exists verification_code text,
  add column if not exists claim_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists claim_status text check (claim_status in ('pending', 'rejected'));

-- Index for finding pending claims quickly
create index if not exists idx_creators_claim_status on public.creators(claim_status) where claim_status is not null;
