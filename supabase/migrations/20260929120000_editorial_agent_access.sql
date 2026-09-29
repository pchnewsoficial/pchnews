create table if not exists public."editorialAgentAccess" (
  id text primary key,
  "agentId" text not null,
  role text not null,
  enabled boolean not null default false,
  "updatedAtMs" bigint not null,
  unique ("agentId", role)
);

alter table public."editorialAgentAccess" enable row level security;

insert into public."editorialAgentAccess" (id, "agentId", role, enabled, "updatedAtMs")
values
  ('access-all-admin', '*', 'admin', true, (extract(epoch from now()) * 1000)::bigint),
  ('access-all-editor', '*', 'editor', false, (extract(epoch from now()) * 1000)::bigint),
  ('access-all-journalist', '*', 'journalist', false, (extract(epoch from now()) * 1000)::bigint),
  ('access-all-columnist', '*', 'columnist', false, (extract(epoch from now()) * 1000)::bigint),
  ('access-all-reviewer', '*', 'reviewer', false, (extract(epoch from now()) * 1000)::bigint)
on conflict ("agentId", role) do nothing;
