# Kamra domain language

This is the executable vocabulary for the Stage 8 household MVP. Stable ids, not labels, are used in rules and references.

## Classification

- A **Product** is a catalogue identity. It may have direct Product Concepts and Product Attributes.
- A **Product Concept** is a typed classification such as `food.milk` or `food.pasta.spaghetti`.
- An **`is_a` relation** points from a narrower concept to a broader concept. Effective concepts include direct concepts and all ancestors; cycles are invalid.
- A **Product Attribute** is an independent facet such as `diet.gluten_free` or `fat.1_5_percent`. Attributes do not create ancestry.
- A **classification snapshot** freezes the classification used when household stock was admitted.

## Household supply and demand

- A **global Product** is catalogue identity. A **Household Product** is the household-owned reusable concrete identity for a manually entered, receipt-imported, or optionally catalogue-linked product. Its identity metadata and optional target policy are reused by future Batches.
- A **Product Group** is a household-owned, optionally nested grouping of Household Products, such as `Bread` with a `White bread` child. A Product belongs to zero or one direct Product Group. A Group is not a Product Concept and does not classify Products.
- A **target policy** is optional data owned by a Product Group or Household Product. It contains a tracking unit, a minimum quantity, and a desired restock quantity. The target is not a separate household entity. A missing target policy means “track and show current stock, but do not produce a shortage state or shopping need for this owner.”
- Product current quantity is derived from its active Batches. Product Group current quantity is derived from direct/descendant Products. A Product’s quantity contributes to its direct Group and ancestors once. Target policies are evaluated bottom-up for shopping: specific Product/child-Group shortages are planned first, then a parent Group contributes only its residual shortage. This prevents duplicate bread needs from overlapping parent/child targets.
- A **Stock Batch** is one physical acquisition belonging to a Household Product, with its own quantity, acquisition/expiry dates, immutable display/classification snapshots, lifecycle, and movement history. Need-first entry creates a generic manual Household Product first; normal Home operation has no anonymous top-level Batch.
- A batch's official expiry date may precede its household acquisition date; these dates describe different facts and are not ordered by validation. Each household defaults to `allowExpiredItems: true`; when disabled, expired stock remains visible/history but is excluded from consumption and derived available totals.
- A **Stock Movement** is immutable quantity history. Corrections and discard are commands, not deletes.
- A **Shopping Need** is a generic demand snapshot generated from a Product Group or Household Product target-policy shortage, or entered ad hoc. It is the Stage 9 handoff, not a purchase.

### Legacy allocation boundary

The first Stage 8 implementation used a **Stock Target** entity and **Stock Allocation** records to make a Batch count toward one Target. Those are migration/history terms only after the Product Group cutover. The cutover maps safe one-Group Product histories to direct Product membership, reports conflicting multi-Target histories for explicit resolution, and never runs allocation and membership aggregation in parallel.

## Units and time

Quantities are finite, non-negative decimals with six fractional digits. Dates are calendar dates (`YYYY-MM-DD`), not timestamps. Supported conversions are `g`/`kg` and `ml`/`l`; custom units only match exactly. A missing expiry is intentional and sorts after dated batches.

## Boundaries

Catalogue references in household data are nullable soft references. Names and classification at acquisition are snapshots, so catalogue archival cannot erase household history. Membership capabilities are evaluated server-side; owner-only capabilities are never implied by admin status without household membership.

Stage 9 may extend a Shopping Need with shop market and selected Product/Shop Product choices, but Stage 8 does not select shops, calculate prices, create purchases, or convert purchases into stock.

Product-first and need-first entry are both valid: an unclassified Household Product may acquire Batches before later classification, while a generic manual Household Product can hold an approximate opening Batch before a concrete Product is identified. Neither path rewrites historical Batch snapshots.
