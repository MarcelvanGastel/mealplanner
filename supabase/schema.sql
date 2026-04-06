-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles (public info for the feed + onboarding data)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  onboarding_completed boolean default false,
  household_size integer default 1,
  household_members jsonb default '[]',  -- [{name, age}]
  allergies text[] default '{}',
  diet_preference text default 'geen',   -- geen, vegetarisch, veganistisch, pescotarisch, flexitarisch
  liked_recipes text[] default '{}',     -- recipe titles from onboarding
  budget_amount decimal(10,2),
  budget_period text default 'week',     -- week, maand
  created_at timestamptz default now()
);

-- Meals table: stores planned meals per day
create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  meal_type text not null check (meal_type in ('ontbijt', 'lunch', 'diner', 'snack')),
  title text not null,
  description text,
  ingredients text[] default '{}',
  instructions text[] default '{}',
  estimated_cost decimal(10,2),
  image_url text,
  created_at timestamptz default now()
);

-- Recipes (can be shared publicly in the feed)
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  ingredients text[] default '{}',
  instructions text[] default '{}',
  estimated_cost decimal(10,2),
  prep_time text,
  servings integer default 2,
  image_url text,
  is_public boolean default false,
  likes_count integer default 0,
  created_at timestamptz default now()
);

-- Recipe likes
create table public.recipe_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);

-- Shopping list items
create table public.shopping_list (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item text not null,
  checked boolean default false,
  week_start date,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_likes enable row level security;
alter table public.shopping_list enable row level security;

-- Supermarkets: public read-only
alter table public.supermarkets enable row level security;
alter table public.supermarket_products enable row level security;
create policy "Anyone can read supermarkets" on public.supermarkets for select using (true);
create policy "Anyone can read supermarket products" on public.supermarket_products for select using (true);

-- Profiles: viewable by all, editable by owner
create policy "Public profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Meals: private to owner
create policy "Users can view own meals" on public.meals for select using (auth.uid() = user_id);
create policy "Users can insert own meals" on public.meals for insert with check (auth.uid() = user_id);
create policy "Users can update own meals" on public.meals for update using (auth.uid() = user_id);
create policy "Users can delete own meals" on public.meals for delete using (auth.uid() = user_id);

-- Recipes: public ones visible to all, private ones only to owner
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Anyone can view public recipes" on public.recipes for select using (is_public = true);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Likes: users can like public recipes
create policy "Users can view likes" on public.recipe_likes for select using (true);
create policy "Users can insert own likes" on public.recipe_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on public.recipe_likes for delete using (auth.uid() = user_id);

-- Shopping list: private
create policy "Users can view own shopping list" on public.shopping_list for select using (auth.uid() = user_id);
create policy "Users can insert own shopping list" on public.shopping_list for insert with check (auth.uid() = user_id);
create policy "Users can update own shopping list" on public.shopping_list for update using (auth.uid() = user_id);
create policy "Users can delete own shopping list" on public.shopping_list for delete using (auth.uid() = user_id);

-- Supermarket reference table
create table public.supermarkets (
  code text primary key,
  name text not null,
  icon_url text,
  base_url text,
  total_products integer default 0,
  last_synced timestamptz
);

-- Products with daily prices
create table public.supermarket_products (
  id bigint generated always as identity primary key,
  supermarket_code text not null references public.supermarkets(code) on delete cascade,
  product_name text not null,
  price decimal(10,2),
  amount text,
  product_link text,
  synced_date date not null default current_date,
  unique(supermarket_code, product_name, synced_date)
);

-- Indexes
create index meals_user_date_idx on public.meals (user_id, date);
create index recipes_public_idx on public.recipes (is_public, created_at desc);
create index recipe_likes_recipe_idx on public.recipe_likes (recipe_id);
create index shopping_list_user_idx on public.shopping_list (user_id, week_start);
create index idx_sp_supermarket on public.supermarket_products(supermarket_code);
create index idx_sp_name_search on public.supermarket_products using gin(to_tsvector('dutch', product_name));
create index idx_sp_synced_date on public.supermarket_products(synced_date);
create index idx_sp_price on public.supermarket_products(price);

-- Function: auto-create profile on signup (copies household data from inviter)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  inviter_profile public.profiles%rowtype;
begin
  -- Check if this user was invited by someone
  if new.raw_user_meta_data->>'invited_by' is not null then
    select * into inviter_profile
    from public.profiles
    where id = (new.raw_user_meta_data->>'invited_by')::uuid;

    if found then
      insert into public.profiles (
        id, display_name, onboarding_completed,
        household_size, household_members, allergies,
        diet_preference, liked_recipes, budget_amount, budget_period
      ) values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        true,
        inviter_profile.household_size,
        inviter_profile.household_members,
        inviter_profile.allergies,
        inviter_profile.diet_preference,
        inviter_profile.liked_recipes,
        inviter_profile.budget_amount,
        inviter_profile.budget_period
      );
      return new;
    end if;
  end if;

  -- Default: create basic profile
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
