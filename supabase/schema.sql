-- Kudi Tracker: personal + business expense and income tracking
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ============ TABLES ============

create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('personal', 'business')),
  currency    text not null default 'GHS',
  created_at  timestamptz not null default now(),
  unique (user_id, kind)
);

create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         uuid not null references public.books(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 60),
  type            text not null check (type in ('expense', 'income')),
  color           text not null default '#6B7F72',
  monthly_budget  numeric(12,2) check (monthly_budget is null or monthly_budget >= 0),
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (book_id, type, name)
);

create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  book_id         uuid not null references public.books(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  type            text not null check (type in ('expense', 'income')),
  amount          numeric(12,2) not null check (amount > 0),
  occurred_on     date not null default current_date,
  description     text check (description is null or char_length(description) <= 200),
  payment_method  text not null default 'cash'
                  check (payment_method in ('cash', 'momo', 'bank', 'card', 'other')),
  created_at      timestamptz not null default now()
);

create index if not exists transactions_book_date_idx on public.transactions (book_id, occurred_on desc);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists categories_book_idx on public.categories (book_id);

-- ============ ROW LEVEL SECURITY ============
-- Every row belongs to one user; nobody can read or change another user's data.

alter table public.books        enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own books" on public.books;
create policy "own books" on public.books
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
  );

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid())
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.book_id = transactions.book_id and c.type = transactions.type
      )
    )
  );

-- ============ FIRST-TIME SETUP ============
-- Called by the app after login. Creates the Personal and Business books with
-- starter categories. Safe to call many times: it does nothing if books exist.

create or replace function public.ensure_setup()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  personal_id uuid;
  business_id uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  if exists (select 1 from books where user_id = uid) then
    return;
  end if;

  insert into books (user_id, name, kind) values (uid, 'Personal', 'personal') returning id into personal_id;
  insert into books (user_id, name, kind) values (uid, 'Business', 'business') returning id into business_id;

  insert into categories (user_id, book_id, name, type, color) values
    (uid, personal_id, 'Food',                 'expense', '#C2703D'),
    (uid, personal_id, 'Transport',            'expense', '#3D6F8C'),
    (uid, personal_id, 'Airtime & Data',       'expense', '#7A5C99'),
    (uid, personal_id, 'Rent & Utilities',     'expense', '#8C6D3D'),
    (uid, personal_id, 'School & Books',       'expense', '#2F7A5B'),
    (uid, personal_id, 'Clothing',             'expense', '#A04F6B'),
    (uid, personal_id, 'Health',               'expense', '#B23A3A'),
    (uid, personal_id, 'Family Support',       'expense', '#4F7A2F'),
    (uid, personal_id, 'Church & Giving',      'expense', '#5A6B8C'),
    (uid, personal_id, 'Entertainment',        'expense', '#C29A2E'),
    (uid, personal_id, 'MoMo Charges',         'expense', '#F97316'),
    (uid, personal_id, 'Other',                'expense', '#6B7F72'),
    (uid, personal_id, 'Allowance / Salary',   'income',  '#2F7A5B'),
    (uid, personal_id, 'Gift',                 'income',  '#3D6F8C'),
    (uid, personal_id, 'Other Income',         'income',  '#6B7F72'),

    (uid, business_id, 'Hosting & Domains',          'expense', '#3D6F8C'),
    (uid, business_id, 'Software & Subscriptions',   'expense', '#7A5C99'),
    (uid, business_id, 'Internet & Data',            'expense', '#C2703D'),
    (uid, business_id, 'Equipment',                  'expense', '#8C6D3D'),
    (uid, business_id, 'Transport',                  'expense', '#2F7A5B'),
    (uid, business_id, 'Marketing',                  'expense', '#A04F6B'),
    (uid, business_id, 'Contractors',                'expense', '#4F7A2F'),
    (uid, business_id, 'Bank & MoMo Charges',        'expense', '#B23A3A'),
    (uid, business_id, 'Tax & Registration',         'expense', '#5A6B8C'),
    (uid, business_id, 'Other',                      'expense', '#6B7F72'),
    (uid, business_id, 'Client Projects',            'income',  '#2F7A5B'),
    (uid, business_id, 'Maintenance & Retainers',    'income',  '#3D6F8C'),
    (uid, business_id, 'Other Income',               'income',  '#6B7F72');
end;
$$;

revoke all on function public.ensure_setup() from public, anon;
grant execute on function public.ensure_setup() to authenticated;

-- ============ AUTOMATIC MOMO RECORDING (added Nov 2026) ============
-- Safe to run again. Adds what the app needs to record Mobile Money SMS automatically.

alter table public.transactions add column if not exists source text not null default 'manual';
alter table public.transactions add column if not exists reference text;
alter table public.transactions add column if not exists counterparty text;
alter table public.transactions add column if not exists needs_review boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_source_check') then
    alter table public.transactions add constraint transactions_source_check check (source in ('manual', 'sms'));
  end if;
end $$;

-- The same MoMo transaction ID can never be recorded twice.
create unique index if not exists transactions_user_reference_idx
  on public.transactions (user_id, reference) where reference is not null;

-- One secret link per user. The phone sends MoMo SMS to /api/sms?token=...
create table if not exists public.sms_settings (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  token             text not null unique
                    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  book_id           uuid references public.books(id) on delete set null,
  enabled           boolean not null default true,
  last_received_at  timestamptz,
  created_at        timestamptz not null default now()
);

-- Every SMS the app receives, so you can see what was recorded or skipped.
create table if not exists public.sms_inbox (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  sender          text,
  body            text not null,
  status          text not null check (status in ('recorded', 'skipped', 'duplicate', 'error')),
  detail          text,
  transaction_id  uuid references public.transactions(id) on delete set null,
  received_at     timestamptz not null default now()
);
create index if not exists sms_inbox_user_idx on public.sms_inbox (user_id, received_at desc);

alter table public.sms_settings enable row level security;
alter table public.sms_inbox    enable row level security;

drop policy if exists "own sms settings" on public.sms_settings;
create policy "own sms settings" on public.sms_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own sms inbox" on public.sms_inbox;
create policy "own sms inbox" on public.sms_inbox
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- MoMo fees get their own category in Personal books that don't have one yet.
insert into public.categories (user_id, book_id, name, type, color)
select b.user_id, b.id, 'MoMo Charges', 'expense', '#F97316'
from public.books b
where b.kind = 'personal'
on conflict (book_id, type, name) do nothing;

-- ============ SECURITY HARDENING (added Nov 2026) ============
-- Auto MoMo settings may only point at one of your own books.
drop policy if exists "own sms settings" on public.sms_settings;
create policy "own sms settings" on public.sms_settings
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (book_id is null or exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()))
    and char_length(token) >= 32
  );
