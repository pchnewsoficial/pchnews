alter table public.articles
  add column if not exists "contentType" text not null default 'noticia'
    check ("contentType" = any (array['noticia','reportagem','analise','coluna','pilula','entrevista','patrocinado'])),
  add column if not exists "editorialChecklist" jsonb not null default '{}'::jsonb,
  add column if not exists "editorialNotes" text,
  add column if not exists "contraponto" text,
  add column if not exists "keyTakeaway" text;
