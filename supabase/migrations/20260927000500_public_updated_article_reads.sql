-- Keep public editorial reads aligned with the frontend's published/updated lifecycle.
drop policy if exists "public published articles read" on public.articles;
create policy "public published articles read"
on public.articles
for select to anon, authenticated
using (
  status in ('published','updated')
  and ("scheduledAt" is null or "scheduledAt" <= (extract(epoch from now()) * 1000)::bigint)
);
