-- Align the clean local Supabase schema with the editorial distribution fields
-- already used by the PCH News article seed and production API.
alter table public.articles
  add column if not exists scope text not null default 'national',
  add column if not exists region text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists language text not null default 'pt-BR',
  add column if not exists featured boolean not null default false,
  add column if not exists "sourceUrl" text,
  add column if not exists "sourceName" text;
