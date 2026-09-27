-- Schema drift repair: editorialMembers and set_editorial_member_role were created
-- directly in production and never versioned. Recreate them idempotently so fresh
-- databases (CI / local `supabase start`) can apply the migration chain.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('user','admin','editor','journalist','columnist','reviewer'));

create table if not exists public."editorialMembers" (
  "openId" text primary key references public.users("openId") on delete cascade,
  "displayName" text not null,
  role text not null default 'journalist'
    check (role in ('admin','editor','journalist','columnist','reviewer')),
  status text not null default 'active',
  beat text,
  "profileSlug" text,
  "createdAtMs" bigint not null,
  "updatedAtMs" bigint not null
);

alter table public."editorialMembers" enable row level security;

create or replace function public.set_editorial_member_role(p_target_open_id text, p_role text)
returns public."editorialMembers"
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_member public."editorialMembers";
begin
  if coalesce(auth.role(), '') <> 'service_role' and not private.has_editorial_role(array['admin']::text[]) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.users set role = p_role where "openId" = p_target_open_id;
  if not found then
    raise exception 'Usuário não encontrado.' using errcode = 'P0002';
  end if;

  insert into public."editorialMembers" ("openId", "displayName", role, "createdAtMs", "updatedAtMs")
  select u."openId", coalesce(u.name, 'Membro editorial'), p_role, v_now, v_now
  from public.users u
  where u."openId" = p_target_open_id
  on conflict ("openId") do update
    set role = excluded.role, "updatedAtMs" = excluded."updatedAtMs"
  returning * into v_member;

  return v_member;
end;
$$;

-- Harden editorial member RLS evaluation and remove an unused public RPC grant.
drop policy if exists "editorial members self read" on public."editorialMembers";
create policy "editorial members self read" on public."editorialMembers"
for select to authenticated
using ("openId" = (select auth.uid())::text);

revoke execute on function public.set_editorial_member_role(text,text) from authenticated;
revoke execute on function public.set_editorial_member_role(text,text) from anon;
grant execute on function public.set_editorial_member_role(text,text) to service_role;
