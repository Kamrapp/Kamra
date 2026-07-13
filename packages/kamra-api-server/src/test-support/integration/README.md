# API integration test support

This directory contains deterministic cross-layer tests that call the shared application handler
with explicit user, household, and fake-database fixtures. They are different from unit tests
because they cross authentication, route selection, repository construction, and persistence.

Run the focused suite with:

```text
npm run test:integration
```

The fake database intentionally does not emulate MongoDB validators or transaction semantics.
Configured database smoke scripts remain responsible for real validator, index, transaction, and
maintenance behavior.
