alter table public.events
  add column if not exists "sourceType" text not null default 'public_submission'
    check ("sourceType" in ('public_submission','partner','external')),
  add column if not exists "sourceName" varchar(180),
  add column if not exists "sourceUrl" text,
  add column if not exists "importedAtMs" bigint;

create index if not exists idx_events_public_lifecycle
  on public.events(status,"startAtMs","endAtMs");