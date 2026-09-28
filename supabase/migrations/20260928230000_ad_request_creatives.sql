-- PCH News commercial creative intake.
alter table public."adRequests"
  add column if not exists "creativeUrl" text,
  add column if not exists "creativeNeed" text not null default 'no_artwork_yet';

create index if not exists "adRequests_creativeNeed_idx"
  on public."adRequests" ("creativeNeed");
