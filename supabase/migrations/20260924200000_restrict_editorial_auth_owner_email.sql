-- Editorial authentication hardening: only the PCH News owner email receives automatic admin role.
create or replace function public.sync_authenticated_user(p_name text, p_email text, p_login_method text)
returns public.users
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_open_id text := auth.uid()::text;
  v_role text;
  v_user public."users";
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_open_id is null then raise exception 'Authentication required'; end if;
  select "role" into v_role from public."users" where "openId" = v_open_id;
  if v_role is null then
    if v_email = 'pchnews.oficial@gmail.com' then v_role := 'admin'; else v_role := 'user'; end if;
  end if;
  insert into public."users" ("openId","name","email","loginMethod","role","lastSignedIn")
  values (v_open_id,p_name,p_email,p_login_method,v_role,now())
  on conflict ("openId") do update set
    "name"=excluded."name","email"=excluded."email","loginMethod"=excluded."loginMethod","lastSignedIn"=now();
  select * into v_user from public."users" where "openId"=v_open_id;
  return v_user;
end;
$function$;

create unique index if not exists users_admin_email_unique
on public."users" (lower("email"))
where lower("email") = 'pchnews.oficial@gmail.com';

update public."users" set "role"='admin' where lower("email")='pchnews.oficial@gmail.com';
