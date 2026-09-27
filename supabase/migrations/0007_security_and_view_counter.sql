-- PCH News: secure public view counter
-- Keeps the public counter callable by readers while hardening its inputs and
-- preventing view increments on non-published content.

-- Authenticated-user synchronization is managed by later auth-hardening
-- migrations; this migration must not assume the legacy RPC exists.

create or replace function public.increment_article_view(
  p_article_id varchar,
  p_visitor_id varchar
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  existing_count integer;
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

  select "views"
    into current_views
    from public."articles"
   where "id" = p_article_id
     and "status" = 'published';

  if current_views is null then
    return jsonb_build_object('counted', false, 'views', 0);
  end if;

  select count(*)
    into existing_count
    from public."viewEvents"
   where "articleId" = p_article_id
     and "visitorId" = p_visitor_id
     and "viewedAtMs" > (extract(epoch from now()) * 1000)::bigint - 1800000;

  if existing_count > 0 then
    return jsonb_build_object('counted', false, 'views', current_views);
  end if;

  insert into public."viewEvents"("id", "articleId", "visitorId", "viewedAtMs")
  values (
    'view-' || extract(epoch from clock_timestamp())::bigint || '-' ||
      substr(md5(random()::text), 1, 8),
    p_article_id,
    p_visitor_id,
    (extract(epoch from now()) * 1000)::bigint
  );

  update public."articles"
     set "views" = "views" + 1,
         "updatedAt" = now()
   where "id" = p_article_id
     and "status" = 'published'
   returning "views" into current_views;

  return jsonb_build_object(
    'counted', true,
    'views', coalesce(current_views, 0)
  );
end;
$function$;

revoke all on function public.increment_article_view(varchar, varchar) from public;
grant execute on function public.increment_article_view(varchar, varchar) to anon, authenticated;
