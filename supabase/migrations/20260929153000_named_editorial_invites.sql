alter table public."columnistInvites" add column if not exists slug text;

update public."columnistInvites"
set slug = trim(both '-' from regexp_replace(lower(translate(name, 'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇáàãâäéèêëíìîïóòõôöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

with duplicates as (
  select id, slug, row_number() over (partition by slug order by "createdAtMs", id) as rn
  from public."columnistInvites"
  where slug is not null and slug <> ''
)
update public."columnistInvites" i
set slug = d.slug || '-' || right(regexp_replace(d.id, '[^a-zA-Z0-9]', '', 'g'), 6)
from duplicates d
where i.id = d.id and d.rn > 1;

create unique index if not exists columnist_invites_active_slug_unique
  on public."columnistInvites"(slug)
  where "acceptedAtMs" is null and "revokedAtMs" is null;
