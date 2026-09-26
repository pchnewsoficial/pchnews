-- PCH News commercial intake.
alter table public."adRequests"
  add column if not exists "contactName" text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists website text,
  add column if not exists socials text,
  add column if not exists "adType" text,
  add column if not exists budget text,
  add column if not exists period text,
  add column if not exists "consentAtMs" bigint,
  add column if not exists source text default 'public-site';

create index if not exists "adRequests_createdAtMs_idx" on public."adRequests" ("createdAtMs" desc);
create index if not exists "adRequests_email_idx" on public."adRequests" (email);
