alter table public."columnistInvites" add column if not exists slug text;

update public."columnistInvites"
set slug = trim(both '-' from regexp_replace(lower(translate(name, 'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇáàãâäéèêëíìîïóòõôöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

create unique index if not exists columnist_invites_slug_unique on public."columnistInvites"(slug);
