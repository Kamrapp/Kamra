# Security and privacy

Kamra is source-available and currently supports an internal Alpha workflow. Do not treat the public
repository, demo deployment, or free-tier hosting posture as suitable for sensitive household data.

## Reporting

Do not open a public issue for a suspected vulnerability or exposed credential. Contact the project
maintainer privately through the repository owner or deployment administrator, including a concise
reproduction, affected route/environment, and impact. Do not send real household exports or secrets in
the report.

## Secrets and data

- Keep MongoDB URIs, authentication secrets, seed passwords, deployment tokens, and crawler
  credentials in local or platform-managed secret storage.
- Never commit `.env` files, database dumps, raw household submissions, or unredacted Crawl Snapshot
  archives.
- Treat browser activity logs and server logs as operational data; do not include tokens, passwords,
  full notes, or unrestricted request payloads.
- Keep demo and smoke databases separate from production and use the documented environment matrix.
- Archive imports and maintenance actions must use explicit target confirmation and operator review.

## Current Alpha limitations

- Public registration remains controlled and admin-gated.
- Hosted logging is useful for diagnosis but is not a complete security monitoring or retention system.
- The application is not a substitute for a production backup, disaster-recovery, penetration-testing,
  or compliance program.
- Raw ingestion evidence and household history have different retention and privacy requirements;
  never copy one into the other for convenience.

For operational recovery and migration ordering, see [docs/mvp/alpha-operations.md](./docs/mvp/alpha-operations.md).
