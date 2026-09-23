-- PCH News SEO fields
alter table public."articles" add column if not exists "slug" text;
alter table public."articles" add column if not exists "seoTitle" text;
alter table public."articles" add column if not exists "metaDescription" text;
alter table public."articles" add column if not exists "canonicalUrl" text;
alter table public."articles" add column if not exists "focusKeyword" text;
alter table public."articles" add column if not exists "ogTitle" text;
alter table public."articles" add column if not exists "ogDescription" text;
alter table public."articles" add column if not exists "imageAlt" text;
alter table public."articles" add column if not exists "noindex" boolean not null default false;
create index if not exists "articles_slug_idx" on public."articles" ("slug");
