alter table public.transactions
  add column if not exists month_year text;

update public.transactions
set month_year = to_char(date, 'YYYY-MM')
where month_year is null;

alter table public.transactions
  alter column month_year set not null;

alter table public.transactions
  drop constraint if exists transactions_month_year_check;

alter table public.transactions
  add constraint transactions_month_year_check
  check (month_year ~ '^\d{4}-\d{2}$');

create index if not exists transactions_user_month_idx
  on public.transactions(user_id, month_year);

create index if not exists transactions_user_type_month_idx
  on public.transactions(user_id, type, month_year);
