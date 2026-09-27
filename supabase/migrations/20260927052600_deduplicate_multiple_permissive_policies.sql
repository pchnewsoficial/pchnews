-- Reduce RLS policy fan-out without changing intended access.
-- Public read policies remain responsible for public SELECT access.
-- Editorial/admin mutation policies are split by operation to avoid FOR ALL
-- policies overlapping with public/self SELECT policies.

drop policy if exists "editorial manage agenda monetization" on public."agenda_monetization_settings";
create policy "editorial insert agenda monetization"
  on public."agenda_monetization_settings" for insert to authenticated
  with check ((select private.has_editorial_role(ARRAY['admin']::text[])));
create policy "editorial update agenda monetization"
  on public."agenda_monetization_settings" for update to authenticated
  using ((select private.has_editorial_role(ARRAY['admin']::text[])))
  with check ((select private.has_editorial_role(ARRAY['admin']::text[])));
create policy "editorial delete agenda monetization"
  on public."agenda_monetization_settings" for delete to authenticated
  using ((select private.has_editorial_role(ARRAY['admin']::text[])));

drop policy if exists "articles editorial select" on public.articles;
create policy "articles editorial select"
  on public.articles for select to authenticated
  using (
    private.has_editorial_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text])
    or ("authorOpenId"::text = (select auth.uid())::text)
  );

drop policy if exists "profiles authenticated manage" on public."columnistProfiles";
create policy "profiles authenticated insert"
  on public."columnistProfiles" for insert to authenticated
  with check (
    private.is_admin()
    or slug = lower(regexp_replace(
      (select u.name from public.users u where u."openId" = (select auth.uid())::text),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
  );
create policy "profiles authenticated update"
  on public."columnistProfiles" for update to authenticated
  using (
    private.is_admin()
    or slug = lower(regexp_replace(
      (select u.name from public.users u where u."openId" = (select auth.uid())::text),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
  )
  with check (
    private.is_admin()
    or slug = lower(regexp_replace(
      (select u.name from public.users u where u."openId" = (select auth.uid())::text),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
  );
create policy "profiles authenticated delete"
  on public."columnistProfiles" for delete to authenticated
  using (
    private.is_admin()
    or slug = lower(regexp_replace(
      (select u.name from public.users u where u."openId" = (select auth.uid())::text),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
  );

drop policy if exists "comments authenticated manage" on public.comments;
drop policy if exists "public approved comments read" on public.comments;
drop policy if exists "public create comments" on public.comments;
create policy "comments read approved or admin"
  on public.comments for select to anon, authenticated
  using (status = 'approved'::text or private.is_admin());
create policy "comments create pending or admin"
  on public.comments for insert to anon, authenticated
  with check (status = 'pending'::text or private.is_admin());
create policy "comments admin update"
  on public.comments for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());
create policy "comments admin delete"
  on public.comments for delete to authenticated
  using (private.is_admin());

drop policy if exists "editorial members admin manage" on public."editorialMembers";
create policy "editorial members admin insert"
  on public."editorialMembers" for insert to authenticated
  with check ((select private.has_editorial_role(ARRAY['admin']::text[])));
create policy "editorial members admin update"
  on public."editorialMembers" for update to authenticated
  using ((select private.has_editorial_role(ARRAY['admin']::text[])))
  with check ((select private.has_editorial_role(ARRAY['admin']::text[])));
create policy "editorial members admin delete"
  on public."editorialMembers" for delete to authenticated
  using ((select private.has_editorial_role(ARRAY['admin']::text[])));
