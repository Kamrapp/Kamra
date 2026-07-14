# Database Maintenance Registry

This package owns the code-defined registry for database structural changes and the MongoDB tracking records for validator and existing-data actions.

Each registry entry must have:

- a stable id
- an operator-facing title and detail note
- a validator action when the collection validator changes
- an idempotent migration action when existing documents need a shape or value change

The developer-admin API exposes the registry and runs only known code-owned actions. Successful actions are recorded in `database_maintenance_runs`; failed actions are not marked complete. `Mark as complete` is an audited operator acknowledgement for work performed outside the app, not a substitute for execution. `Run all` is sequential and stops at the first failure. Run validator updates before data migrations when the current live validator would reject the new fields.

Do not add arbitrary executable actions from MongoDB documents. Update `registry.ts`, implement the corresponding repository action, add focused tests, and document data-preservation behavior when adding a new entry.

The `alpha-domain-language-v1` action composes the existing stock, Household Product, and Product Group migrations in that order. It is intentionally idempotent and preserves the legacy household collections as migration evidence. It must only be run after a verified raw Crawl Snapshot archive exists; it does not rename or delete raw ingestion records.
