# Shared Contracts And Migration Ledger

## Purpose

Record the emerging architectural direction from Stage 1 discovery.

## Shared Contract Direction

The future repo should favor a shared TypeScript contract package for:

- frontend model consumption
- Node.js serverless API routes
- transformation code where TypeScript is used

This should not force every workflow into TypeScript. To keep workflow language flexible:

- generate language-agnostic artifacts from the TypeScript source of truth
- keep contracts stable enough for jobs written in other languages to consume
- reserve separate DTO layers for cases where the public API or admin actions should not expose the internal document shape directly

Workflow runtime choice can stay pragmatic:

- prefer JavaScript or TypeScript when consistency with the main app stack is the main benefit
- use Python when a parser, data tool, or source-specific library is clearly better there
- allow C# only where selective reuse or a strong tooling advantage justifies it

Good candidates for shared contracts:

- canonical product documents
- store-product documents
- price or offer observation documents
- household, membership, and household-item documents
- migration-ledger records
- composition or component records
- tag and normalized-search-signal records

## Migration Ledger Direction

Removing EF Core does not remove the need for tracked schema evolution.

The future MongoDB model should include a migrations ledger that records:

- migration id
- description
- applied timestamp
- runtime or tool version
- optional checksum
- success or failure metadata

This is important for:

- repeatable environment setup
- safe document-shape evolution
- workflow and API coordination
- future scripted backfills

## Scope Reminder

This is a direction note, not a final schema design. A dedicated plan should define the actual contract package layout and migration-ledger mechanics before Stage 2 implementation.
