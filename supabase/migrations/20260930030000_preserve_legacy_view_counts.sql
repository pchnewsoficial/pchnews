-- Preserve historical HostingPRESS views separately from live PCH News views.
alter table public."articles"
  add column if not exists "legacyViews" integer not null default 0;

alter table public."articles"
  add constraint "articles_legacyViews_nonnegative"
  check ("legacyViews" >= 0);

create or replace function public.increment_article_view(
  p_article_id varchar,
  p_visitor_id varchar
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_views integer;
begin
  if p_article_id is null or length(trim(p_article_id)) = 0 then
    raise exception 'Article id is required';
  end if;

  if p_visitor_id is null
     or length(trim(p_visitor_id)) < 8
     or length(p_visitor_id) > 128 then
    raise exception 'Invalid visitor id';
  end if;

  select a."views"
    into current_views
    from public."articles" a
   where a."id" = p_article_id
     and a."status" in ('published', 'updated');

  if current_views is null then
    return jsonb_build_object('counted', false, 'views', 0);
  end if;

  insert into public."viewEvents"("id", "articleId", "visitorId", "viewedAtMs")
  values (
    'view-' || extract(epoch from clock_timestamp())::bigint || '-' ||
      substr(md5(random()::text), 1, 8),
    p_article_id,
    p_visitor_id,
    (extract(epoch from now()) * 1000)::bigint
  );

  update public."articles" a
     set "views" = coalesce(a."views", 0) + 1,
         "updatedAt" = now()
   where a."id" = p_article_id
     and a."status" in ('published', 'updated')
   returning a."views" into current_views;

  return jsonb_build_object(
    'counted', true,
    'views', coalesce(current_views, 0)
  );
end;
$function$;

revoke all on function public.increment_article_view(varchar, varchar) from public;
grant execute on function public.increment_article_view(varchar, varchar) to service_role;

-- Administrative baseline import: never lowers an article's current live count.
create or replace function public.set_article_legacy_views(
  p_article_id varchar,
  p_legacy_views integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_views integer;
  applied_legacy integer;
begin
  if p_article_id is null or length(trim(p_article_id)) = 0 then
    raise exception 'Article id is required';
  end if;

  if p_legacy_views is null or p_legacy_views < 0 then
    raise exception 'Legacy views must be a non-negative integer';
  end if;

  update public."articles" a
     set "legacyViews" = p_legacy_views,
         "views" = greatest(coalesce(a."views", 0), p_legacy_views),
         "updatedAt" = now()
   where a."id" = p_article_id
   returning a."views", a."legacyViews"
    into current_views, applied_legacy;

  if current_views is null then
    return jsonb_build_object('updated', false, 'views', 0, 'legacyViews', 0);
  end if;

  return jsonb_build_object(
    'updated', true,
    'views', current_views,
    'legacyViews', applied_legacy
  );
end;
$function$;

revoke all on function public.set_article_legacy_views(varchar, integer) from public;
grant execute on function public.set_article_legacy_views(varchar, integer) to service_role;