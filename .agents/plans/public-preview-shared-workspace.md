# Public preview shared workspace

## Objective

Replace the anonymous Home preview's legacy stock table/editor with the canonical Product Group →
Product → Stock Batch workspace using deterministic in-memory data. Preview controls remain inert;
the authenticated workspace keeps its existing API-backed behavior.

## Implementation units

1. [x] Add an optional preview workspace input and inert mode to the canonical workspace component.
2. [x] Replace the legacy preview component markup/styles with the canonical workspace and a small
   static preview shell, keeping its existing public Home entrypoint stable.
3. [x] Add a browser contract for the anonymous route and update session documentation.

## Validation

- [x] app/API typecheck, lint, formatting, and focused browser coverage
- [x] confirm the authenticated workspace path remains API-backed through existing tests
- [x] confirm anonymous controls have no active interaction or API requests
