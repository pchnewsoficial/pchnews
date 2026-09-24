-- Liberdade Editorial — Tolerajornal: resultado e histórico auditável
alter table public.articles add column if not exists "freedomStatus" text check ("freedomStatus" in ('pass','review','block'));
alter table public.articles add column if not exists "freedomScore" integer;
alter table public.articles add column if not exists "freedomReviewedAtMs" bigint;
alter table public.articles add column if not exists "contentType" text not null default 'fato' check ("contentType" in ('fato','opinião'));

create table if not exists public."editorialFreedomReviews" (
  id text primary key,
  "articleId" text not null,
  "rulesetVersion" text not null,
  status text not null check (status in ('pass','review','block')),
  score integer not null,
  "contentType" text not null,
  "autonomyAnswer" text not null,
  checks jsonb not null default '[]'::jsonb,
  "actorOpenId" text not null,
  "createdAtMs" bigint not null
);
create index if not exists "editorialFreedomReviews_article_idx" on public."editorialFreedomReviews" ("articleId", "createdAtMs" desc);
grant all on public."editorialFreedomReviews" to service_role;
alter table public."editorialFreedomReviews" enable row level security;
