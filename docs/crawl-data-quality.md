# Crawl data quality audit

Stage 10 uses `npm run audit:ingestion-quality` as a read-only inventory of the configured development database. The report is bounded by `--issue-limit` and covers all raw `ingestion_runs` and `ingestion_raw_snapshots` records through paged reads.

The audit reports, per source:

- missing or duplicated crawl/run/snapshot/row identity
- snapshots that do not match their stable id or reference an unknown run
- missing parser/content provenance
- empty product names, source mismatches, country-boundary mismatches, and invalid row/observation prices
- reversed or malformed validity ranges
- duplicated or empty product identifiers

The report is evidence for a human decision. It does not repair, delete, reprocess, or promote anything. Each issue class must be assigned one of:

1. a parser/normalizer fix and a reprocessing plan;
2. an explicitly scoped idempotent repair migration;
3. development-only discard/re-ingest;
4. an accepted limitation; or
5. a post-MVP deferral.

## Current configured evidence

The 2026-07-13 read-only audit completed against the populated development database after traversal was
changed to MongoDB's indexed `_id` sort. Its latest run inspected 55 crawl runs, 66 snapshots, and
12,172 parsed rows. It exposed 78 `duplicate_row_identity` issues in Lidl HU brochure snapshots; the
other active sources reported no issues. The bounded repair dry run selects 22 affected Lidl snapshots,
removes 78 duplicate derived rows, and predicts zero duplicate identities after reparsing.

The defect was traced to repeated same-page PDF text extraction, not to distinct products sharing a
legitimate identity. Lidl parser version `0.1.1` now keeps the first row for a repeated page/item
identity and has a sanitized regression test. Existing snapshots are historical evidence and are not
rewritten by the parser fix. Any historical parsed-row repair or reprocessing must be reviewed and run
as an explicit, bounded operation after the protected archive/checksum step.

## Correction overlay boundary

Reviewed corrections use the versioned `ingestion-correction-overlay-v1` shape from `packages/kamra-api-server/src/ingestion/audit/ingestion-quality-audit.ts`. An overlay is keyed by raw snapshot id, row index, and source fingerprint. It records the normalized fields to use for a future processing run, the reason, reviewer, and tool/version metadata.

Overlays are not raw evidence and are not applied by the audit command. They must not contain `payloadText`, credentials, private household data, or broad unreviewed replacements. A future import/reprocessing step may validate and apply them while leaving the original Crawl Snapshot unchanged.

## Operator sequence

1. Export and independently preserve the raw Crawl Snapshot archive with `npm run crawl:export`.
2. Run the audit against the same configured development database.
3. Save the report outside the repository and classify every recurring issue class.
4. Fix parsers with sanitized regression fixtures, or prepare a separately reviewed overlay.
5. For the confirmed Lidl repeated-identity defect, export and verify the archive, inspect the bounded
   repair plan with `npm run repair:lidl-brochure`, and apply only after review with the exact target and
   operator arguments documented in `scripts/README.md`.
6. Reprocess only after the decision and correction are reviewed.
