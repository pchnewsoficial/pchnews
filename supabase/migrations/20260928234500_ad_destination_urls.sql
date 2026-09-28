-- Separate the creative asset from the destination opened when a reader clicks the ad.
alter table public."adCampaigns"
  add column if not exists "destinationUrl" text;

alter table public."adRequests"
  add column if not exists "destinationUrl" text;

create index if not exists "adCampaigns_destinationUrl_idx"
  on public."adCampaigns" ("destinationUrl");

create index if not exists "adRequests_destinationUrl_idx"
  on public."adRequests" ("destinationUrl");
