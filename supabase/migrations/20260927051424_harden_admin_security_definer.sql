-- PCH News: move the admin predicate behind the private schema.
-- RLS policies continue to use an elevated helper, but the helper is no longer
-- callable through PostgREST by signed-in users.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.has_editorial_role(array['admin']::text[]);
$$;

revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon, authenticated;

alter policy "ads authenticated admin" on public."adRequests"
  using (private.is_admin());
alter policy "ads authenticated update" on public."adRequests"
  using (private.is_admin()) with check (private.is_admin());

alter policy "audit actor insert" on public."articleAudit"
  with check (((("actorOpenId")::text = (select auth.uid())::text) or private.is_admin()));
alter policy "audit admin or actor" on public."articleAudit"
  using (private.is_admin() or (("actorOpenId")::text = (select auth.uid())::text));

alter policy "invites admin only" on public."columnistInvites"
  using (private.is_admin()) with check (private.is_admin());

alter policy "profiles authenticated manage" on public."columnistProfiles"
  using (private.is_admin() or (("slug")::text = lower(regexp_replace((select u.name from public.users u where u."openId" = (select auth.uid())::text), '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text))))
  with check (private.is_admin() or (("slug")::text = lower(regexp_replace((select u.name from public.users u where u."openId" = (select auth.uid())::text), '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text))));

alter policy "comments authenticated manage" on public.comments
  using (private.is_admin()) with check (private.is_admin());

alter policy "agent runs actor insert" on public."editorialAgentRuns"
  with check (((("actorOpenId")::text = (select auth.uid())::text) or private.is_admin()));
alter policy "agent runs admin or actor" on public."editorialAgentRuns"
  using (private.is_admin() or (("actorOpenId")::text = (select auth.uid())::text));

alter policy "freedom reviews actor insert" on public."editorialFreedomReviews"
  with check (((("actorOpenId")::text = (select auth.uid())::text) or private.is_admin()));
alter policy "freedom reviews admin or actor" on public."editorialFreedomReviews"
  using (private.is_admin() or (("actorOpenId")::text = (select auth.uid())::text));

alter policy "research context actor insert" on public."editorialResearchContexts"
  with check ((("actorOpenId" = (select auth.uid())::text) or private.is_admin()));
alter policy "research context admin or actor" on public."editorialResearchContexts"
  using (private.is_admin() or ("actorOpenId" = (select auth.uid())::text));

alter policy "users admin update" on public.users
  using (private.is_admin()) with check (private.is_admin());
alter policy "users read own" on public.users
  using ((("openId" = (select auth.uid())::text) or private.is_admin()));
