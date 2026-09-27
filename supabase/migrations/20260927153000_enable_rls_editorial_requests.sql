-- PCH News: editorialRequests stores personal data (name, e-mail, phone) and was
-- created without RLS. Enable it and keep the current app behaviour:
--   * anyone (anon/authenticated) may submit a new pending request;
--   * only admins may read and answer requests.
alter table public."editorialRequests" enable row level security;

drop policy if exists "editorial requests public insert" on public."editorialRequests";
create policy "editorial requests public insert"
  on public."editorialRequests" for insert to anon, authenticated
  with check (
    status = 'pending'
    and "assignedToOpenId" is null
    and "responseText" is null
    and "respondedByOpenId" is null
    and "respondedAtMs" is null
  );

drop policy if exists "editorial requests admin read" on public."editorialRequests";
create policy "editorial requests admin read"
  on public."editorialRequests" for select to authenticated
  using ((select private.is_admin()));

drop policy if exists "editorial requests admin update" on public."editorialRequests";
create policy "editorial requests admin update"
  on public."editorialRequests" for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
