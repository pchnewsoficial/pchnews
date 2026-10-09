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

-- Keep the immutable first-publication timestamp correct for every writer
-- (editor, import/sync, scheduled publishing, or administrative maintenance).
create or replace function public.set_article_first_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('published', 'updated') and new."publishedAt" is null then
    if tg_op = 'UPDATE' and old."publishedAt" is not null then
      new."publishedAt" := old."publishedAt";
    else
      new."publishedAt" := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_set_first_published_at on public.articles;
create trigger articles_set_first_published_at
before insert or update on public.articles
for each row execute function public.set_article_first_published_at();
