-- PCH News: harden authenticated user sync against caller-controlled role escalation.
-- The authenticated email used for authorization must come from auth.users,
-- never from a client-supplied RPC argument.
create or replace function public.sync_authenticated_user(
  p_name text,
  p_email text,
  p_login_method text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_open_id text := auth.uid()::text;
  v_authenticated_email text;
  v_role text;
  v_user public."users";
begin
  if v_open_id is null then
    raise exception 'Authentication required';
  end if;

  select lower(trim(u.email))
    into v_authenticated_email
  from auth.users u
  where u.id = auth.uid();

  if v_authenticated_email is null then
    raise exception 'Authenticated email unavailable';
  end if;

  select "role"
    into v_role
  from public."users"
  where "openId" = v_open_id;

  if v_role is null then
    if v_authenticated_email = 'pchnews.oficial@gmail.com' then
      v_role := 'admin';
    else
      v_role := 'user';
    end if;
  end if;

  insert into public."users" ("openId","name","email","loginMethod","role","lastSignedIn")
  values (
    v_open_id,
    p_name,
    v_authenticated_email,
    p_login_method,
    v_role,
    now()
  )
  on conflict ("openId") do update set
    "name" = excluded."name",
    "email" = excluded."email",
    "loginMethod" = excluded."loginMethod",
    "lastSignedIn" = now();

  select * into v_user
  from public."users"
  where "openId" = v_open_id;

  return v_user;
end;
$function$;

revoke execute on function public.sync_authenticated_user(text, text, text) from public;
revoke execute on function public.sync_authenticated_user(text, text, text) from anon;
grant execute on function public.sync_authenticated_user(text, text, text) to authenticated;
