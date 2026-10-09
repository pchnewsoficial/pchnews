-- Preserve the original publication timestamp for Google News and Article structured data.
alter table public.articles
  add column if not exists "publishedAt" timestamptz;

-- Existing published articles predate this field; use their creation timestamp as
-- the best available historical approximation. New publications set it at publish time.
update public.articles
set "publishedAt" = coalesce("publishedAt", "createdAt", now())
where status in ('published', 'updated') and "publishedAt" is null;

create index if not exists "articles_publishedAt_idx"
  on public.articles ("publishedAt" desc)
  where status in ('published', 'updated');
