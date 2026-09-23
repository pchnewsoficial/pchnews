-- PCH News editorial agent runs
create table if not exists public."editorialAgentRuns" (
  id text primary key,
  "articleId" text not null,
  "agentId" text not null,
  "agentName" text not null,
  status text not null check (status in ('pass','review','block')),
  findings jsonb not null default '[]'::jsonb,
  output jsonb not null default '{}'::jsonb,
  "actorOpenId" text not null,
  "createdAtMs" bigint not null
);

create index if not exists "editorialAgentRuns_articleId_createdAtMs_idx"
  on public."editorialAgentRuns" ("articleId", "createdAtMs" desc);

create index if not exists "editorialAgentRuns_agentId_createdAtMs_idx"
  on public."editorialAgentRuns" ("agentId", "createdAtMs" desc);

alter table public."editorialAgentRuns" enable row level security;
