-- ============================================================================
-- TWOGETHER · MIGRATION 001 · Core schema + Row Level Security
-- Matches the frontend service contract (Prompt A2 / voiceAgent tools).
-- Safe to run once on a fresh Supabase project.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
create type public.visibility as enum ('private','visible','shared');
create type public.txn_direction as enum ('expense','income','transfer');
create type public.reminder_status as enum ('proposed','accepted','done');
create type public.trip_status as enum ('dream','planning','booked','done');

-- ---------------------------------------------------------------------------
-- 1. PROFILES (auto-created on signup)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  nickname      text,
  avatar_url    text,
  dob           date,
  currency      text not null default 'INR',
  country       text not null default 'IN',
  tz            text not null default 'Asia/Kolkata',
  love_languages jsonb not null default '[]',
  notif_prefs   jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. COUPLES, MEMBERSHIP, INVITES
-- ---------------------------------------------------------------------------
create table public.couples (
  id           uuid primary key default gen_random_uuid(),
  status       text not null default 'dating',          -- dating|engaged|married|ldr|parents
  started_on   date,
  money_model  text not null default 'hybrid',          -- joint|separate|hybrid
  split_rule   text not null default 'equal',           -- equal|proportional|itemized|single_pool
  income_ratio numeric not null default 50,             -- share of member A, e.g. 55
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create table public.couple_members (
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.invites (
  code       text primary key,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at    timestamptz
);

-- max 2 members per couple, and 1 couple per user (v1 rule)
create or replace function public.enforce_membership_limits()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'This space already has two members';
  end if;
  if exists (select 1 from public.couple_members where user_id = new.user_id) then
    raise exception 'User already belongs to a couple space';
  end if;
  return new;
end $$;

create trigger trg_membership_limits
  before insert on public.couple_members
  for each row execute function public.enforce_membership_limits();

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (used by every RLS policy)
-- ---------------------------------------------------------------------------
create or replace function public.is_member(c uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.couple_members
                  where couple_id = c and user_id = auth.uid()) $$;

create or replace function public.my_couple()
returns uuid language sql stable security definer set search_path = public as
$$ select couple_id from public.couple_members where user_id = auth.uid() limit 1 $$;

create or replace function public.my_partner()
returns uuid language sql stable security definer set search_path = public as
$$ select user_id from public.couple_members
   where couple_id = public.my_couple() and user_id <> auth.uid() limit 1 $$;

-- ---------------------------------------------------------------------------
-- 4. RPCs: create / join a couple space (the ONLY way to write membership)
-- ---------------------------------------------------------------------------
create or replace function public.create_couple(p_status text default 'dating')
returns text language plpgsql security definer set search_path = public as $$
declare v_couple uuid; v_code text;
begin
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'You already have a space';
  end if;
  insert into public.couples (status) values (coalesce(p_status,'dating')) returning id into v_couple;
  insert into public.couple_members (couple_id, user_id) values (v_couple, auth.uid());
  v_code := 'LUV-' || upper(substr(md5(random()::text), 1, 4));
  insert into public.invites (code, couple_id, created_by) values (v_code, v_couple, auth.uid());
  perform public.setup_couple_defaults(v_couple, auth.uid());
  return v_code;
end $$;

create or replace function public.join_couple(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_couple uuid;
begin
  select couple_id into v_couple from public.invites
   where code = upper(p_code) and used_at is null and expires_at > now();
  if v_couple is null then raise exception 'Invalid or expired code'; end if;
  insert into public.couple_members (couple_id, user_id) values (v_couple, auth.uid());
  update public.invites set used_at = now() where code = upper(p_code);
  perform public.setup_member_defaults(v_couple, auth.uid());
  return v_couple;
end $$;

-- ---------------------------------------------------------------------------
-- 5. MONEY
-- ---------------------------------------------------------------------------
create table public.accounts (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name       text not null,
  kind       text not null default 'bank',              -- bank|card|cash|wallet|investment
  currency   text not null default 'INR',
  opening_balance numeric not null default 0,
  share_mode text not null default 'full',              -- full|balance_only|totals_only|private
  created_at timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name       text not null,
  emoji      text not null default '🏷️',
  parent_id  uuid references public.categories(id),
  budget_amount numeric,
  rollover   boolean not null default false,
  sort       int not null default 100
);

create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id),
  visibility     public.visibility not null default 'shared',
  account_id     uuid references public.accounts(id),
  category_id    uuid references public.categories(id),
  amount         numeric not null check (amount >= 0),
  currency       text not null default 'INR',
  direction      public.txn_direction not null default 'expense',
  merchant       text,
  note           text,
  txn_date       date not null default current_date,
  receipt_url    text,
  tags           text[] not null default '{}',
  trip_id        uuid,
  is_gift_hidden boolean not null default false,
  reveal_date    date,
  source         text not null default 'manual',        -- manual|voice|sms|import|sync
  created_at     timestamptz not null default now()
);

create table public.transaction_comments (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id),
  visibility     public.visibility not null default 'shared',
  body           text not null,
  created_at     timestamptz not null default now()
);

create table public.splits (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid not null references public.couples(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id        uuid not null references public.profiles(id),
  share_amount   numeric not null check (share_amount >= 0)
);

create table public.settlements (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),   -- who recorded it
  visibility public.visibility not null default 'shared',
  from_user  uuid not null references public.profiles(id),
  to_user    uuid not null references public.profiles(id),
  amount     numeric not null check (amount > 0),
  method     text,
  settled_at timestamptz not null default now()
);

create table public.bills (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name       text not null,
  amount     numeric,
  is_variable boolean not null default false,
  due_day    int not null check (due_day between 1 and 31),
  rrule      text not null default 'monthly',
  payer      text not null default 'joint',              -- me|partner|joint|alternate (relative label kept in app)
  payer_user uuid references public.profiles(id),
  autopay    boolean not null default false,
  category_id uuid references public.categories(id),
  last_paid_on date
);

create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  owner_id    uuid references public.profiles(id),
  visibility  public.visibility not null default 'shared',
  name        text not null,
  emoji       text not null default '🎯',
  image_url   text,
  target_amount numeric not null check (target_amount > 0),
  saved_amount  numeric not null default 0,
  target_date date,
  created_at  timestamptz not null default now()
);

create table public.goal_contributions (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  goal_id   uuid not null references public.goals(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  amount    numeric not null check (amount > 0),
  made_at   timestamptz not null default now()
);

create or replace function public.apply_goal_contribution()
returns trigger language plpgsql as $$
begin
  update public.goals set saved_amount = saved_amount + new.amount where id = new.goal_id;
  return new;
end $$;
create trigger trg_goal_contribution after insert on public.goal_contributions
  for each row execute function public.apply_goal_contribution();

-- ---------------------------------------------------------------------------
-- 6. WISHLISTS & GIFTING
-- ---------------------------------------------------------------------------
create table public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid references public.profiles(id),        -- null = "ours"
  visibility public.visibility not null default 'visible',
  name       text not null,
  kind       text not null default 'personal'            -- personal|ours|custom
);

create table public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id),  -- the list owner (or adder for 'ours')
  visibility  public.visibility not null default 'visible',
  title       text not null,
  kind        text not null default 'specific',          -- specific|generic
  url         text,
  image_url   text,
  price       numeric,
  priority    int not null default 2 check (priority between 1 and 3),
  notes       text,
  added_by    uuid references public.profiles(id),
  claimed_by  uuid references public.profiles(id),
  claimed_for_occasion uuid,
  purchased_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Masked view: the list owner must NEVER see claim state on their own items.
create view public.wishlist_items_view
with (security_invoker = on) as
select
  w.id, w.couple_id, w.wishlist_id, w.owner_id, w.visibility, w.title, w.kind,
  w.url, w.image_url, w.price, w.priority, w.notes, w.added_by, w.created_at,
  case when w.owner_id = auth.uid() then null else w.claimed_by end            as claimed_by,
  case when w.owner_id = auth.uid() then null else w.claimed_for_occasion end  as claimed_for_occasion,
  case when w.owner_id = auth.uid() then null else w.purchased_at end          as purchased_at
from public.wishlist_items w;

create table public.people (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name      text not null,
  relation  text
);

create table public.occasions (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  person_id uuid references public.people(id),           -- null = the partner/anniversary
  kind      text not null default 'birthday',            -- birthday|anniversary|festival|custom
  title     text not null,
  on_date   date not null,
  repeats_yearly boolean not null default true,
  budget    numeric,
  lead_days int not null default 14
);

create table public.gifts (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  occasion_id uuid references public.occasions(id),
  person_id  uuid references public.people(id),
  direction  text not null default 'given',              -- given|received
  item       text not null,
  cost       numeric,
  rating     int check (rating between 1 and 5),
  photo_url  text,
  given_on   date not null default current_date
);

-- ---------------------------------------------------------------------------
-- 7. PLANS: EVENTS, DATES, TRIPS, REMINDERS
-- ---------------------------------------------------------------------------
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  location   text,
  notes      text,
  scope      text not null default 'ours',               -- mine|partner|ours (display color)
  is_countdown boolean not null default false,
  surprise   boolean not null default false,
  surprise_teaser text,
  rrule      text,
  created_at timestamptz not null default now()
);

-- Masked view: partner sees only the teaser for surprise events.
create view public.events_view
with (security_invoker = on) as
select
  e.id, e.couple_id, e.owner_id, e.visibility, e.starts_at, e.ends_at, e.scope,
  e.is_countdown, e.surprise, e.rrule, e.created_at,
  case when e.surprise and e.owner_id <> auth.uid()
       then coalesce(e.surprise_teaser, '📦 A surprise') else e.title end   as title,
  case when e.surprise and e.owner_id <> auth.uid() then null else e.location end as location,
  case when e.surprise and e.owner_id <> auth.uid() then null else e.notes end    as notes
from public.events e;

create table public.date_ideas (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title      text not null,
  url        text,
  image_url  text,
  budget_band text not null default '₹₹',                -- ₹|₹₹|₹₹₹
  energy     text not null default 'chill',              -- chill|active
  duration_min int,
  setting    text not null default 'out',                -- home|out
  done_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.date_goal (
  couple_id  uuid primary key references public.couples(id) on delete cascade,
  per_month  int not null default 2,
  streak     int not null default 0,
  last_date_on date
);

create table public.reminders (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title      text not null,
  due_at     timestamptz not null,
  rrule      text,
  assignee   uuid references public.profiles(id),
  status     public.reminder_status not null default 'accepted',
  category   text not null default 'misc'
);

create table public.trips (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name       text not null,
  destination text,
  starts_on  date,
  ends_on    date,
  status     public.trip_status not null default 'dream',
  budget     numeric,
  cover_url  text,
  goal_id    uuid references public.goals(id)
);

create table public.trip_items (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  trip_id   uuid not null references public.trips(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  day_index int not null default 1,
  at_time   text,
  kind      text not null default 'activity',            -- activity|stay|transport|food
  title     text not null,
  cost_est  numeric,
  booked    boolean not null default false,
  file_url  text
);

create table public.packing_items (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  trip_id   uuid not null references public.trips(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  item      text not null,
  assignee  uuid references public.profiles(id),
  done      boolean not null default false
);

alter table public.transactions
  add constraint fk_txn_trip foreign key (trip_id) references public.trips(id);

-- ---------------------------------------------------------------------------
-- 8. HOUSEHOLD
-- ---------------------------------------------------------------------------
create table public.tasks (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title     text not null,
  notes     text,
  due_at    timestamptz,
  assignee  uuid references public.profiles(id),
  rrule     text,
  rotate    boolean not null default false,
  done_at   timestamptz,
  created_at timestamptz not null default now()
);

create table public.lists (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name      text not null,
  kind      text not null default 'custom'               -- grocery|custom|media
);

create table public.list_items (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  list_id   uuid not null references public.lists(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  name      text not null,
  qty       text,
  aisle     text,
  favorite  boolean not null default false,
  done      boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.recipes (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title     text not null,
  url       text,
  image_url text,
  ingredients jsonb not null default '[]',
  steps     jsonb not null default '[]',
  rating    int check (rating between 1 and 5)
);

create table public.meal_plan (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  on_date   date not null,
  meal      text not null default 'dinner',
  recipe_id uuid references public.recipes(id)
);

-- ---------------------------------------------------------------------------
-- 9. CONNECTION & MEMORIES
-- ---------------------------------------------------------------------------
create table public.memories (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  title     text,
  caption   text,
  photos    text[] not null default '{}',
  on_date   date not null default current_date,
  is_milestone boolean not null default false,
  linked_kind text,                                      -- date|trip|null
  linked_id uuid,
  private_notes jsonb not null default '{}'              -- {user_id: "note"} — filtered client-side per key
);

create table public.gratitude (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  owner_id   uuid not null references public.profiles(id),   -- author
  recipient  uuid not null references public.profiles(id),
  body       text not null,
  deliver_at timestamptz not null default now() + interval '12 hours',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.questions (
  id        uuid primary key default gen_random_uuid(),
  pack      text not null default 'fun',
  body      text not null,
  active_on date                                         -- daily question scheduling
);

create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  owner_id    uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now(),
  unique (couple_id, question_id, owner_id)
);

create table public.checkins (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'shared',
  week_of   date not null,
  sliders   jsonb not null default '{}',
  highlight text,
  need      text,
  plan      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. SYSTEM: INSIGHTS, BRIEFS, NOTIFICATION LOG
-- ---------------------------------------------------------------------------
create table public.insights (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid references public.profiles(id),         -- null = for both
  visibility public.visibility not null default 'shared',
  kind      text not null,
  payload   jsonb not null default '{}',
  seen_at   timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_briefs (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id  uuid not null references public.profiles(id),
  visibility public.visibility not null default 'private',
  week_of   date not null,
  content   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications_log (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid,
  owner_id  uuid not null,
  visibility public.visibility not null default 'private',
  category  text not null,
  sent_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 11. DEFAULTS ON COUPLE CREATION / MEMBER JOIN
-- ---------------------------------------------------------------------------
create or replace function public.setup_couple_defaults(p_couple uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (couple_id, name, emoji, sort) values
    (p_couple,'Housing','🏠',1),(p_couple,'Groceries','🛒',2),(p_couple,'Dining out','🍽️',3),
    (p_couple,'Delivery','🛵',4),(p_couple,'Transport','🚕',5),(p_couple,'Utilities & Bills','⚡',6),
    (p_couple,'Health','🩺',7),(p_couple,'Personal care','🧴',8),(p_couple,'Shopping','🛍️',9),
    (p_couple,'Entertainment','🎬',10),(p_couple,'Date nights','❤️',11),(p_couple,'Gifts','🎁',12),
    (p_couple,'Travel','✈️',13),(p_couple,'Family','👨‍👩‍👧',14),(p_couple,'EMIs & Debt','🏦',15),
    (p_couple,'Fees','🧾',16),(p_couple,'Income','💰',17),(p_couple,'Transfers','🔁',18);
  insert into public.lists (couple_id, name, kind) values (p_couple, 'Groceries', 'grocery');
  insert into public.wishlists (couple_id, owner_id, name, kind)
    values (p_couple, null, 'Ours', 'ours'), (p_couple, p_user, 'My wishlist', 'personal');
  insert into public.date_goal (couple_id) values (p_couple) on conflict do nothing;
end $$;

create or replace function public.setup_member_defaults(p_couple uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.wishlists (couple_id, owner_id, name, kind)
    values (p_couple, p_user, 'My wishlist', 'personal');
end $$;

-- ---------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- 12a. Identity tables (bespoke policies)
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select
  using (id = auth.uid()
     or exists (select 1 from public.couple_members m1
                join public.couple_members m2 on m1.couple_id = m2.couple_id
                where m1.user_id = auth.uid() and m2.user_id = profiles.id));
create policy profiles_update on public.profiles for update using (id = auth.uid());

alter table public.couples enable row level security;
create policy couples_select on public.couples for select using (public.is_member(id));
create policy couples_update on public.couples for update using (public.is_member(id));

alter table public.couple_members enable row level security;
create policy members_select on public.couple_members for select using (public.is_member(couple_id));
-- inserts only via security-definer RPCs; no insert policy on purpose

alter table public.invites enable row level security;
create policy invites_select on public.invites for select
  using (created_by = auth.uid() or public.is_member(couple_id));
-- join_couple() reads invites as definer, so joiners don't need select

-- questions are global content
alter table public.questions enable row level security;
create policy questions_read on public.questions for select using (auth.role() = 'authenticated');

-- 12b. Standard pattern applied to all couple-scoped tables
do $$
declare t text;
begin
  foreach t in array array[
    'accounts','categories','transactions','transaction_comments','settlements',
    'bills','goals','goal_contributions','wishlists','wishlist_items','people','occasions',
    'gifts','events','date_ideas','reminders','trips','trip_items','packing_items',
    'tasks','lists','list_items','recipes','meal_plan','memories','checkins',
    'insights','ai_briefs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$
      create policy %1$s_sel on public.%1$I for select
        using (public.is_member(couple_id)
               and (visibility <> 'private' or owner_id = auth.uid()))$p$, t);
    execute format($p$
      create policy %1$s_ins on public.%1$I for insert
        with check (public.is_member(couple_id) and owner_id = auth.uid())$p$, t);
    execute format($p$
      create policy %1$s_upd on public.%1$I for update
        using (public.is_member(couple_id)
               and (owner_id = auth.uid() or visibility = 'shared'))$p$, t);
    execute format($p$
      create policy %1$s_del on public.%1$I for delete
        using (public.is_member(couple_id)
               and (owner_id = auth.uid() or visibility = 'shared'))$p$, t);
  end loop;
end $$;

-- Tables in the loop that lack a visibility/owner shape are fixed below.

-- splits & answers have no visibility column semantics beyond couple scope:
alter table public.splits alter column couple_id set not null;

create policy splits_sel on public.splits for select using (public.is_member(couple_id));

-- Daily-question blind reveal: see own answer always; partner's only after you answered too.
create policy answers_sel on public.answers for select
  using (public.is_member(couple_id)
         and (owner_id = auth.uid()
              or exists (select 1 from public.answers a2
                         where a2.couple_id = answers.couple_id
                           and a2.question_id = answers.question_id
                           and a2.owner_id = auth.uid())));

-- 12c. SECRET GIFTS — the special transaction SELECT policy
drop policy transactions_sel on public.transactions;
create policy transactions_sel on public.transactions for select
  using (public.is_member(couple_id)
         and (visibility <> 'private' or owner_id = auth.uid())
         and (is_gift_hidden = false
              or owner_id = auth.uid()
              or coalesce(reveal_date, current_date) <= current_date));

-- Prevent the claim columns being written by the item owner (only partner may claim)
create or replace function public.guard_wishlist_claim()
returns trigger language plpgsql as $$
begin
  if new.claimed_by is distinct from old.claimed_by
     and auth.uid() = new.owner_id then
    raise exception 'Owners cannot modify claim state of their own items';
  end if;
  return new;
end $$;
create trigger trg_guard_claim before update on public.wishlist_items
  for each row execute function public.guard_wishlist_claim();

-- gratitude: author always; recipient only after deliver_at
alter table public.gratitude enable row level security;
create policy gratitude_sel on public.gratitude for select
  using (owner_id = auth.uid()
         or (recipient = auth.uid() and deliver_at <= now()));
create policy gratitude_ins on public.gratitude for insert
  with check (public.is_member(couple_id) and owner_id = auth.uid());
create policy gratitude_upd on public.gratitude for update
  using (recipient = auth.uid() or owner_id = auth.uid());

-- date_goal (couple-keyed, no owner/visibility)
alter table public.date_goal enable row level security;
create policy dategoal_all on public.date_goal for all
  using (public.is_member(couple_id)) with check (public.is_member(couple_id));

-- notifications_log: own rows only
alter table public.notifications_log enable row level security;
create policy notif_own on public.notifications_log for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 13. STORAGE BUCKETS (+ path-scoped policies: files live under {couple_id}/...)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true),
  ('receipts','receipts', false),
  ('memories','memories', false),
  ('vault','vault', false)
on conflict (id) do nothing;

create policy storage_couple_read on storage.objects for select
  using (bucket_id in ('receipts','memories','vault')
         and public.is_member((storage.foldername(name))[1]::uuid));
create policy storage_couple_write on storage.objects for insert
  with check (bucket_id in ('receipts','memories','vault')
              and public.is_member((storage.foldername(name))[1]::uuid));
create policy storage_avatar_read on storage.objects for select
  using (bucket_id = 'avatars');
create policy storage_avatar_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 14. GRANTS for views (RLS of base tables still applies via security_invoker)
-- ---------------------------------------------------------------------------
grant select on public.wishlist_items_view to authenticated;
grant select on public.events_view to authenticated;

-- ============================================================================
-- END MIGRATION 001
-- ============================================================================
