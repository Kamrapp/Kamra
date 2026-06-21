# Crawler Pipeline Patterns

## Purpose

Capture the reusable crawler ideas from the legacy .NET code without preserving the old runtime shape.

## What The Legacy Code Got Right

- `Crawler<TProduct, TOffer>` separates crawl orchestration from source-specific selectors.
- `OfferCardLinkReader` splits source discovery into offer-card collection, link extraction, filtering, and discount extraction.
- Processors separate HTML extraction, JSON extraction, and discount-only extraction.
- Source models use declarative extraction attributes instead of pushing every store into hardcoded parser branches.
- Product and offer records are processed separately, which is closer to the future raw/store/canonical split than the SQL backend was.
- Logging is treated as a first-class output instead of an afterthought.

## Why This Matters For The New Architecture

- GitHub Actions workflows can replace crawler registration and hosting, but they should keep the adapter pattern.
- A future workflow should still have clear phases:
  source config -> fetch/discover -> raw snapshot -> parse/normalize -> persist -> run log
- Store-specific selectors and parsers should stay isolated so one brittle source does not infect shared logic.
- Offer validity logic belongs near the source adapter or parser layer, not in the user-facing API.

## What To Change

- Preserve immutable raw snapshots before writing normalized store-product or offer documents.
- Add first-class run metadata: source, workflow run id, started/finished timestamps, status, counts, and failure reasons.
- Replace direct store-named output collections as the only durable contract with an explicit ingestion schema.
- Replace broad catch blocks with explicit failure results where the job can recover or mark a run as partial/faulted.
- Keep workflows language-agnostic. TypeScript can be the default, but contracts should be consumable by non-TypeScript jobs too.

## Reuse Guidance

- Reuse: selector-per-source pattern, reader/pipeline separation, partial-update semantics, product-versus-offer distinction.
- Reference only: attribute classes and reflection-heavy implementation details.
- Retire: direct runtime coupling to the .NET crawler host and direct writes into final collections without raw snapshot staging.
