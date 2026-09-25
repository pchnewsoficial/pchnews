-- PCH News: persist normalized API Hub research used during editorial review.
create table if not exists public."editorialResearchContexts" (
  id text primary key,
  "articleId" text not null references public."articles"("id") on delete cascade,
  "fetchedAtMs" bigint not null,
  "providersJson" jsonb not null default '{}'::jsonb,
  "contextJson" jsonb not null default '{}'::jsonb,
  "actorOpenId" text not null,
  "createdAtMs" bigint not null
);

create index if not exists "editorialResearchContexts_articleId_createdAtMs_idx"
  on public."editorialResearchContexts" ("articleId", "createdAtMs" desc);

alter table public."editorialResearchContexts" enable row level security;

drop policy if exists "research context actor insert" on public."editorialResearchContexts";
create policy "research context actor insert"
  on public."editorialResearchContexts"
  for insert to authenticated
  with check (("actorOpenId"::text = auth.uid()::text) or is_admin());

drop policy if exists "research context admin or actor" on public."editorialResearchContexts";
create policy "research context admin or actor"
  on public."editorialResearchContexts"
  for select to authenticated
  using (is_admin() or ("actorOpenId"::text = auth.uid()::text));
