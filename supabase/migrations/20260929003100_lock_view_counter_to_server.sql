-- PCH News: view increments are server-only.
-- Public article openings are recorded by the Cloudflare Worker with the service-role client.
-- Do not expose the SECURITY DEFINER RPC directly to browser clients.

revoke execute on function public.increment_article_view(varchar, varchar) from public;
revoke execute on function public.increment_article_view(varchar, varchar) from anon;
revoke execute on function public.increment_article_view(varchar, varchar) from authenticated;
grant execute on function public.increment_article_view(varchar, varchar) to service_role;
