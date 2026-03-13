-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  username text unique not null,
  role text not null default 'viewer' check (role in ('viewer', 'creator')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Creators table
create table public.creators (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique, -- nullable for placeholder profiles
  display_name text not null,
  slug text unique not null,
  bio text,
  category text,
  avatar_url text,
  website_url text,
  youtube_url text,
  instagram_url text,
  tiktok_url text,
  is_claimed boolean default false not null,
  average_rating decimal(3,2) default 0,
  review_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.creators(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  is_disputed boolean default false,
  dispute_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(creator_id, viewer_id)
);

-- Review replies table
create table public.review_replies (
  id uuid default uuid_generate_v4() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null unique,
  creator_id uuid references public.creators(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.creators(id) on delete cascade not null,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  tier text not null check (tier in ('basic', 'pro')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Creators policies
create policy "Creators are viewable by everyone" on public.creators for select using (true);
create policy "Users can create their own creator profile" on public.creators for insert with check (auth.uid() = user_id);
create policy "Creators can update their own profile" on public.creators for update using (auth.uid() = user_id);

-- Reviews policies
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Authenticated viewers can create reviews" on public.reviews for insert with check (auth.uid() = viewer_id);
create policy "Viewers can update their own reviews" on public.reviews for update using (auth.uid() = viewer_id);
create policy "Viewers can delete their own reviews" on public.reviews for delete using (auth.uid() = viewer_id);

-- Review replies policies
create policy "Review replies are viewable by everyone" on public.review_replies for select using (true);
create policy "Creators can reply to their reviews" on public.review_replies for insert
  with check (
    auth.uid() = (select user_id from public.creators where id = creator_id)
  );
create policy "Creators can update their replies" on public.review_replies for update
  using (
    auth.uid() = (select user_id from public.creators where id = creator_id)
  );

-- Subscriptions policies
create policy "Creators can view their own subscriptions" on public.subscriptions for select
  using (creator_id in (select id from public.creators where user_id = auth.uid()));

-- Function to update creator rating
create or replace function update_creator_rating()
returns trigger as $$
begin
  update public.creators
  set
    average_rating = (
      select coalesce(avg(rating), 0)
      from public.reviews
      where creator_id = coalesce(new.creator_id, old.creator_id)
      and is_disputed = false
    ),
    review_count = (
      select count(*)
      from public.reviews
      where creator_id = coalesce(new.creator_id, old.creator_id)
      and is_disputed = false
    )
  where id = coalesce(new.creator_id, old.creator_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Triggers for rating update
create trigger update_rating_on_review_insert
  after insert on public.reviews
  for each row execute function update_creator_rating();

create trigger update_rating_on_review_update
  after update on public.reviews
  for each row execute function update_creator_rating();

create trigger update_rating_on_review_delete
  after delete on public.reviews
  for each row execute function update_creator_rating();

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
