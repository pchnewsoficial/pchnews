create table if not exists public.events (
  id varchar(96) primary key,
  title varchar(220) not null,
  description text not null,
  "eventType" varchar(80) not null,
  organizer varchar(180) not null,
  contact varchar(240) not null,
  "startAtMs" bigint not null,
  "endAtMs" bigint,
  venue varchar(220) not null,
  address varchar(320) not null,
  city varchar(120) not null,
  state varchar(80) not null,
  country varchar(80) not null default 'Brasil',
  latitude varchar(32),
  longitude varchar(32),
  image text,
  website text,
  price varchar(120),
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  "createdAtMs" bigint not null,
  "updatedAtMs" bigint not null
);
create index if not exists idx_events_status_start on public.events(status,"startAtMs");
create index if not exists idx_events_geo on public.events(country,state,city);
alter table public.events enable row level security;
create policy "public read approved events" on public.events for select to anon,authenticated using(status='approved');
create policy "public submit events" on public.events for insert to anon,authenticated with check(status='pending');
create policy "editorial manage events" on public.events for update to authenticated using(private.has_editorial_role(array['admin'::text])) with check(private.has_editorial_role(array['admin'::text]));