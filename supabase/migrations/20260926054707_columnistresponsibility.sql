-- PCH News editorial responsibility acceptance.
alter table public."columnistInvites"
  add column if not exists "responsibilityAcceptedAtMs" bigint,
  add column if not exists "responsibilityVersion" text;

create index if not exists "columnistInvites_responsibilityAcceptedAtMs_idx"
  on public."columnistInvites" ("responsibilityAcceptedAtMs");
