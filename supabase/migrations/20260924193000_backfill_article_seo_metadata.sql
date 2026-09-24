-- PCH News: backfill SEO metadata for existing editorial articles.
-- Safe/idempotent: only fills empty fields and never overwrites editor-entered metadata.

update public.articles
set
  "seoTitle" = coalesce(nullif(btrim("seoTitle"), ''), left(btrim(title), 70)),
  "metaDescription" = coalesce(
    nullif(btrim("metaDescription"), ''),
    left(btrim(case when coalesce(summary, '') <> '' then summary else title end), 160)
  ),
  "ogTitle" = coalesce(nullif(btrim("ogTitle"), ''), left(btrim(title), 70)),
  "ogDescription" = coalesce(
    nullif(btrim("ogDescription"), ''),
    left(btrim(case when coalesce(summary, '') <> '' then summary else title end), 160)
  ),
  "imageAlt" = coalesce(nullif(btrim("imageAlt"), ''), left(btrim(title), 120)),
  "updatedAt" = now()
where
  "seoTitle" is null or btrim("seoTitle") = ''
  or "metaDescription" is null or btrim("metaDescription") = ''
  or "ogTitle" is null or btrim("ogTitle") = ''
  or "ogDescription" is null or btrim("ogDescription") = ''
  or "imageAlt" is null or btrim("imageAlt") = '';
