# Kamra domain language

This is the executable vocabulary for the Stage 8 household MVP. Stable ids, not labels, are used in rules and references.

## Classification

- A **Product** is a catalogue identity. It may have direct Product Concepts and Product Attributes.
- A **Product Concept** is a typed classification such as `food.milk` or `food.pasta.spaghetti`.
- An **`is_a` relation** points from a narrower concept to a broader concept. Effective concepts include direct concepts and all ancestors; cycles are invalid.
- A **Product Attribute** is an independent facet such as `diet.gluten_free` or `fat.1_5_percent`. Attributes do not create ancestry.
- A **classification snapshot** freezes the classification used when household stock was admitted.

## Household supply and demand

- A **global Product** is catalogue identity. A **Household Product** is the household-owned reusable concrete identity for a manually entered, receipt-imported, or optionally catalogue-linked product. Its classification can be reused by future batches.
- A **Stock Target** is a household demand policy: display name, unit, minimum/target, expiry warning, consumption policy, and flat Acceptance Criteria.
- A **Stock Batch** is one physical acquisition with its own quantity, acquisition/expiry dates, immutable display/classification snapshots, lifecycle, and optional Household Product reference.
- A **Stock Allocation** is the explicit counting boundary between a batch and a target. Stage 8 permits one active full-batch allocation; matching alone never counts stock.
- A **Stock Movement** is the immutable quantity history. Corrections and discard are commands, not deletes.
- A **Shopping Need** is a generic demand snapshot. It may be generated from a Stock Target or entered ad hoc and is the Stage 9 handoff; it is not a purchase.

## Units and time

Quantities are finite, non-negative decimals with six fractional digits. Dates are calendar dates (`YYYY-MM-DD`), not timestamps. Supported conversions are `g`/`kg` and `ml`/`l`; custom units only match exactly. A missing expiry is intentional and sorts after dated batches.

## Boundaries

Catalogue references in household data are nullable soft references. Names and classification at acquisition are snapshots, so catalogue archival cannot erase household history. Membership capabilities are evaluated server-side; owner-only capabilities are never implied by admin status without household membership.

Stage 9 may extend a Shopping Need with shop market and selected Product/Shop Product choices, but Stage 8 does not select shops, calculate prices, create purchases, or convert purchases into stock.

Product-first and need-first entry are both valid: an unclassified Household Product may acquire batches before later classification, while an unanchored opening batch may satisfy an unconstrained Stock Target before a concrete Household Product is identified. Neither path rewrites historical batch snapshots.
