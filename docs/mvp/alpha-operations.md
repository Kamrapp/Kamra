# Alpha operations

This is the short operator runbook for the Stage 10 Alpha path. It complements
[docs/tech-ops.md](../tech-ops.md), [docs/database-environments.md](../database-environments.md), and
the repository scripts README.

## Environment discipline

Use `kamra_dev`, `kamra_test`, or `kamra_smoke` for local/demo/release checks. Confirm `MONGODB_DB_NAME`
and the intended account before every data-writing command. Production-named databases require an
explicit operator decision and are outside the default demo workflow.

## Safe validation order

```powershell
npm test
npm run format:check
npm run lint -- --max-warnings=0
npm run typecheck
npm run build:web
npm run build:api
npm run smoke:catalog
npm run smoke:transactions
```

The last two commands need configured MongoDB. Transaction smoke writes only a temporary collection
in an allowed disposable database and removes it after checking commit and rollback behavior.

## Raw Crawl Snapshot protection

Export before a cutover or repair:

```powershell
npm run crawl:export -- --output=.artifacts/crawl-archives/<label>
npm run audit:ingestion-quality -- --issue-limit=1000
```

Inspect the manifest counts/checksums and preserve a protected copy. Import is dry-run by default:

```powershell
npm run crawl:import -- --archive=.artifacts/crawl-archives/<label>
npm run crawl:import -- --archive=.artifacts/crawl-archives/<label> --apply --target=<exact-db-name>
```

Never overwrite an archive identity/content conflict. Corrected rows use a reviewed overlay during
`npm run process:ingestion -- --reprocess --overlay-file=<path>`; raw snapshots remain unchanged.

## Domain-language maintenance

Preview the ordered validator/data actions before applying them:

```powershell
npm run maintenance:alpha-domain-language -- --dry-run
npm run maintenance:alpha-domain-language -- --apply --target=<exact-db-name> --operator=<identity>
```

Validator completion and data-migration completion are independent acknowledgements. Stop on a
conflict, checksum mismatch, or unexpected validator rejection; do not guess or repair by hand.

## Recovery expectations

The Alpha recovery boundary is verified raw archive + deterministic reprocessing + reseedable derived
data. Keep the export, manifest, audit report, migration output, and operator identity together in a
private location. Test an isolated restore/import before relying on it for a release. A configured
restore drill is still a release-evidence task, not implied by local unit tests.

## Logs and privacy

Use [docs/logging.md](../logging.md) for event levels and redaction rules. Browser `info`/`debug` logs
remain local; warnings/errors may be forwarded with a per-browser client id. Search logs for tokens,
passwords, raw notes, and unnecessary personal data before sharing diagnostics.
