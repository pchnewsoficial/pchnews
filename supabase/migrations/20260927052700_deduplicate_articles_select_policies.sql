-- Keep public article reads and authenticated editorial access as separate
-- role-scoped policies, while avoiding overlapping permissive SELECT policies
-- for authenticated users.

drop policy if exists "articles editorial select" on public.articles;
drop policy if exists "public published articles read" on public.articles;

create policy "public published articles read"
  on public.articles for select to anon
  using (
    status = any (ARRAY['published'::text, 'updated'::text])
    and ("scheduledAt" is null or "scheduledAt" <= (extract(epoch from now()) * 1000)::bigint)
  );

create policy "articles authenticated select"
  on public.articles for select to authenticated
  using (
    (
      status = any (ARRAY['published'::text, 'updated'::text])
      and ("scheduledAt" is null or "scheduledAt" <= (extract(epoch from now()) * 1000)::bigint)
    )
    or private.has_editorial_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text])
    or ("authorOpenId"::text = (select auth.uid())::text)
  );
