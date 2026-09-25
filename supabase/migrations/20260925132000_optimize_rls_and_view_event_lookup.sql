-- Optimize row-level security policies by evaluating auth.uid() once per statement.
-- Add the composite lookup index used by the public article view counter.

drop policy if exists "audit actor insert" on public."articleAudit";
create policy "audit actor insert" on public."articleAudit"
for insert to authenticated
with check (("actorOpenId")::text = (select auth.uid())::text or is_admin());

drop policy if exists "audit admin or actor" on public."articleAudit";
create policy "audit admin or actor" on public."articleAudit"
for select to authenticated
using (is_admin() or ("actorOpenId")::text = (select auth.uid())::text);

drop policy if exists "articles columnist own" on public.articles;
create policy "articles columnist own" on public.articles
for all to authenticated
using (("authorOpenId")::text = (select auth.uid())::text)
with check (("authorOpenId")::text = (select auth.uid())::text);

drop policy if exists "profiles authenticated manage" on public."columnistProfiles";
create policy "profiles authenticated manage" on public."columnistProfiles"
for all to authenticated
using (
  is_admin()
  or ("slug")::text = lower(regexp_replace(
    (select u.name from public.users u where u."openId" = (select auth.uid())::text),
    '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text
  ))
)
with check (
  is_admin()
  or ("slug")::text = lower(regexp_replace(
    (select u.name from public.users u where u."openId" = (select auth.uid())::text),
    '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text
  ))
);

drop policy if exists "agent runs actor insert" on public."editorialAgentRuns";
create policy "agent runs actor insert" on public."editorialAgentRuns"
for insert to authenticated
with check (("actorOpenId")::text = (select auth.uid())::text or is_admin());

drop policy if exists "agent runs admin or actor" on public."editorialAgentRuns";
create policy "agent runs admin or actor" on public."editorialAgentRuns"
for select to authenticated
using (is_admin() or ("actorOpenId")::text = (select auth.uid())::text);

drop policy if exists "freedom reviews actor insert" on public."editorialFreedomReviews";
create policy "freedom reviews actor insert" on public."editorialFreedomReviews"
for insert to authenticated
with check (("actorOpenId")::text = (select auth.uid())::text or is_admin());

drop policy if exists "freedom reviews admin or actor" on public."editorialFreedomReviews";
create policy "freedom reviews admin or actor" on public."editorialFreedomReviews"
for select to authenticated
using (is_admin() or ("actorOpenId")::text = (select auth.uid())::text);

drop policy if exists "research context actor insert" on public."editorialResearchContexts";
create policy "research context actor insert" on public."editorialResearchContexts"
for insert to authenticated
with check (("actorOpenId") = (select auth.uid())::text or is_admin());

drop policy if exists "research context admin or actor" on public."editorialResearchContexts";
create policy "research context admin or actor" on public."editorialResearchContexts"
for select to authenticated
using (is_admin() or ("actorOpenId") = (select auth.uid())::text);

drop policy if exists "users read own" on public.users;
create policy "users read own" on public.users
for select to authenticated
using (("openId" = (select auth.uid())::text) or is_admin());

create index if not exists "viewEvents_article_visitor_time_idx"
on public."viewEvents" ("articleId", "visitorId", "viewedAtMs");