-- LeadJakt — Initial Schema
-- Run this in your Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Enums
create type lead_status as enum (
  'new', 'diagnosed', 'outreach_ready', 'sent', 'replied', 'booked'
);

create type outreach_channel as enum (
  'email', 'sms', 'instagram_dm', 'linkedin'
);

-- Leads
create table leads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  business_name  text not null,
  address        text,
  city           text not null,
  niche          text not null,
  phone          text,
  email          text,
  website_url    text,
  google_rating  numeric(2,1),
  review_count   integer,
  years_on_map   integer,
  has_website    boolean not null default false,
  website_age    integer,
  status         lead_status not null default 'new',
  gap_score      smallint check (gap_score between 1 and 10),
  scout_query    text,
  source_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Diagnoses
create table diagnoses (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references leads(id) on delete cascade,
  summary          text not null,
  hero_angle       text not null,
  tone             text not null,
  gap_score        smallint not null check (gap_score between 1 and 10),
  suggested_message text not null,
  raw_claude_json  jsonb,
  created_at       timestamptz not null default now()
);

-- Outreach
create table outreach (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  diagnosis_id   uuid references diagnoses(id) on delete set null,
  channel        outreach_channel not null,
  subject        text,
  body           text not null,
  status         text not null default 'draft'
                   check (status in ('draft','sent','replied','booked','archived')),
  sent_at        timestamptz,
  replied_at     timestamptz,
  booked_at      timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Indexes
create index leads_user_id_idx     on leads(user_id);
create index leads_status_idx      on leads(status);
create index leads_has_website_idx on leads(has_website);
create index diagnoses_lead_id_idx on diagnoses(lead_id);
create index outreach_lead_id_idx  on outreach(lead_id);
create index outreach_status_idx   on outreach(status);

-- Updated-at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute procedure set_updated_at();

create trigger outreach_updated_at
  before update on outreach
  for each row execute procedure set_updated_at();

-- Row Level Security
alter table leads     enable row level security;
alter table diagnoses enable row level security;
alter table outreach  enable row level security;

create policy "leads: own rows"
  on leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "diagnoses: own leads"
  on diagnoses for all
  using (
    exists (select 1 from leads where leads.id = diagnoses.lead_id
            and leads.user_id = auth.uid())
  );

create policy "outreach: own leads"
  on outreach for all
  using (
    exists (select 1 from leads where leads.id = outreach.lead_id
            and leads.user_id = auth.uid())
  );
