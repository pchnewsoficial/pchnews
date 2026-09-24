-- PCH News production repair: media bucket, storage RLS and article slugs.
-- Safe to run repeatedly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pch media public read" on storage.objects;
create policy "pch media public read"
on storage.objects for select
to public
using (bucket_id = 'media');

drop policy if exists "pch media editors upload" on storage.objects;
create policy "pch media editors upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'media'
  and exists (
    select 1
    from public."users" u
    where u."openId" = (select auth.uid())::text
      and u."role" in ('admin','columnist')
  )
);

drop policy if exists "pch media editors update" on storage.objects;
create policy "pch media editors update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public."users" u
    where u."openId" = (select auth.uid())::text
      and u."role" in ('admin','columnist')
  )
)
with check (
  bucket_id = 'media'
  and exists (
    select 1
    from public."users" u
    where u."openId" = (select auth.uid())::text
      and u."role" in ('admin','columnist')
  )
);

drop policy if exists "pch media editors delete" on storage.objects;
create policy "pch media editors delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public."users" u
    where u."openId" = (select auth.uid())::text
      and u."role" in ('admin','columnist')
  )
);

create index if not exists idx_editorial_freedom_article_time
on public."editorialFreedomReviews" ("articleId","createdAtMs");

update public.articles
set slug = trim(
  both '-' from regexp_replace(
    lower(translate(
      title,
      'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    )),
    '[^a-z0-9]+',
    '-',
    'g'
  )
)
where slug is null or trim(slug) = '';

create unique index if not exists idx_articles_slug_unique
on public.articles (slug)
where slug is not null and slug <> '';
