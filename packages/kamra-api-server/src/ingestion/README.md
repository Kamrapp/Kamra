# Ingestion Package

## Purpose

This package area owns reusable ingestion contracts, source parsers, and persistence adapters.

Ingestion is separate from catalog:

- ingestion stores raw source truth and parsed source rows
- catalog stores app-facing product, source, stock, tag, and processing records

## Current Layout

- `v1/`
  - shared ingestion contracts and crawl-run identity helpers
- `sources/simple-html-table-shop/`
  - synthetic HTML source fixture, parser, and tests
- `sources/*-offers/`
  - source-specific real retailer parsers for public offer pages
- `current/`
  - MongoDB repository for `ingestion_runs` and `ingestion_raw_snapshots`

## Contract Rules

- Keep crawler output capable of tracking multiple price observations over time.
- Keep source product identity separate from price observations.
- Preserve distinct price semantics: base/shelf, dated offer, coupon, loyalty-card, and old/original prices should remain separate when the source exposes them separately.
- Keep source-local product identifiers in source metadata until a processor intentionally maps them into catalog source records. GTIN or other common identifiers can be promoted only when the source clearly provides them.
- Keep shop-specific parsing inside source adapters.
- Keep processor assumptions out of source parsers where practical.
- Preserve enough metadata for traceability: source name, source record id, crawl run id, crawl date, parser name/version, content hash, and capture time.

## Validation

Targeted tests:

```powershell
npm test -- packages/kamra-api-server/src/ingestion
```

API typecheck:

```powershell
npx tsc -p tsconfig.api.json --noEmit
```

Mongo-backed script checks require `MONGODB_URI` and `MONGODB_DB_NAME`.

## Operational Docs

See `docs/ingestion.md` for how to run ingestion and cleanup scripts.
