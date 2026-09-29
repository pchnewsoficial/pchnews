-- Ensure the commercial campaign tables exist in a clean checkout.
-- Production already has these tables; CREATE IF NOT EXISTS is harmless there.
create table if not exists public.advertisers (
  id text primary key,
  company text not null,
  "contactName" text,
  email text,
  phone text,
  website text,
  city text,
  state text,
  status text not null default 'lead',
  notes text,
  "createdAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint),
  "updatedAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint)
);

create table if not exists public."adCampaigns" (
  id text primary key,
  "advertiserId" text not null references public.advertisers(id),
  name text not null,
  "adType" text not null,
  "creativeUrl" text,
  "targetScope" text not null default 'national',
  region text,
  state text,
  "startsAtMs" bigint,
  "endsAtMs" bigint,
  status text not null default 'draft'
    check (status in ('draft','scheduled','active','paused','finished')),
  "createdAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint),
  "updatedAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint)
);

alter table public.advertisers enable row level security;
alter table public."adCampaigns" enable row level security;

-- Separate the creative asset from the destination opened when a reader clicks the ad.
alter table public."adCampaigns"
  add column if not exists "destinationUrl" text;

alter table public."adRequests"
  add column if not exists "destinationUrl" text;

create index if not exists "adCampaigns_destinationUrl_idx"
  on public."adCampaigns" ("destinationUrl");

create index if not exists "adRequests_destinationUrl_idx"
  on public."adRequests" ("destinationUrl");
