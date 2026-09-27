drop policy if exists "finding decisions editorial access" on public."editorialFindingDecisions";

create policy "finding decisions editorial read"
on public."editorialFindingDecisions"
for select to authenticated
using (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
);

create policy "finding decisions editorial insert"
on public."editorialFindingDecisions"
for insert to authenticated
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','journalist','columnist','reviewer']::text[]))
  and "actorOpenId" = (select auth.uid())::text
);

create policy "finding decisions editorial update"
on public."editorialFindingDecisions"
for update to authenticated
using (
  (select private.has_editorial_role(ARRAY['admin','editor','reviewer']::text[]))
  or (
    (select private.has_editorial_role(ARRAY['journalist','columnist']::text[]))
    and "actorOpenId" = (select auth.uid())::text
  )
)
with check (
  (select private.has_editorial_role(ARRAY['admin','editor','reviewer']::text[]))
  or (
    (select private.has_editorial_role(ARRAY['journalist','columnist']::text[]))
    and "actorOpenId" = (select auth.uid())::text
  )
);

create policy "finding decisions editorial delete"
on public."editorialFindingDecisions"
for delete to authenticated
using (
  (select private.has_editorial_role(ARRAY['admin','editor','reviewer']::text[]))
  or (
    (select private.has_editorial_role(ARRAY['journalist','columnist']::text[]))
    and "actorOpenId" = (select auth.uid())::text
  )
);