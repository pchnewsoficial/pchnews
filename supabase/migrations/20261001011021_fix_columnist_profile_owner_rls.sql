-- Make columnist profile ownership stable across display-name changes.
drop policy if exists "profiles authenticated insert" on public."columnistProfiles";
drop policy if exists "profiles authenticated update" on public."columnistProfiles";
drop policy if exists "profiles authenticated delete" on public."columnistProfiles";

create policy "profiles authenticated insert"
  on public."columnistProfiles" for insert to authenticated
  with check (
    private.is_admin()
    or "openId"::text = (select auth.uid())::text
  );

create policy "profiles authenticated update"
  on public."columnistProfiles" for update to authenticated
  using (
    private.is_admin()
    or "openId"::text = (select auth.uid())::text
    or ("openId" is null and "slug" = lower(regexp_replace(
      (select u.name from public.users u where u."openId" = (select auth.uid())::text),
      '[^a-zA-Z0-9]+', '-', 'g'
    )))
  )
  with check (
    private.is_admin()
    or "openId"::text = (select auth.uid())::text
  );

create policy "profiles authenticated delete"
  on public."columnistProfiles" for delete to authenticated
  using (
    private.is_admin()
    or "openId"::text = (select auth.uid())::text
  );
