-- PCH News: remove public execution of the legacy authenticated-user sync RPC.
-- User synchronization is now performed by the server-only Supabase service-role
-- client after the Supabase Auth token has been validated.
revoke all on function public.sync_authenticated_user(text, text, text) from public, anon, authenticated;

-- Article view counting remains intentionally callable by anonymous readers.
-- Authenticated readers do not need direct execution of the SECURITY DEFINER RPC.
revoke execute on function public.increment_article_view(varchar, varchar) from authenticated;
grant execute on function public.increment_article_view(varchar, varchar) to anon;
