create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  currency text not null default 'CAD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  main_category text,
  type text not null default 'expense' check (type in ('expense', 'income')),
  is_fixed boolean not null default false,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'CAD',
  category_id uuid references public.categories(id) on delete set null,
  main_category text,
  type text not null default 'expense' check (type in ('expense', 'income')),
  merchant_name text,
  source text not null default 'manual',
  is_recurring boolean not null default false,
  tags text[] not null default '{}',
  original_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_year text not null check (month_year ~ '^\d{4}-\d{2}$'),
  category_id uuid references public.categories(id) on delete cascade,
  category_name text not null,
  type text not null default 'expense' check (type in ('expense', 'income')),
  planned_amount numeric(12, 2) not null default 0,
  currency text not null default 'CAD',
  carry_forward boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_year, category_name, type)
);

create table if not exists public.monthly_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_year text not null check (month_year ~ '^\d{4}-\d{2}$'),
  starting_balance numeric(12, 2) not null default 0,
  ending_balance numeric(12, 2),
  currency text not null default 'CAD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_year)
);

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists categories_user_type_idx on public.categories(user_id, type);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_type_date_idx on public.transactions(user_id, type, date desc);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id);
create index if not exists monthly_plans_user_month_idx on public.monthly_plans(user_id, month_year);
create index if not exists monthly_balances_user_month_idx on public.monthly_balances(user_id, month_year);

alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.monthly_balances enable row level security;

create policy "profiles are user-owned" on public.user_profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "categories are user-owned" on public.categories
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions are user-owned" on public.transactions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "monthly plans are user-owned" on public.monthly_plans
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "monthly balances are user-owned" on public.monthly_balances
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
