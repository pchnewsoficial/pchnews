-- Public read policies for the PCH News public site.
-- Only already-published editorial content is exposed to anon clients.
-- Sensitive editorial workflow fields remain inaccessible to anon because the
-- public API selects an explicit safe column set for articles.

create policy "public published articles read"
on public.articles
for select to anon, authenticated
using (
  status = 'published'
  and ("scheduledAt" is null or "scheduledAt" <= (extract(epoch from now()) * 1000)::bigint)
);

create policy "public approved comments read"
on public.comments
for select to anon, authenticated
using (status = 'approved');

create policy "public columnist profiles read"
on public."columnistProfiles"
for select to anon, authenticated
using (true);
