-- PCH News: harden the internal editorial role helper.
-- Keep the authorization helper in the private schema and pin its search_path.
-- The input parameter name is preserved from any existing definition, because
-- CREATE OR REPLACE cannot rename parameters and RLS policies depend on it.
create schema if not exists private;

do $do$
declare
  v_arg text := 'required_roles';
begin
  select coalesce(p.proargnames[1], 'required_roles')
    into v_arg
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'has_editorial_role'
    and p.proargtypes = '1009'::oidvector; -- text[]

  execute format($f$
    create or replace function private.has_editorial_role(%1$I text[])
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $body$
      select exists (
        select 1
        from public.users u
        where u."openId" = (select auth.uid())::text
          and u."role" = any(coalesce($1, '{}'::text[]))
      );
    $body$
  $f$, coalesce(v_arg, 'required_roles'));
end;
$do$;

revoke all on function private.has_editorial_role(text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_editorial_role(text[]) to authenticated;
