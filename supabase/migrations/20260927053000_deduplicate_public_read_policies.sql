-- PCH News: remove redundant public read policies.
-- The remaining public read policies already cover the same rows:
-- articles: published/updated + schedule gate
-- columnist profiles: public read
-- comments: approved only
drop policy if exists "public read published articles" on public.articles;
drop policy if exists "public read columnist profiles" on public."columnistProfiles";
drop policy if exists "public read approved comments" on public.comments;
