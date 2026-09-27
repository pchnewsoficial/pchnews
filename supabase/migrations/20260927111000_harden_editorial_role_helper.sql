-- PCH News: harden the internal editorial role helper.
-- Keep the authorization helper in the private schema and pin its search_path.
create schema if not exists private;

create or replace function private.has_editorial_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u."openId" = (select auth.uid())::text
      and u."role" = any(coalesce(required_roles, '{}'::text[]))
  );
$$;

revoke all on function private.has_editorial_role(text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_editorial_role(text[]) to authenticated;
