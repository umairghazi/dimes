create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'expense' check (type in ('expense', 'income')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.category_groups enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'category_groups'
      and policyname = 'category groups are user-owned'
  ) then
    create policy "category groups are user-owned" on public.category_groups
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.categories
  add column if not exists group_id uuid references public.category_groups(id) on delete set null;

create index if not exists category_groups_user_id_idx on public.category_groups(user_id);
create index if not exists category_groups_user_type_idx on public.category_groups(user_id, type);
create unique index if not exists category_groups_user_name_type_active_idx
  on public.category_groups(user_id, name, type)
  where deleted_at is null;
create index if not exists categories_user_group_idx on public.categories(user_id, group_id);
drop index if exists categories_user_name_type_active_idx;
create unique index if not exists categories_user_group_name_type_active_idx
  on public.categories(user_id, group_id, name, type)
  where deleted_at is null;

insert into public.category_groups (user_id, name, type, sort_order)
select
  c.user_id,
  coalesce(nullif(trim(c.main_category), ''), 'Other') as name,
  c.type,
  min(c.sort_order) as sort_order
from public.categories c
where c.deleted_at is null
group by c.user_id, coalesce(nullif(trim(c.main_category), ''), 'Other'), c.type
on conflict do nothing;

update public.categories c
set group_id = g.id,
    updated_at = now()
from public.category_groups g
where c.group_id is null
  and c.user_id = g.user_id
  and c.type = g.type
  and coalesce(nullif(trim(c.main_category), ''), 'Other') = g.name;

update public.categories
set name = trim(substr(name, length(main_category) + 4)),
    updated_at = now()
where main_category is not null
  and name ilike main_category || ' - %';
