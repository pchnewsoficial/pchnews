begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- 1) Every public table must keep RLS enabled.
select is(
  (select count(*)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and c.relrowsecurity),
  (select count(*)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'),
  'all public tables have RLS enabled'
);

-- 2) The five currently unused internal tables remain closed by default.
select is(
  (select count(*)
   from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in (
       'adCampaigns',
       'advertisers',
       'columnistResponsibilityAcceptances',
       'editorialTerms',
       'partners'
     )),
  0::bigint,
  'unused internal tables have no RLS policies and therefore remain closed'
);

-- 3-6) Core editorial tables must have at least one policy.
select ok(
  (select count(*) from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname='public' and c.relname='articles') > 0,
  'articles has RLS policies'
);

select ok(
  (select count(*) from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname='public' and c.relname='users') > 0,
  'users has RLS policies'
);

select ok(
  (select count(*) from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname='public' and c.relname='adRequests') > 0,
  'adRequests has RLS policies'
);

select ok(
  (select count(*) from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname='public' and c.relname='editorialMembers') > 0,
  'editorialMembers has RLS policies'
);

-- 7) The legacy public admin helper must not be executable by authenticated users.
select ok(
  not has_function_privilege(
    'authenticated',
    'public.is_admin()'::regprocedure,
    'EXECUTE'
  ),
  'authenticated cannot execute public.is_admin()'
);

-- 8) The replacement private helper must remain SECURITY DEFINER.
select ok(
  (select p.prosecdef
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='private'
     and p.proname='is_admin'
   limit 1),
  'private.is_admin() remains SECURITY DEFINER'
);

select * from finish();
rollback;
