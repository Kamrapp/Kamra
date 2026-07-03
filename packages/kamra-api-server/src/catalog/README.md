# Catalog Contracts

The catalog model is versioned because crawler and processor jobs need a stable target shape.

## Layout

- `current/` contains the app-facing catalog repositories and imports the active contract version.
- `v1/` contains the first catalog contract version, schema definitions, fixtures, and schema artifact tests.
- Future versions should be added as sibling folders such as `v2/`. Keep old versions available until migrations and processors no longer need them.

Changing the active version should be an intentional path change in `current/` and in the catalog scripts, paired with a migration plan.

## Model Notes

- `ProductRecord` is the canonical query object for grocery products.
- `ProductSourceRecord` stores compact source identity, source-local identifiers, and links, not bulky raw page content or image bytes. Retailer-local ids belong here instead of on canonical products.
- `PriceObservationRecord` stores observed source prices over time. Use separate observations for base, offer, coupon, loyalty-card, and old/original prices instead of collapsing them into one price.
- `ProductTagRecord` and `ProductTagAssignmentRecord` keep category and keyword signals separate from products for now.
- `StockRecord` links a product to a location such as a household, shop site, or country-level shop availability. Its optional `price` is a compact current/collated value, not the full price history.
- `SourceRecordProcessingStateRecord` prevents processors from reprocessing the same source record unless a processor version changes or a reset is requested.
- `RecordOrigin` should be present on processed records so later review can tell whether data came from seed data, a crawler, a processor, or manual maintenance.

For the free-tier MVP, keep processed catalog records compact. Prefer links and source identifiers over storing images, raw HTML, or large source payloads in catalog collections.
