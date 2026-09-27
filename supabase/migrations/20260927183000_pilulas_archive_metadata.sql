-- PCH News: metadata for the Pílulas do Poeta archive.
alter table public.articles add column if not exists "editionNumber" integer;
alter table public.articles add column if not exists "authorProfileSlug" text;
create index if not exists "articles_contentType_editionNumber_idx"
  on public.articles ("contentType", "editionNumber");
