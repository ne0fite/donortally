# DonorTally

A multi-tenant web application for organizations to record, manage, and report on donor contributions. Supports data import and export in multiple formats.

## Features

- **Donation tracking** — Record and report on donations per donor, campaign, and group
- **Multi-tenant** — Each organization's data is fully isolated
- **Import/export** — Bulk import via CSV/Excel and export to CSV/Excel across donors, donations, and campaigns
- **Super administration** — Privileged users can view and manage all organizations
- **Pagination and search** — All list views support search, configurable page size, and sorting

## How Organizations Get Access

New organizations are onboarded via invitation from a super administrator. One or more users within each organization can be granted super administrator privileges to manage all data in the system.

## Tech Stack

| Layer | Technology | Directory |
|---|---|---|
| Frontend | Stencil.js, Tailwind CSS | `client/` |
| Backend | NestJS, Sequelize | `api/` |
| Database | PostgreSQL | — |

## Getting Started

### Prerequisites

- Node.js
- pnpm v10+
- PostgreSQL

### Installation

```bash
# Install dependencies for both workspaces
cd api && pnpm install
cd ../client && pnpm install
```

### API Configuration

Copy the example env and update values as needed:

```bash
cp api/.env.example api/.env  # or create api/.env manually
```

Required variables:

| Variable | Description | Default |
|---|---|---|
| `DB_HOST` | Postgres host | `localhost` |
| `DB_PORT` | Postgres port | `5432` |
| `DB_USER` | Postgres user | `postgres` |
| `DB_PASS` | Postgres password | — |
| `DB_NAME` | Database name | `donortally` |
| `PORT` | API port | `3000` |
| `CLIENT_URL` | Frontend origin (for CORS) | `http://localhost:3333` |
| `JWT_SECRET` | Secret used to sign JWTs | — |
| `NODE_ENV` | Environment | `development` |

### Client Configuration

Set your Google Maps API key in `client/src/config.ts`. The **Places API (New)** must be enabled in your Google Cloud project.

### Database Setup

Apply the schema to your PostgreSQL database:

```bash
psql -U <db-user> -d donortally -f api/sql/schema.sql
```

To bootstrap a first organization and user:

```bash
cd api && pnpm script:create-org-user
```

### Running Locally

```bash
# API (watch mode) — http://localhost:3000
cd api && pnpm start:dev

# Client (dev server) — http://localhost:3333
cd client && pnpm start
```

## Development

### API Commands (`api/`)

```bash
pnpm start:dev                              # Run with watch mode
pnpm build                                  # Compile to dist/
pnpm test                                   # Run all tests
pnpm test -- --testNamePattern=donor        # Filter tests by name
pnpm migrate                                # Run pending Sequelize migrations
pnpm migrate:undo                           # Undo last migration
pnpm script:create-org-user                 # Bootstrap a new org + user
```

### Client Commands (`client/`)

```bash
pnpm start           # Dev server (port 3333)
pnpm build           # Production build
```

## Docker

The Dockerfile builds the client and API, then serves both from a single container on port 3000. The client is served as static files through the API — no separate web server needed.

### Build and run locally

```bash
docker build -t donortally .
docker run -p 3000:3000 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASS=password \
  -e DB_NAME=donortally \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  donortally
```

### Build for Linux/AMD64 (required when building on Apple Silicon)

DigitalOcean (and most cloud providers) run AMD64. If you build on an Apple Silicon Mac, target the correct platform explicitly:

```bash
docker buildx build --platform linux/amd64 -t donortally .
```

## Deploying to DigitalOcean App Platform

### 1. Push the image to DigitalOcean Container Registry

```bash
# Authenticate
doctl registry login

# Build for AMD64 and push directly
docker buildx build --platform linux/amd64 \
  -t registry.digitalocean.com/<your-registry>/donortally:latest \
  --push .
```

If you don't have a buildx builder set up:

```bash
docker buildx create --use
```

### 2. Create a managed PostgreSQL database

Create a managed Postgres 17 database in your DigitalOcean project. Note its component name — you'll use it to bind env vars in the next step.

### 3. Configure the App Platform service

Key settings when creating the app:

| Setting | Value |
|---|---|
| Source | Container Registry → your image |
| HTTP port | `3000` |
| Instance size | `apps-s-1vcpu-1gb` or larger |

Required environment variables (use DigitalOcean's binding syntax for the database):

| Variable | Value |
|---|---|
| `DB_HOST` | `${<db-component-name>.HOSTNAME}` |
| `DB_PORT` | `${<db-component-name>.PORT}` |
| `DB_USER` | `${<db-component-name>.USERNAME}` |
| `DB_PASS` | `${<db-component-name>.PASSWORD}` |
| `DB_NAME` | `${<db-component-name>.DATABASE}` |
| `JWT_SECRET` | a long random secret (https://jwtsecrets.com/#generator) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

> The `<db-component-name>` must exactly match the **name** field of your database component in the app spec.

### 4. Apply the schema

Before or after the first deploy, apply `api/sql/schema.sql` to your managed database:

```bash
psql <connection-string> -f api/sql/schema.sql
```

DigitalOcean exposes a connection string for managed databases. You can also run this from your local machine if the database allows external connections (or via a one-off container).

To bootstrap a first org and user, run the creation script locally against the production database with the appropriate env vars set:

```bash
cd api && DB_HOST=... DB_USER=... DB_PASS=... DB_NAME=... pnpm script:create-org-user
```

## Data Model

| Entity | Description |
|---|---|
| Organizations | Top-level tenants; each has its own isolated data |
| Users | Belong to an organization; some may have super admin privileges |
| Donors | Individuals or entities that make donations |
| Donations | Contribution records linked to a donor, organization, and optionally a campaign; track acknowledgment timestamp |
| Campaigns | Fundraising initiatives within an organization |
| Groups | Categorizations of donors or donations within an organization |
