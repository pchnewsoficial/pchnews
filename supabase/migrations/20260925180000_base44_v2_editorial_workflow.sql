-- PCH News V2 editorial workflow parity
-- Persistent workflow states and explicit AI finding decisions.

alter table public.articles
  drop constraint if exists "articles_status_check";

alter table public.articles
  add constraint "articles_status_check"
  check (status in ('published','draft','review','revised','approved','scheduled','updated','archived'));

create index if not exists "articles_status_updatedAt_idx"
  on public.articles (status, "updatedAt" desc);

create table if not exists public."editorialFindingDecisions" (
  id text primary key,
  "articleId" text not null references public.articles(id) on delete cascade,
  "agentRunId" text not null,
  "findingCode" text not null,
  decision text not null check (decision in ('pending','accepted','rejected')),
  note text null,
  "actorOpenId" text not null,
  "createdAtMs" bigint not null,
  "updatedAtMs" bigint not null
);

create unique index if not exists "editorialFindingDecisions_run_finding_actor_idx"
  on public."editorialFindingDecisions" ("agentRunId", "findingCode", "actorOpenId");

create index if not exists "editorialFindingDecisions_article_updated_idx"
  on public."editorialFindingDecisions" ("articleId", "updatedAtMs" desc);

alter table public."editorialFindingDecisions" enable row level security;

drop policy if exists "finding decisions actor write" on public."editorialFindingDecisions";
create policy "finding decisions actor write"
  on public."editorialFindingDecisions"
  for all to authenticated
  using (is_admin() or "actorOpenId" = (select auth.uid())::text)
  with check (is_admin() or "actorOpenId" = (select auth.uid())::text);

drop policy if exists "finding decisions admin or actor read" on public."editorialFindingDecisions";
create policy "finding decisions admin or actor read"
  on public."editorialFindingDecisions"
  for select to authenticated
  using (is_admin() or "actorOpenId" = (select auth.uid())::text);
