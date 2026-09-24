-- PCH News: pauta inteligente / newsroom desk
create table if not exists public."editorialPautas" (
  id text primary key,
  title text not null,
  angle text not null default '',
  briefing text not null default '',
  category varchar(120) not null default 'Brasil',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'idea' check (status in ('idea','planned','assigned','reporting','review','ready','published','archived')),
  "assignedToOpenId" text null,
  "assignedToName" text null,
  "deadlineAtMs" bigint null,
  "plannedPublishAtMs" bigint null,
  tags text not null default '[]',
  "sourcesJson" jsonb not null default '[]'::jsonb,
  "checklistJson" jsonb not null default '[]'::jsonb,
  "articleId" text null references public.articles(id) on delete set null,
  "createdByOpenId" text not null,
  "createdByName" text null,
  "createdAtMs" bigint not null,
  "updatedAtMs" bigint not null
);

create index if not exists "editorialPautas_status_priority_idx"
  on public."editorialPautas" (status, priority);
create index if not exists "editorialPautas_deadline_idx"
  on public."editorialPautas" ("deadlineAtMs");
create index if not exists "editorialPautas_assigned_idx"
  on public."editorialPautas" ("assignedToOpenId");
create index if not exists "editorialPautas_article_idx"
  on public."editorialPautas" ("articleId");

alter table public."editorialPautas" enable row level security;

drop policy if exists "pautas admin or participant" on public."editorialPautas";
create policy "pautas admin or participant"
  on public."editorialPautas"
  for all
  to authenticated
  using (
    is_admin()
    or "createdByOpenId" = (select auth.uid())::text
    or "assignedToOpenId" = auth.uid()::text
  )
  with check (
    is_admin()
    or "createdByOpenId" = auth.uid()::text
    or "assignedToOpenId" = auth.uid()::text
  );
