-- Add a dedicated YouTube channel field to public columnist profiles.
alter table public."columnistProfiles"
  add column if not exists "youtube" text not null default '';
