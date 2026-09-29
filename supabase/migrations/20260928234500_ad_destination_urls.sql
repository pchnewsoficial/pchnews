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


-- Commercial analytics foundation: campaign impressions, clicks and private advertiser access.
create table if not exists public."adCampaignEvents" (
  id text primary key,
  "campaignId" text not null references public."adCampaigns"(id) on delete cascade,
  "eventType" text not null check ("eventType" in ('impression','click')),
  "occurredAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint),
  "visitorHash" text,
  "deviceType" text,
  "referrer" text
);
create index if not exists "adCampaignEvents_campaign_idx" on public."adCampaignEvents" ("campaignId","occurredAtMs" desc);
create index if not exists "adCampaignEvents_type_idx" on public."adCampaignEvents" ("campaignId","eventType","occurredAtMs" desc);

create table if not exists public."adCampaignAccess" (
  id text primary key,
  "campaignId" text not null references public."adCampaigns"(id) on delete cascade,
  "tokenHash" text not null unique,
  "expiresAtMs" bigint,
  "createdAtMs" bigint not null default ((extract(epoch from now()) * 1000)::bigint),
  "revokedAtMs" bigint
);

alter table public."adCampaignEvents" enable row level security;
alter table public."adCampaignAccess" enable row level security;
revoke all on table public."adCampaignEvents" from anon, authenticated;
revoke all on table public."adCampaignAccess" from anon, authenticated;


-- Inventory placement and geographic targeting for the same slot.
alter table public."adCampaigns"
  add column if not exists "placementId" text not null default 'home-main',
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists priority integer not null default 0;

create index if not exists "adCampaigns_placement_geo_idx"
  on public."adCampaigns" ("placementId","targetScope",country,state,city,status);
