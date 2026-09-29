alter table public."columnistInvites"
  add column if not exists "openedAtMs" bigint,
  add column if not exists "openedIp" text,
  add column if not exists "openedUserAgent" text,
  add column if not exists "manualReleasedAtMs" bigint,
  add column if not exists "manualReleasedByOpenId" text,
  add column if not exists "manualReleaseReason" text;

create index if not exists "columnistInvites_openedAtMs_idx"
  on public."columnistInvites" ("openedAtMs");

create index if not exists "columnistInvites_manualReleasedAtMs_idx"
  on public."columnistInvites" ("manualReleasedAtMs");