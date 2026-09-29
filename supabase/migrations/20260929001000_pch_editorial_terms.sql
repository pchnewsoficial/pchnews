-- PCH News: acceptance records for confidentiality and editorial partnership terms.
alter table public."columnistInvites"
  add column if not exists "partnershipAcceptedAtMs" bigint,
  add column if not exists "partnershipVersion" text,
  add column if not exists "confidentialityAcceptedAtMs" bigint,
  add column if not exists "confidentialityVersion" text,
  add column if not exists "termsAcceptedIp" text,
  add column if not exists "termsAcceptedUserAgent" text,
  add column if not exists "termsAcceptedTermsId" text;
