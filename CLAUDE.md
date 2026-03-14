# CLAUDE.md

## Project Overview

DonorTally is a multi-tenant web application for organizations to record and report donations.
- **Multi-tenant**: Organizations are isolated; data is scoped per organization
- **Super admins** can view/edit all data and invite new organizations
- **Import/export** of data in multiple formats is a core feature
- **Stack**: NestJS + Sequelize + PostgreSQL (api/), Stencil.js + Tailwind CSS (client/)
- **Package manager**: pnpm (v10.30.3) — always use `pnpm`, never `npm` or `yarn`

## Commands

### API (`api/`)
```bash
pnpm start:dev       # Run with watch mode
pnpm build           # Compile to dist/
pnpm test            # Run all tests
pnpm test -- --testNamePattern=donor   # Filter by test name
# Note: --testPathPattern does not work (testRegex overrides it)
pnpm migrate         # Run pending migrations
pnpm migrate:undo    # Undo last migration
pnpm migrate:create --name=<desc>  # Create a new migration file
pnpm script:create-org-user  # Bootstrap a new org + user
```

Required env vars (copy `api/.env.example` → `api/.env`):
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `PORT` (default 3000), `CLIENT_URL` (CORS origin), `JWT_SECRET`, `NODE_ENV`

Initial DB schema (run once, before migrations):
```bash
psql -U <db-user> -d donortally -f api/sql/schema.sql
```

### Client (`client/`)
```bash
pnpm start           # Dev server with watch (serves on :3333)
pnpm build           # Production build
```

## Architecture

### API

All routes are prefixed with `/api`. Every controller route is protected by `JwtAuthGuard`. The authenticated user object (from `@CurrentUser()`) always carries `organizationId` and `id` — services use `organizationId` to scope every query (tenant isolation).

Each domain follows the same module structure:
```
src/<domain>/
  <domain>.controller.ts   # HTTP layer, extracts user + delegates
  <domain>.service.ts      # Business logic, Sequelize queries
  <domain>.dto.ts          # Input types
  <domain>.module.ts       # Wires model, service, controller
src/models/
  <entity>.model.ts        # Sequelize-TypeScript model
```

Key patterns:
- **Migrations**: managed by `sequelize-cli`; `synchronize: false` means models never auto-alter the DB — always write a migration file for schema changes
- **Child record sets** (`DonorContact`): replaced wholesale on update (destroy all + bulkCreate), not patched individually
- **Transactions**: all mutating service methods that touch multiple tables use `sequelize.transaction()`
- **Audit fields**: every service `create`/`update` method accepts `userId: string` and writes it to `createdById`/`updatedById`; controllers pass `user.id` from `@CurrentUser()`

### Client

Single-page app with a hand-rolled URL router — no router library. To navigate, call `navigate(path)` from `src/services/router.ts`, which wraps `history.pushState` + dispatches a `popstate` event. `app-root` listens to `popstate` and calls `parseRoute(path)` to pick which component to render.

```
src/store/auth.store.ts     # Global state: token, orgName, currentUser (token persisted at localStorage key dp_token)
src/services/api.ts         # Fetch wrapper; handles 401 → redirect to login; skips res.json() on 204
src/services/router.ts      # navigate(path), parseRoute(path) — URL-based routing
src/services/donor.ts       # Typed service methods over api.ts
src/services/maps.ts        # Google Places API bootstrap + extractAddressFields()
src/config.ts               # GOOGLE_MAPS_API_KEY (Places API New must be enabled)
src/components/
  app-root/                 # Route switcher (listens to popstate)
  app-login/                # Auth form
  app-dashboard/            # Landing page after login
  app-donors/               # Donor list with sort, search, pagination, export
  app-donor-new/            # Create form
  app-donor-import/         # Bulk CSV import
  app-donor-edit/           # Edit form
  app-donations/            # Donation list
  app-donation-new/edit/import/  # Donation CRUD + import
  app-campaigns/new/edit/   # Campaign CRUD
  app-users/new/edit/       # User management (super admin)
  app-profile/              # Current user profile
  app-settings/             # Org settings
  app-address-section/      # Reusable address fields with Places autocomplete
```

`app-address-section` emits `CustomEvent<string>` per field: `address1Change`, `address2Change`, `cityChange`, `donorStateChange`, `postalCodeChange`. The state event is named `donorStateChange` (not `stateChange`) to avoid a native DOM event name conflict.

## Standards

### API endpoints
- Singular nouns in REST endpoints
- GET (no ID) → list; GET (with ID) → single; POST (no ID) → create; POST (with ID) → update; DELETE (with ID) → delete
- DELETE returns `204 No Content`

### Models
- UUID primary keys; singular nouns for model and table names
- All models have `createdAt`, `updatedAt`, `createdById`, `updatedById`

### IDs
- `Donor` has two IDs: UUID `id` (PK, used in URLs/relations) and human-readable `donorId` (e.g., `DR-XXXXXXXX`, unique per org). Import deduplication matches on `donorId`. Use `id` for all FK references.
- `Donation` similarly has UUID `id` and `donationId` (e.g., `DN-XXXXXXXX`).

### Import behavior
- Donor import: upserts on `donorId` when provided, otherwise always creates.
- Donation import: upserts on `donationId`; rows where the referenced donor `donorId` doesn't exist are returned in a `rejected[]` array (not thrown as errors).
- Bulk delete: `DELETE /donor` (no ID) and `DELETE /donation` (no ID) accept `{ ids: string[] }` in the request body.

### Tests (API)

Tests live alongside services as `*.service.spec.ts`. Models are mocked as plain objects with `jest.fn()` — no DB connection needed.

- **Fixtures**: `src/test/fixtures/` — `makeDonor()`, `makeDonorContact()`, `makeDonation()`, `makeCampaign()`, `makeGroup()`, `makeUserRecord()` — all accept partial overrides
- **Identity constants**: `USER_ID`, `ORG_ID` from `user.fixture.ts`; pass `USER_ID` to service create/update calls and assert it in `createdById`/`updatedById`
- **Transaction mock**: `sequelize.transaction` immediately invokes the callback with a stub `t` object

### Stencil JSX gotchas
- `<select>` has no `value` prop — set `selected={state === opt}` on each `<option>` instead (same pattern as status/campaign dropdowns throughout the codebase)

### Client formatting utilities
Use `src/services/format.ts` for all display formatting — do not write local helpers:
- `formatDate(value)` — handles `string | null | undefined`; appends `T00:00:00` to date-only strings to prevent UTC-midnight timezone shift
- `formatAmount(amount, currency)` — `amount` must be a `number`; `Campaign.goalAmount` is `string | null`, so use `parseFloat` with a null guard
- `formatNumber(value)` — apply to every displayed count/total (list headers, pager, import screens, stat cards)

### Commit Message Format
Use the Conventional Commits specification for commit messages with less than 100 chars
