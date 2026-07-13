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

## Correction overlay boundary

Reviewed corrections use the versioned `ingestion-correction-overlay-v1` shape from `packages/kamra-api-server/src/ingestion/audit/ingestion-quality-audit.ts`. An overlay is keyed by raw snapshot id, row index, and source fingerprint. It records the normalized fields to use for a future processing run, the reason, reviewer, and tool/version metadata.

Overlays are not raw evidence and are not applied by the audit command. They must not contain `payloadText`, credentials, private household data, or broad unreviewed replacements. A future import/reprocessing step may validate and apply them while leaving the original Crawl Snapshot unchanged.

## Operator sequence

1. Export and independently preserve the raw Crawl Snapshot archive with `npm run crawl:export`.
2. Run the audit against the same configured development database.
3. Save the report outside the repository and classify every recurring issue class.
4. Fix parsers with sanitized regression fixtures, or prepare a separately reviewed overlay.
5. Reprocess only after the decision and correction are reviewed.
