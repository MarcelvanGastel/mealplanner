-- Supermarket reference table
create table if not exists public.supermarkets (
  code text primary key,
  name text not null,
  icon_url text,
  base_url text,
  total_products integer default 0,
  last_synced timestamptz
);

-- Products with daily prices (latest snapshot only, replaced each sync)
create table if not exists public.supermarket_products (
  id bigint generated always as identity primary key,
  supermarket_code text not null references public.supermarkets(code) on delete cascade,
  product_name text not null,
  price decimal(10,2),
  amount text,            -- e.g. "1 liter", "500 gram"
  product_link text,      -- relative link on supermarket site
  synced_date date not null default current_date,

  unique(supermarket_code, product_name, synced_date)
);

-- Indexes for fast lookups
create index idx_sp_supermarket on public.supermarket_products(supermarket_code);
create index idx_sp_name_search on public.supermarket_products using gin(to_tsvector('dutch', product_name));
create index idx_sp_synced_date on public.supermarket_products(synced_date);
create index idx_sp_price on public.supermarket_products(price);

-- RLS: supermarket data is public (read-only for all authenticated users)
alter table public.supermarkets enable row level security;
alter table public.supermarket_products enable row level security;

create policy "Anyone can read supermarkets" on public.supermarkets for select using (true);
create policy "Anyone can read supermarket products" on public.supermarket_products for select using (true);

-- Only service role can insert/update/delete (via cron job)
-- No insert/update/delete policies for authenticated users = they can't modify
