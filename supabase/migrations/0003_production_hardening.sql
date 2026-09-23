-- PCH News production hardening
-- Supabase is the editorial source of truth for the production portal.

alter table public."columnistInvites"
  add column if not exists "revokedAtMs" bigint;

create table if not exists public."articleAudit" (
  id text primary key,
  "articleId" text not null,
  "actorOpenId" text not null,
  "actorName" text not null,
  action text not null,
  "beforeJson" jsonb,
  "afterJson" jsonb,
  "createdAtMs" bigint not null
);

create index if not exists "articleAudit_articleId_createdAtMs_idx"
  on public."articleAudit" ("articleId", "createdAtMs" desc);

create index if not exists "articles_status_scheduledAt_idx"
  on public.articles (status, "scheduledAt");

create index if not exists "articles_authorOpenId_idx"
  on public.articles ("authorOpenId");

create index if not exists "comments_articleId_status_createdAtMs_idx"
  on public.comments ("articleId", status, "createdAtMs" desc);

create index if not exists "adRequests_status_createdAtMs_idx"
  on public."adRequests" (status, "createdAtMs" desc);

alter table public."articleAudit" enable row level security;

-- Production writes/reads happen through the server-side Supabase key.
