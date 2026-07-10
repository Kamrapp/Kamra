# Database Maintenance Registry Plan

Status: Implemented

## Objective

Replace the single catalog-specific validator button with a standalone developer-admin database maintenance table. Each registered structural change has a title, validator action, existing-data migration action, and detailed hover explanation. The database records successful execution of each action independently; entries with both actions complete move into a finished group.

## User Requests

- Refactor the current admin validator behavior into a table.
- Provide one row per database feature with title, update validators button, migrate existing data button, and a magnifier-driven detail note.
- Persist which validator and migration actions have completed.
- Disable completed action buttons.
- Move fully completed entries into a finished group at the bottom.
- Keep this UI in its own component imported by the admin page.
- Document the rule in agentic project files so future database changes add registry entries when they require validator and existing-data changes.

## Current Reality

- `/api/admin/dashboard/upgrade-catalog-validators` only delegates to the catalog repository.
- The catalog repository already has validator upgrade and legacy product backfill operations.
- Household setup creates validators for new collections but intentionally skips validator updates for non-empty collections.
- Household documents may need a backfill for newer optional fields such as `defaultCalculatedMaxLimitMultiplier` and `favouriteShopId`.
- The developer-admin page currently owns the catalog validator and legacy product actions inside a large component.

## Intended Direction

- Keep the registry declarative and locally runnable in the shared API package.
- Keep action execution server-side and admin-only.
- Track successful actions in MongoDB, not frontend state.
- Treat validator updates and data migrations as separate operations; updating a validator never implies a data migration.
- Preserve existing data and make migrations idempotent.

## Scope

- Add a database-maintenance registry with catalog and household entries.
- Add a persistent execution-tracking collection and repository.
- Add admin API routes for listing entries and running each action.
- Add an explicit per-entry completion override for actions already performed outside Kamra.
- Add a sequential run-all action that stops on the first failed validator or migration.
- Add household validator upgrade and household missing-field migration actions.
- Preserve the existing catalog operations behind the new registry.
- Add `DatabaseMaintenanceComponent` and import it into the developer-admin page.
- Remove the old standalone catalog validator/backfill cards from the admin page.
- Document the registry workflow in `.agents` and durable operations docs.
- Add focused backend and frontend-compilation coverage.

## Non-Goals

- Automatic migrations on application startup.
- Parallel or best-effort run-all execution; actions run in registry order and stop on failure.
- Destructive collection recreation.
- Generic arbitrary-code execution from database records.
- Claiming that a validator update backfills existing documents.
- Migrating unrelated data without an explicit registry entry.

## Data Model

Use a `database_maintenance_runs` collection with one record per registry entry:

- `id`: stable registry entry id
- `validatorUpdatedAt`, `validatorUpdatedByUserId`: present only after successful validator action
- `migrationCompletedAt`, `migrationCompletedByUserId`: present only after successful migration action
- `completionMarkedAt`, `completionMarkedByUserId`: present when an admin explicitly acknowledges both actions as already complete
- `updatedAt`

Existing records are preserved. Missing tracking records mean neither action has completed.

## Initial Registry Entries

- `catalog-product-validation`: updates catalog validators; migrates legacy product validation fields.
- `household-fields`: updates household validators; adds missing `defaultCalculatedMaxLimitMultiplier` and `favouriteShopId` values to existing household documents.

## Implementation Steps

### Step 1 - Registry And Tracking Backend

- Add registry definitions, tracking contracts, Mongo repository, and action dispatch.
- Add admin GET/list and POST validator/migration routes.
- Add household validator and data migration methods.
- Preserve explicit result counts and never mark a failed action complete.
- Allow explicit completion acknowledgement without executing the underlying action.
- Run all incomplete actions sequentially and stop on the first failure.

### Step 2 - Standalone Admin Component

- Add `src/app/dev-admin/database-maintenance.component.ts`.
- Render active rows, finished rows, disabled completed buttons, and hover detail notes.
- Import the component into `AdminDashboardComponent`.
- Add a per-entry `Mark as complete` button and a top-level `Run all` button.

### Step 3 - Documentation

- Document the registry rule in `.agents/AGENTS.md` or the nearest reusable agentic guidance file.
- Document operational behavior and migration ordering in `docs/tech-ops.md`.

### Step 4 - Validation

- Test registry state transitions, idempotent household migration, admin guards, and failure behavior.
- Run typecheck, tests, lint, and build.

## Risks

- A migration may be run before its validator update and fail under an older live validator. The UI should leave the migration enabled and uncompleted; documentation should recommend validator first, migration second.
- A process failure after data mutation but before tracking could leave a migration partially complete. Actions must be idempotent so retry is safe.
- Registry ids are durable identifiers. Renaming one requires an explicit tracking migration or it will appear as a new unfinished entry.

## Approval Checkpoint

Approved by the user's implementation request.

## Completion Notes

- Added `catalog-product-validation` and `household-fields` registry entries.
- Added `database_maintenance_runs` tracking and admin routes.
- Added the standalone `DatabaseMaintenanceComponent` with active/finished groups and hover details.
- Added manual completion acknowledgement and sequential run-all execution.
- Documented the future-entry rule in `AGENTS.md`, `docs/tech-ops.md`, and the package README.
- Validation passed: `npm test` (152 tests), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
