-- Harden editorial member RLS evaluation and remove an unused public RPC grant.
drop policy if exists "editorial members self read" on public."editorialMembers";
create policy "editorial members self read" on public."editorialMembers"
for select to authenticated
using ("openId" = (select auth.uid())::text);

revoke execute on function public.set_editorial_member_role(text,text) from authenticated;
revoke execute on function public.set_editorial_member_role(text,text) from anon;
grant execute on function public.set_editorial_member_role(text,text) to service_role;
