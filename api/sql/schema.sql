-- DonorTally Schema
-- PostgreSQL 13+

-- ENUM types

CREATE TYPE donor_contact_type  AS ENUM ('email', 'phone', 'mobile');
CREATE TYPE donor_contact_label AS ENUM ('home', 'work', 'other');
CREATE TYPE donation_status     AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE group_entity_type   AS ENUM ('donor', 'donation');

-- organization
-- createdById / updatedById FKs are added after "user" is created (circular dependency)

CREATE TABLE organization (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR      NOT NULL,
  slug          VARCHAR      NOT NULL UNIQUE,
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "createdById" UUID,
  "updatedById" UUID,
  "createdAt"   TIMESTAMPTZ  NOT NULL,
  "updatedAt"   TIMESTAMPTZ  NOT NULL
);

-- user

CREATE TABLE "user" (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR      NOT NULL UNIQUE,
  password         VARCHAR      NOT NULL,
  "firstName"      VARCHAR      NOT NULL,
  "lastName"       VARCHAR      NOT NULL,
  "isSuperAdmin"   BOOLEAN      NOT NULL DEFAULT false,
  "isActive"       BOOLEAN      NOT NULL DEFAULT true,
  "organizationId" UUID         NOT NULL REFERENCES organization (id),
  "createdById"    UUID         REFERENCES "user" (id),
  "updatedById"    UUID         REFERENCES "user" (id),
  "createdAt"      TIMESTAMPTZ  NOT NULL,
  "updatedAt"      TIMESTAMPTZ  NOT NULL
);

-- resolve circular dependency: organization -> user

ALTER TABLE organization
  ADD CONSTRAINT fk_organization_created_by FOREIGN KEY ("createdById") REFERENCES "user" (id),
  ADD CONSTRAINT fk_organization_updated_by FOREIGN KEY ("updatedById") REFERENCES "user" (id);

-- donor

CREATE TABLE donor (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "donorId"          VARCHAR,
  title              VARCHAR,
  "firstName"        VARCHAR      NOT NULL,
  "lastName"         VARCHAR      NOT NULL,
  "organizationName" VARCHAR,
  address1           VARCHAR,
  address2           VARCHAR,
  city               VARCHAR,
  state              VARCHAR,
  "postalCode"       VARCHAR,
  "organizationId"   UUID         NOT NULL REFERENCES organization (id),
  "createdById"      UUID         REFERENCES "user" (id),
  "updatedById"      UUID         REFERENCES "user" (id),
  "createdAt"        TIMESTAMPTZ  NOT NULL,
  "updatedAt"        TIMESTAMPTZ  NOT NULL
);

CREATE UNIQUE INDEX donor_donor_id_organization_id_unique ON donor ("donorId", "organizationId");

-- donor_contact

CREATE TABLE donor_contact (
  id            UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  "donorId"     UUID                 NOT NULL REFERENCES donor (id) ON DELETE CASCADE,
  type          donor_contact_type   NOT NULL,
  label         donor_contact_label  NOT NULL,
  value         VARCHAR              NOT NULL,
  "createdById" UUID                 REFERENCES "user" (id),
  "updatedById" UUID                 REFERENCES "user" (id),
  "createdAt"   TIMESTAMPTZ          NOT NULL,
  "updatedAt"   TIMESTAMPTZ          NOT NULL
);

-- campaign

CREATE TABLE campaign (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR       NOT NULL,
  description      TEXT,
  "startDate"      DATE,
  "endDate"        DATE,
  "goalAmount"     DECIMAL(12,2),
  "isActive"       BOOLEAN       NOT NULL DEFAULT true,
  "organizationId" UUID          NOT NULL REFERENCES organization (id),
  "createdById"    UUID          REFERENCES "user" (id),
  "updatedById"    UUID          REFERENCES "user" (id),
  "createdAt"      TIMESTAMPTZ   NOT NULL,
  "updatedAt"      TIMESTAMPTZ   NOT NULL
);

-- donation

CREATE TABLE donation (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  amount           DECIMAL(12,2)    NOT NULL,
  currency         VARCHAR(3)       NOT NULL DEFAULT 'USD',
  "donationDate"   DATE             NOT NULL,
  status           donation_status  NOT NULL DEFAULT 'completed',
  notes            TEXT,
  "acknowledgedAt" TIMESTAMPTZ,
  "organizationId" UUID             NOT NULL REFERENCES organization (id),
  "donorId"        UUID             NOT NULL REFERENCES donor (id),
  "campaignId"     UUID             REFERENCES campaign (id) ON DELETE SET NULL,
  "createdById"    UUID             REFERENCES "user" (id),
  "updatedById"    UUID             REFERENCES "user" (id),
  "createdAt"      TIMESTAMPTZ      NOT NULL,
  "updatedAt"      TIMESTAMPTZ      NOT NULL
);

-- group

CREATE TABLE "group" (
  id               UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR            NOT NULL,
  description      TEXT,
  "entityType"     group_entity_type  NOT NULL,
  "organizationId" UUID               NOT NULL REFERENCES organization (id),
  "createdById"    UUID               REFERENCES "user" (id),
  "updatedById"    UUID               REFERENCES "user" (id),
  "createdAt"      TIMESTAMPTZ        NOT NULL,
  "updatedAt"      TIMESTAMPTZ        NOT NULL
);
