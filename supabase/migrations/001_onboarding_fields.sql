-- Add onboarding fields to profiles
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists household_size integer default 1;
alter table public.profiles add column if not exists household_members jsonb default '[]';
alter table public.profiles add column if not exists allergies text[] default '{}';
alter table public.profiles add column if not exists diet_preference text default 'geen';
alter table public.profiles add column if not exists liked_recipes text[] default '{}';
alter table public.profiles add column if not exists budget_amount decimal(10,2);
alter table public.profiles add column if not exists budget_period text default 'week';
