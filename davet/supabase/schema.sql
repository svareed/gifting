-- Davet schema. Run once against a fresh Supabase project.

create extension if not exists pgcrypto;

-- Organisations ------------------------------------------------------------
-- Every invitation belongs to a venue or planner, not to a person: "unlimited
-- for the hall" has to mean something a login cannot express, and branding and
-- quota need somewhere to live that survives staff turnover.

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Subdomain label: rosenhof -> rosenhof.davet.de
  slug        text not null unique,
  logo_url    text not null default '',
  website     text not null default '',
  phone       text not null default '',
  plan        text not null default 'basis' check (plan in ('basis','profi','gruppe')),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  org_id   uuid not null references public.organizations(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null default 'owner' check (role in ('owner','member')),
  primary key (org_id, user_id)
);

create index on public.memberships (user_id);

create table public.invites (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  org_id          uuid references public.organizations(id) on delete cascade,
  slug            text not null unique,
  status          text not null default 'draft'  check (status in ('draft','published')),
  -- False while the address tracks the couple's names; set on manual edit.
  slug_locked     boolean not null default false,
  tradition       text not null default 'islamic' check (tradition in ('islamic','christian','secular')),
  -- du/Sie, sen/siz. Affects only the words guests read.
  address_form    text not null default 'informal' check (address_form in ('informal','formal')),
  locale          text not null default 'de'     check (locale in ('en','de','tr')),
  theme           text not null default 'ivory-gold',
  opener          text not null default 'veil'   check (opener in ('veil','foil','envelope','direct','tor')),
  timezone        text not null default 'Europe/Berlin',
  partner_a_name  text not null default '',
  partner_b_name  text not null default '',
  hero_image      text,
  invite_card     text,
  sections        jsonb not null default '{}'::jsonb,
  rsvp_deadline   date,
  organizer_name  text not null default '',
  organizer_url   text not null default '',
  organizer_phone text not null default '',
  info_weather    text not null default '',
  info_dress      text not null default '',
  info_parking    text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.events (
  id             uuid primary key default gen_random_uuid(),
  invite_id      uuid not null references public.invites(id) on delete cascade,
  sort           int  not null default 0,
  preset_key     text,
  custom_name    text,
  venue_name     text not null default '',
  venue_address  text not null default '',
  maps_url       text not null default '',
  -- Always an absolute instant. The invitation's timezone turns it back into
  -- a wall clock time; the countdown never uses a local string.
  starts_at      timestamptz not null,
  note           text not null default ''
);

create table public.families (
  id            uuid primary key default gen_random_uuid(),
  invite_id     uuid not null references public.invites(id) on delete cascade,
  side          text not null check (side in ('a','b')),
  person_name   text not null default '',
  parents       text not null default '',
  grandparents  text not null default ''
);

create table public.verses (
  id             uuid primary key default gen_random_uuid(),
  invite_id      uuid not null references public.invites(id) on delete cascade,
  sort           int not null default 0,
  library_key    text,
  custom_arabic  text,
  custom_text    text,
  custom_ref     text
);

-- Guest list ---------------------------------------------------------------
-- A household holds a token and a seat allowance. Catering is calculated
-- against the sum of allowances, so the RSVP form can never return more people
-- than the couple actually invited.

create table public.guests (
  id          uuid primary key default gen_random_uuid(),
  invite_id   uuid not null references public.invites(id) on delete cascade,
  token       text not null unique,
  household   text not null default '',
  seats       int  not null default 2 check (seats between 1 and 20),
  email       text not null default '',
  phone       text not null default '',
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create index on public.guests (invite_id, sort);

create table public.rsvps (
  id           uuid primary key default gen_random_uuid(),
  invite_id    uuid not null references public.invites(id) on delete cascade,
  name         text not null,
  attending    boolean not null,
  guest_count  int not null default 1 check (guest_count between 0 and 20),
  message      text not null default '',
  -- Set when the reply arrived through a household link. One row per household:
  -- a second reply corrects the first rather than inflating the count.
  guest_id     uuid references public.guests(id) on delete cascade,
  ip_hash      text,
  created_at   timestamptz not null default now()
);

create unique index rsvps_one_per_guest on public.rsvps (guest_id) where guest_id is not null;


create index on public.events   (invite_id, sort);
create index on public.families (invite_id);
create index on public.verses   (invite_id, sort);
create index on public.rsvps    (invite_id, created_at desc);

create table public.reminders (
  id        uuid primary key default gen_random_uuid(),
  guest_id  uuid not null references public.guests(id) on delete cascade,
  kind      text not null check (kind in ('t14','t7')),
  channel   text not null check (channel in ('email','whatsapp')),
  sent_at   timestamptz,
  unique (guest_id, kind, channel)
);

create index on public.reminders (guest_id);

-- Row level security --------------------------------------------------------
-- Owners hold full CRUD over their own rows. Anonymous visitors may read a
-- published invitation and nothing else. Anonymous
-- writes are denied outright: RSVP submissions go through a route handler
-- that holds the service role, so validation, the honeypot, and rate limiting
-- cannot be bypassed by posting straight at PostgREST.

alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.guests        enable row level security;
alter table public.reminders     enable row level security;
alter table public.invites  enable row level security;
alter table public.events   enable row level security;
alter table public.families enable row level security;
alter table public.verses   enable row level security;
alter table public.rsvps    enable row level security;

create or replace function public.is_member(o uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.memberships where org_id = o and user_id = auth.uid());
  $$;

create policy member_read on public.organizations
  for select using (public.is_member(id));
create policy member_write on public.organizations
  for update using (public.is_member(id)) with check (public.is_member(id));

create policy own_membership on public.memberships
  for select using (user_id = auth.uid());

create policy owner_all on public.invites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy public_read_published on public.invites
  for select to anon using (status = 'published');

-- Child tables inherit visibility from their invitation.
create or replace function public.owns_invite(i uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.invites where id = i and owner_id = auth.uid());
  $$;

create or replace function public.invite_is_published(i uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.invites where id = i and status = 'published');
  $$;

-- Guests and reminders are never public: a token is checked by the route
-- handler holding the service role, never by an anonymous PostgREST read.
create policy owner_all on public.guests
  for all using (public.owns_invite(invite_id)) with check (public.owns_invite(invite_id));

create policy owner_all on public.reminders
  for all using (exists (
    select 1 from public.guests g
     where g.id = guest_id and public.owns_invite(g.invite_id)
  ));

create policy owner_all on public.events
  for all using (public.owns_invite(invite_id)) with check (public.owns_invite(invite_id));
create policy public_read on public.events
  for select to anon using (public.invite_is_published(invite_id));

create policy owner_all on public.families
  for all using (public.owns_invite(invite_id)) with check (public.owns_invite(invite_id));
create policy public_read on public.families
  for select to anon using (public.invite_is_published(invite_id));

create policy owner_all on public.verses
  for all using (public.owns_invite(invite_id)) with check (public.owns_invite(invite_id));
create policy public_read on public.verses
  for select to anon using (public.invite_is_published(invite_id));

-- Responses are never public, not even on a published invitation.
create policy owner_all on public.rsvps
  for all using (public.owns_invite(invite_id)) with check (public.owns_invite(invite_id));


-- Retention ----------------------------------------------------------------
-- Guest personal data is deleted 90 days after the last event. Schedule with
-- pg_cron: select cron.schedule('davet-purge','0 3 * * *','select public.purge_old_guest_data()');

create or replace function public.purge_old_guest_data() returns void
  language sql security definer set search_path = public as $$
    delete from public.rsvps r
     where (select max(e.starts_at) from public.events e where e.invite_id = r.invite_id)
           < now() - interval '90 days';
  $$;
