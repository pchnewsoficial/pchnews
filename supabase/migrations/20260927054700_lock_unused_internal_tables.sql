-- Lock unused internal tables. Some of these exist only in production (never versioned),
-- so revoke conditionally to keep fresh databases (CI / local) migrating cleanly.
do $$
declare
  t text;
begin
  foreach t in array array['adCampaigns','advertisers','columnistResponsibilityAcceptances','editorialTerms','partners'] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end;
$$;
