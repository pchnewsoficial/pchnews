drop policy if exists "audit actor insert" on public."articleAudit";
create policy "audit editorial actor insert"
on public."articleAudit"
for insert to authenticated
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
  and "actorOpenId" = (select auth.uid())::text
);

drop policy if exists "agent runs actor insert" on public."editorialAgentRuns";
create policy "agent runs editorial actor insert"
on public."editorialAgentRuns"
for insert to authenticated
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
  and "actorOpenId" = (select auth.uid())::text
);

drop policy if exists "freedom reviews actor insert" on public."editorialFreedomReviews";
create policy "freedom reviews editorial actor insert"
on public."editorialFreedomReviews"
for insert to authenticated
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
  and "actorOpenId" = (select auth.uid())::text
);

drop policy if exists "research context actor insert" on public."editorialResearchContexts";
create policy "research context editorial actor insert"
on public."editorialResearchContexts"
for insert to authenticated
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
  and "actorOpenId" = (select auth.uid())::text
);