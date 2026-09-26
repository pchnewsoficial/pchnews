-- Agenda PCH News: monetization-ready foundation.
-- Payments remain OFF until explicitly enabled and a provider is configured.

create table if not exists public.agenda_monetization_settings (
  id integer primary key default 1 check (id = 1),
  "enabled" boolean not null default false,
  "provider" text not null default 'stripe' check ("provider" in ('stripe')),
  "currency" char(3) not null default 'BRL',
  "featuredPriceCents" integer,
  "sponsoredPriceCents" integer,
  "updatedAtMs" bigint not null default (extract(epoch from now()) * 1000)::bigint
);

insert into public.agenda_monetization_settings (id, enabled, provider, currency)
values (1, false, 'stripe', 'BRL')
on conflict (id) do nothing;

create table if not exists public.event_promotions (
  id varchar(96) primary key,
  "eventId" varchar(96) not null references public.events(id) on delete cascade,
  "promotionType" text not null check ("promotionType" in ('featured','sponsored')),
  status text not null default 'draft'
    check (status in ('draft','pending_payment','paid','active','expired','cancelled','refunded')),
  "amountCents" integer not null check ("amountCents" >= 0),
  currency char(3) not null default 'BRL',
  provider text not null default 'stripe' check (provider in ('stripe')),
  "checkoutSessionId" varchar(255),
  "paymentReference" varchar(255),
  "startsAtMs" bigint,
  "endsAtMs" bigint,
  "paidAtMs" bigint,
  "createdAtMs" bigint not null,
  "updatedAtMs" bigint not null
);

create index if not exists idx_event_promotions_event
  on public.event_promotions("eventId","status");

create index if not exists idx_event_promotions_active
  on public.event_promotions(status,"startsAtMs","endsAtMs");

alter table public.agenda_monetization_settings enable row level security;
alter table public.event_promotions enable row level security;

drop policy if exists "public read agenda monetization" on public.agenda_monetization_settings;
drop policy if exists "editorial manage agenda monetization" on public.agenda_monetization_settings;
drop policy if exists "editorial manage event promotions" on public.event_promotions;

create policy "public read agenda monetization"
  on public.agenda_monetization_settings for select to anon, authenticated
  using (true);

create policy "editorial manage agenda monetization"
  on public.agenda_monetization_settings for all to authenticated
  using (private.has_editorial_role(array['admin'::text]))
  with check (private.has_editorial_role(array['admin'::text]));

create policy "editorial manage event promotions"
  on public.event_promotions for all to authenticated
  using (private.has_editorial_role(array['admin'::text]))
  with check (private.has_editorial_role(array['admin'::text]));
