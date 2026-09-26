-- PCH News: remove public execution of the legacy authenticated-user sync RPC.
-- User synchronization is performed by the server after Supabase Auth validation.
revoke all on function public.sync_authenticated_user(text, text, text) from public, anon, authenticated;

-- Article view counting remains intentionally callable by anonymous readers.
revoke execute on function public.increment_article_view(varchar, varchar) from authenticated;
grant execute on function public.increment_article_view(varchar, varchar) to anon;
