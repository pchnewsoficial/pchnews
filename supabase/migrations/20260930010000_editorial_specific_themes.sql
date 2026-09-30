-- PCH News: managed specific editorial themes.
create table if not exists public."editorialSubthemes" (
  "id" uuid primary key default gen_random_uuid(),
  "label" text not null,
  "slug" text not null unique,
  "parentCategory" text not null default 'Saúde & Bem-Estar',
  "sortOrder" integer not null default 0,
  "active" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."editorialSubthemes" enable row level security;

drop policy if exists "specific themes public read" on public."editorialSubthemes";
create policy "specific themes public read"
  on public."editorialSubthemes"
  for select
  to anon, authenticated
  using ("active" = true);

drop policy if exists "specific themes admin manage" on public."editorialSubthemes";
create policy "specific themes admin manage"
  on public."editorialSubthemes"
  for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

insert into public."editorialSubthemes" ("label","slug","parentCategory","sortOrder")
values
  ('Terapia e Bem-Estar','terapia-e-bem-estar','Saúde & Bem-Estar',10),
  ('Saúde','saude','Saúde & Bem-Estar',20),
  ('Reestruturação Familiar','reestruturacao-familiar','Comportamento e Sociedade',30),
  ('Startups e Inovação','startups-e-inovacao','Economia',40),
  ('Criptomoedas e Blockchain','criptomoedas-e-blockchain','Economia',50),
  ('Tecnologia','tecnologia','Tecnologia',60),
  ('Inteligência Artificial','inteligencia-artificial','Tecnologia',70),
  ('Empreendedorismo','empreendedorismo','Economia',80),
  ('Educação','educacao','Brasil',90),
  ('Finanças e Investimentos','financas-e-investimentos','Economia',100),
  ('Direito e Cidadania','direito-e-cidadania','Lei & Justiça',110),
  ('Comportamento e Sociedade','comportamento-e-sociedade','Sociedade',120)
on conflict ("slug") do update set
  "label" = excluded."label",
  "parentCategory" = excluded."parentCategory",
  "sortOrder" = excluded."sortOrder",
  "updatedAt" = now();

update public."editorialSubthemes"
set "active" = false, "updatedAt" = now()
where "slug" = 'noticias-da-lei';

create index if not exists "editorialSubthemes_active_order_idx"
  on public."editorialSubthemes" ("active","sortOrder");
