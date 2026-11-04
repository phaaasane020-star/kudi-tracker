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

  -- Only accounts the owner has approved get books (is_approved is defined further down).
  if not public.is_approved() then
    raise exception 'Waiting for the owner to approve this account';
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

-- ============ SECURITY LOG (added Nov 2026) ============
-- Visits, sign-in attempts and other security events. Only the app writes here
-- (with the service key); only the account owner can read it.

create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in (
                'visit', 'signin_success', 'signin_failed', 'signin_blocked', 'signup',
                'password_reset_requested', 'password_changed', 'signout_all', 'sms_bad_token')),
  email       text,
  user_id     uuid,
  visitor_id  text,
  path        text,
  ip          text,
  country     text,
  city        text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_kind_time_idx on public.security_events (kind, created_at desc);
create index if not exists security_events_ip_time_idx on public.security_events (ip, created_at desc);
create index if not exists security_events_email_time_idx on public.security_events (email, created_at desc);

-- The owner is the first account ever created on this project (you).
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null
     and auth.uid() = (select id from auth.users order by created_at asc limit 1);
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

alter table public.security_events enable row level security;

drop policy if exists "owner reads security log" on public.security_events;
create policy "owner reads security log" on public.security_events
  for select using (public.is_owner());

drop policy if exists "owner trims security log" on public.security_events;
create policy "owner trims security log" on public.security_events
  for delete using (public.is_owner());


-- ============ OWNER APPROVAL (added Nov 2026) ============
-- Anyone can ask for an account, but nobody can use Kudi until the owner
-- (the first account on this project) approves them on the People page.

create table if not exists public.members (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at  timestamptz not null default now(),
  decided_at    timestamptz
);
create index if not exists members_status_idx on public.members (status, requested_at desc);

-- Every new sign-up lands here as "pending". The very first account is approved.
create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.members (user_id, email, status, decided_at)
  values (
    new.id,
    new.email,
    case when new.id = (select id from auth.users order by created_at asc limit 1) then 'approved' else 'pending' end,
    case when new.id = (select id from auth.users order by created_at asc limit 1) then now() else null end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_member on auth.users;
create trigger on_auth_user_created_member
  after insert on auth.users
  for each row execute function public.handle_new_member();

-- Accounts that already exist: the owner is approved, anyone else waits.
insert into public.members (user_id, email, status, decided_at)
select u.id, u.email,
       case when u.id = (select id from auth.users order by created_at asc limit 1) then 'approved' else 'pending' end,
       now()
from auth.users u
on conflict (user_id) do nothing;
update public.members set status = 'approved', decided_at = coalesce(decided_at, now())
where user_id = (select id from auth.users order by created_at asc limit 1);

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.members where user_id = auth.uid() and status = 'approved');
$$;
revoke all on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated;

-- One quick call the app makes on each page: your status, whether you're the owner,
-- and (owner only) how many people are waiting.
create or replace function public.my_access()
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  select json_build_object(
    'status',   coalesce((select status from public.members where user_id = auth.uid()), 'pending'),
    'is_owner', public.is_owner(),
    'pending',  case when public.is_owner() then (select count(*) from public.members where status = 'pending') else 0 end
  );
$$;
revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

alter table public.members enable row level security;

drop policy if exists "see own membership" on public.members;
create policy "see own membership" on public.members
  for select using (user_id = auth.uid() or public.is_owner());

drop policy if exists "owner decides" on public.members;
create policy "owner decides" on public.members
  for update using (public.is_owner() and user_id <> auth.uid())
  with check (public.is_owner() and user_id <> auth.uid());

-- On top of "only your own data": only approved accounts can touch anything.
drop policy if exists "approved only" on public.books;
create policy "approved only" on public.books as restrictive
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "approved only" on public.categories;
create policy "approved only" on public.categories as restrictive
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "approved only" on public.transactions;
create policy "approved only" on public.transactions as restrictive
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "approved only" on public.sms_settings;
create policy "approved only" on public.sms_settings as restrictive
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "approved only" on public.sms_inbox;
create policy "approved only" on public.sms_inbox as restrictive
  for all using (public.is_approved()) with check (public.is_approved());


-- Event types for approvals, Google sign-in and the logging self-check.
alter table public.security_events drop constraint if exists security_events_kind_check;
alter table public.security_events add constraint security_events_kind_check check (kind in (
  'visit', 'signin_success', 'signin_failed', 'signin_blocked', 'signup',
  'password_reset_requested', 'password_changed', 'signout_all', 'sms_bad_token',
  'member_approved', 'member_declined', 'member_removed', 'google_signin', 'logging_test'));
