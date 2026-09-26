-- Public view tracking is executed server-side through the Cloudflare Worker.
-- Anonymous clients must not be able to invoke the SECURITY DEFINER RPC directly.
revoke execute on function public.increment_article_view(varchar, varchar) from anon;
revoke execute on function public.increment_article_view(varchar, varchar) from public;
grant execute on function public.increment_article_view(varchar, varchar) to service_role;
