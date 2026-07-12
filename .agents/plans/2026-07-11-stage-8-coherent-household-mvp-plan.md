# Stage 8 Household-Domain Correctness Plan

Status: In implementation. The user authorized Stage 8 implementation on 2026-07-11; proceed one approved commit-sized step at a time.

## Objective

Build the correct household-domain foundation for the coherent Kamra MVP before concrete shop planning is added in Stage 9. Stage 8 will separate Product Concepts, Product Attributes, household Stock Targets, concrete Stock Batches, and explicit Stock Allocations; preserve Stock Movement history; add inclusive `is_a` semantics; connect generic/manual and explicit Products safely to the same Stock Target; make stock changes concurrency-safe and idempotent; generate Shopping Needs; and establish the minimum feature-toggle and logging foundations needed for safe rollout.

The milestone is complete when a user can create or join a household, create/reorganize Product Concepts, define a Stock Target such as “keep 2 l of any milk” or “keep 10,000 g of gluten-free penne, spaghetti, or tagliatelle”, allocate matching generic/manual and explicit-Product Stock Batches into it, consume/correct/remove independently expiring batches with history, understand low-stock and expiry notices, and generate persisted Shopping Needs ready for Stage 9 translation. Stage 8 alone is not Alpha 1.0.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/plan-template.md`
- `.agents/coding-guidelines.md`
- `.agents/plans/initial-mvp-roadmap.md`
- `.agents/plans/2026-07-09-stage-6-shopping-list-low-stock-notices-plan.md`
- `.agents/plans/2026-07-10-database-maintenance-registry-plan.md`
- `.agents/plans/2026-07-10-stage-7-controlled-alpha-access-plan.md`
- `.agents/sessions/2026-07-09-stage-6-shopping-list-implementation.md`
- `.agents/sessions/2026-07-10-frontend-composition-cleanup.md`
- `docs/repo-concept.md`
- `docs/architecture.md`
- `docs/tech-ops.md`
- `docs/household.md`
- `docs/access.md`
- `docs/logging.md`
- `docs/codebase-analysis.md`
- `packages/kamra-api-server/AGENTS.md`
- `packages/kamra-api-server/src/household/README.md`
- `packages/kamra-api-server/src/household/v1/*`
- `packages/kamra-api-server/src/household/current/*`
- `packages/kamra-api-server/src/http/routes/household-routes.ts`
- `packages/kamra-api-server/src/http/routes/admin-dashboard-route.ts`
- `packages/kamra-api-server/src/http/routes/catalog-routes.ts`
- `packages/kamra-api-server/src/http/routes/ingestion-routes.ts`
- `packages/kamra-api-server/src/database-maintenance/*`
- `packages/kamra-api-server/src/logging/*`
- `packages/kamra-api-server/src/catalog/v1/contracts.ts`
- `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts`
- `packages/kamra-api-server/src/db/mongo-like.ts`
- `src/app/AGENTS.md`
- `src/app/household/*`
- `src/app/dev-admin/admin-feature-flags-card.component.ts`
- `src/app/dev-admin/admin-dashboard.service.ts`
- `src/app/home.component.ts`
- `src/app/product-lookup/*`
- `package.json`

## Research Gate

No external research gate is needed before approving this plan. The material uncertainties were repository-specific and were resolved from runtime code. MongoDB transaction deployment support must still be proven against the configured Atlas/local environments during Step 1; that is an implementation validation gate, not a reason to invent a weaker data model now.

If the configured production topology cannot support transactions, pause before Step 4 and revise the write protocol explicitly. Do not silently replace atomic stock/allocation commands with best-effort sequential writes.

## User Requests

- Audit the current household and shopping architecture before adding Stage 8 features.
- Correct the one-stock-row-per-household-product assumption at the domain, persistence, API, and UI layers.
- Support multiple batches, separate dates, quantities, partial consumption, corrections, aggregation, deterministic or selected consumption order, history, and items without expiry.
- Review the complete household and shopping-list workflow for structural gaps.
- Connect generic household concepts and concrete purchased batches incrementally to catalogue products without making household data depend on catalogue stability.
- Preserve the intended Product Concept hierarchy so a child concept such as spaghetti is inclusively a kind of pasta, while Product Attributes such as gluten-free or 1.5% fat constrain Stock Target Acceptance Criteria.
- Let one Stock Target aggregate multiple generic/manual and explicit Product Stock Batches under a single minimum/target without double counting overlapping Stock Targets.
- Support household-local Product Concepts and Product Attributes without polluting shared catalog classification.
- Distinguish strong references, optional references, snapshots, concepts, attributes, keywords, and derived data.
- Put foundational and minimum coherent-MVP work in Stage 8; defer richer intelligence to Stage 9.
- Establish admin-managed, persisted, auditable feature-toggle conventions and a safe extension path.
- Establish meaningful structured application logging and audit-relevant event conventions.
- Produce an implementation-ready plan only, not implementation code.

## User Decisions Embedded In The Request

- A new purchase with a different expiry date is always a distinct stock batch.
- The generic household concept remains useful without a catalogue match.
- A household entry represents a Stock Target, not one generic or explicit Product identity.
- Product identity and classification are distinct: a concrete Pilos milk remains a Product, while milk and 1.5%-fat classification determines whether it satisfies Acceptance Criteria.
- Product Concept ancestry is inclusive; Product Attributes remain independent criteria rather than being forced into a false concept tree.
- Stock contributes to a Stock Target only through an explicit Stock Allocation, so one physical batch cannot satisfy multiple limits accidentally.
- Catalogue edits, merges, unpublishing, or deletion must not invalidate household stock or history.
- Stage 8 is a coherent-MVP completion stage, not merely an expiry-field increment.
- Routine feature enablement is database/admin managed, not environment-variable managed.
- Global feature toggles are sufficient initially.
- Notification channels beyond the in-app experience are not required for the MVP.

## Final Stage-Boundary Steering

The final roadmap review deliberately narrows this plan. Stage 8 owns household-domain correctness and Shopping Needs. One-shop Product/Price Observation translation, Shopping Trip states, manual completion, Purchase ingestion, and Purchase-to-Stock conversion move together to Stage 9 because splitting that journey across stages would create temporary contracts and duplicated UI. Stage 10 owns evidence-based hardening and remaining terminology migration only.

## Open Questions

None for implementation. The MVP defaults are final: flat Acceptance Criteria, one full Stock Allocation per Stock Batch, one active Shopping Need set, JSON base content with EN/HU runtime labels, local-only 30/70–70/30 home split preference, and no richer tri-state home focus mode. Repository contradictions trigger the named stop/replan rule; they are not permission to invent a different model.

## Product-to-Batch Workflow Reassessment

The existing plan already gets these boundaries right:

- Product identity is distinct from Product Concept and Product Attribute classification.
- Stock Target is a household demand policy, not a Product or a physical stock row.
- Stock Batch owns quantity, acquisition date, expiry, remaining amount, and immutable historical snapshots.
- Stock Allocation is the only counting boundary, so several concrete Products can satisfy one Stock Target without implicit double counting.
- Catalogue Product references are optional soft references, so catalogue churn cannot invalidate household history.

One gap is now made explicit: a batch-level classification snapshot is not the reusable Product representation for a manually entered or receipt-imported concrete Product. Stage 8 therefore adds a household-owned concrete `Household Product` anchor. It is separate from a global catalogue `Product`, but may optionally link to one.

### Household Product anchor

Persist `household_products` with:

- `id`, `householdId`, `displayName`, `status: active | archived`, `revision`, and actor/timestamps
- `identityKind: manual | catalogue`
- optional `catalogProductId` and a bounded identity snapshot (`brand`, GTIN, measurement/package label, source name/key/URL)
- reusable direct Product Concept and Product Attribute assignments, with classification revision/provenance
- optional default unit/package metadata used only as an input suggestion; Stock Target compatibility remains authoritative

The anchor is the stable concrete Product identity for repeated manual or receipt-imported acquisitions. A Stock Batch may reference `householdProductId`, but always retains its own acquisition and classification snapshot. Future batches of the same Household Product inherit its current classification by default; changing the Household Product classification never rewrites historical batch snapshots or silently changes existing allocations. A later explicit relink/reallocation command may update live planning without changing history.

Both entry directions are first-class:

- Product-first: create/import an unclassified Household Product, add one or more batches, then classify the Product and explicitly allocate eligible batches to a Stock Target later.
- Need-first: create a Stock Target and, when only an approximate current amount is known, create an unanchored/manual opening Stock Batch with `householdProductId: null`; later concrete Household Products and additional batches can be allocated to the same Stock Target. Linking a batch later preserves its original snapshot and records the new relationship as an explicit action.

An unclassified Product or unanchored Batch remains visible and usable. It is never silently treated as matching a constrained Stock Target; only an unconstrained target or an explicit bounded override can count it.

### Home workspace hierarchy

The Home view must present domain groups rather than raw batches as unrelated top-level rows:

- Stock Target groups are the primary household entries. Their current amount is derived only from active allocations and is never independently edited.
- Each expanded Stock Target shows allocated concrete Household Products, then their individual Stock Batches with quantity, acquisition, expiry, and history actions.
- A separate Unassigned/Unclassified area shows concrete Household Products with unallocated batches and unanchored batches. These remain inspectable and editable without pretending they satisfy a target.
- Household Product editing changes reusable identity/classification metadata; Batch editing changes only physical quantity/date/expiry/snapshot fields allowed by the command model.
- A Product may appear under one or more Stock Target groups through explicit allocations, while the same Product's batches retain separate dates and quantities.

The existing adjustable Household/Shopping divider remains a presentation preference and does not become a second domain hierarchy. Stage 8 does not require raw batches to become top-level Home rows.

### Transaction smoke decision

The configured `npm run smoke:transactions` check is useful because transaction behavior depends on Mongo topology, sessions, driver configuration, and the shared transaction abstraction; ordinary unit tests cannot prove those deployment facts. It should not run in the secret-free App Checks workflow.

Keep the focused transaction runner/unit tests in App Checks. Add a separate narrowly triggered `Transaction Smoke` workflow, alongside `Catalog Smoke`, with the GitHub `Smoke` environment and paths covering the Mongo transaction abstraction, household command/repository code, transaction script, package/dependency changes, and its workflow. It should run on `workflow_dispatch` and relevant pull requests, use only `kamra_smoke`, verify rollback/commit/cleanup, and never run against production-named databases. Do not run it for unrelated frontend/docs PRs and do not make it a prerequisite for every PR when the configured Smoke environment is unavailable; record that limitation explicitly.

## Current-State Architectural Assessment

### Sound foundations to retain

- Household membership is checked on the server for household reads and writes; admin role does not bypass membership.
- `household_local_products` already provides a household-owned generic path that does not require catalogue identity.
- Shopping lists persist snapshots instead of querying raw crawler data at display time.
- Low-stock and shopping-list generation are deterministic pure helpers with focused tests.
- Catalogue products, source products, tags, retailer stock, and household stock are already separated conceptually.
- Mongo collections have validators and indexes, and structural changes have a developer-admin maintenance registry with independently tracked validator and migration actions.
- Catalogue review is manually promoted; crawler output does not automatically become trusted household data.
- The logger already emits structured JSONL locally and console records in hosted environments.
- Feature flags are database-backed, typed by a key union, admin-editable, and already used for two operational behaviors.

### Confirmed design flaws and risks

1. **One physical row per generic product is enforced.** `household_stock_items` has a unique `(householdId, householdProductId)` index. `currentAmount`, `initialAmount`, `stockedAt`, reorder limits, generic naming, and explicit product fields all live on that row. A second loaf cannot retain a distinct expiry or acquisition identity.
2. **Generic definition, reorder policy, and physical inventory are conflated.** `minLimit` and `idealMaxLimit` belong to the household's generic need, while `currentAmount` and `stockedAt` belong to concrete stock. Editing a stock row also edits the generic local product.
3. **Catalogue identity is attached at the wrong levels.** Catalogue/source/GTIN fields are duplicated on both `household_local_products` and `household_stock_items`. A generic concept such as milk can therefore accidentally become a specific Pilos package, and editing one row rewrites both concepts.
4. **Shopping completion destroys batch identity.** Purchased quantity is added to an existing mutable row selected by stock id or household product id. It never creates a new batch when stock exists.
5. **Purchase conversion is not atomic.** The route performs stock updates/creates, price-observation writes, and shopping-list completion as separate operations. A failure or concurrent retry can leave partial stock, duplicate observations, or a list whose completion state disagrees with stock.
6. **Optimistic concurrency is absent.** Updates accept no expected revision. Two tabs can overwrite quantities or list edits; two completion requests can both apply the same pending lines.
7. **History is insufficient.** Mutable amounts and timestamps cannot distinguish consumption, correction, discard, depletion, purchase, or migration opening balance. Archival hides a row and may archive the generic product, but does not provide an immutable movement trail.
8. **Units are free text without compatibility rules.** Aggregation and shopping math assume equal unit strings. Package size, quantity unit, and retailer package label are not consistently distinguished.
9. **Expiry semantics are absent.** The catalogue `stocks` contract has an expiry field, but that collection describes retailer availability and must not be reused as private household inventory.
10. **Shopping lines combine intention, purchase result, and stock application state.** `ticked`, `plannedAmount`, `purchasedAmount`, and `status` are edited as one embedded line, with no durable purchase transaction or per-batch acquisition details.
11. **Duplicate and lifecycle rules are incomplete.** Multiple active shopping lists can be created; line appends need not merge by generic need; stock ids are timestamp-derived; and archive/delete transitions have no stale-state guard.
12. **Roles are not capabilities.** Both `owner` and `member` can perform all current household mutations. The household-management page displays invitation/identity cards but is a placeholder; ordinary users cannot actually join another household.
13. **Catalogue deletion is destructive.** The catalogue repository hard-deletes products and related source/price/stock/tag data without checking household references. Current snapshots reduce display damage but link state and reconciliation are undefined.
14. **Feature flags are cross-cutting but modelled as household data.** `household_feature_flags` contains global flags, callers supply defaults individually, evaluation is not centralized or cached, and the admin UI/route enumerates flags manually.
15. **Feature-flag auditability is only latest-state metadata.** The current record remembers the last actor and timestamp but not old value, reason, or change history.
16. **Logging lacks domain semantics.** Records have level/message/details but no stable event name, category, outcome, correlation id, or systematic redaction. Most household actions, validation failures, and authorization denials are not logged.
17. **Frontend contracts duplicate server contracts.** Household DTOs are re-declared in the Angular service. This makes a large v2 cutover prone to drift unless contract parity is validated or a browser-safe shared contract boundary is introduced.
18. **MVP transitions remain incomplete.** Create works, join/invite does not; consume/correct are generic edits rather than explicit actions; catalogue linking has no household picker; expiry notice UX does not exist; and receipt upload is a visible placeholder rather than part of a working manual purchase flow.
19. **The tag hierarchy is only a single optional parent pointer.** `product_tags.parentKey` suggests inheritance, but no relation record, closure calculation, cycle guard, hierarchy version, or inherited matching contract exists. It cannot safely represent a DAG or distinguish hierarchy from other future relationships.
20. **Product assignments expose only direct tag keys.** A product tagged `shape.spaghetti` is not currently guaranteed to match a request for `food.pasta`, and independent facets such as `diet.gluten_free` or `fat.1_5_percent` have no composable household rule.
21. **`stockGroupKey` is a label-like anchor, not an acceptance rule.** It can group rows named alike but cannot express “all pasta, must be gluten-free, and shape is one of penne/spaghetti/tagliatelle.”
22. **Implicit rule matching would double-count overlapping stock.** If aggregates simply query tags, the same gluten-free spaghetti batch could satisfy both “any pasta” and “gluten-free pasta” limits. Physical stock needs an explicit allocation boundary independent from product classification.

## Target Domain Model

### 1. Stock Target (household demand policy)

Retain `household_local_products` only as legacy migration input. Persist the new domain concept as `StockTarget` in `household_stock_targets`. It is a desired stock pool/policy, not a Product Concept or Product identity. One Stock Target may accept many manual or explicit Products and owns their combined minimum/target.

Required fields:

- `id`, `householdId`, `displayName`, normalized stable key
- `trackingUnit` using a defined unit code
- `minimumQuantity` and `targetQuantity` in `trackingUnit`
- `expiryWarningDays` (non-negative integer; default decided in code and visible in UI)
- `consumptionPolicy`: initially `earliest_expiry_first` or `oldest_acquired_first`
- `acceptanceCriteria` with qualified `requiredConceptsAll`, `acceptedConceptsAny`, `requiredAttributesAll`, `acceptedAttributesAny`, and `excludedAttributesAny`
- optional single preferred catalogue product plus a small display snapshot
- `status: active | archived`
- `revision`, create/update actor and timestamps

Invariants:

- It represents “2 l of milk” or “10,000 g of accepted gluten-free pasta”, not a product or physical package.
- Reorder and warning policy lives here, never on a batch.
- Acceptance Criteria are intentionally flat and deterministic: required concepts match directly or through inherited membership; at least one accepted concept/attribute matches when its corresponding any-list is non-empty; all required attributes match directly; and no excluded attribute matches.
- Entirely empty Acceptance Criteria are explicitly unconstrained and accept any Stock Batch with a compatible tracking unit. This supports “I do not care which type” without inventing a fake Product.
- Example pasta criteria: `requiredConceptsAll = [concept.pasta]`, `acceptedConceptsAny = [concept.pasta.penne, concept.pasta.spaghetti, concept.pasta.tagliatelle]`, `requiredAttributesAll = [diet.gluten_free]`, with empty accepted/excluded attribute lists.
- One household may have overlapping Stock Targets, but matching alone never contributes quantity; explicit Stock Allocation prevents double counting.
- Archiving stops future planning but does not delete Stock Batches, Stock Movements, Purchase history, or Shopping Need snapshots.
- Preferred Product is optional Shopping Need enrichment, not identity or Acceptance Criteria.

### 2. Product Concepts, Product Attributes, and classification

Replace legacy `product_tags.parentKey` runtime truth with `product_concepts`, `product_concept_relations`, `product_attributes`, `product_concept_assignments`, and `product_attribute_assignments`. Search keywords remain separate hints where needed. Stage 8 implements relation kind `is_a` only between Product Concepts, directed from narrower child to broader parent. Legacy category parents migrate into concept edges; legacy attribute/keyword tags migrate into their distinct final concepts or are discarded/reseeded when they are only sample data.

Invariants:

- Product Concepts and `is_a` edges are strong domain relationships. Product Attributes such as gluten-free or 1.5%-fat are independent filters. Search Keywords never determine stock eligibility by themselves.
- The global concept hierarchy is a directed acyclic graph, not necessarily a tree. Writes reject self-links and cycles.
- Effective Product Concepts are direct Product assignments plus transitive `is_a` ancestors. `concept.pasta.spaghetti is_a concept.pasta` therefore lets spaghetti satisfy pasta criteria.
- Independent dimensions remain separate. A Pilos 1.5% milk Product is assigned to `concept.milk` and Product Attribute `fat.1_5_percent`; that attribute is not a child of milk. Brand, package measurements, GTIN, Product identity, and Shop Product identity remain first-class catalog fields.
- Product ids remain identity. Product Concepts/Attributes are classification inputs, not substitutes for Product references.
- Closure evaluation is server-owned, deterministic, cycle-safe, and bounded. Stage 8 may calculate it from the small graph; materialized closure and hierarchy version publishing are deferred.
- Add `household_product_concepts`, `household_product_concept_relations`, and `household_product_attributes`. A household Product Concept may point to a concept in the same household or a global parent; it can never modify the global hierarchy or reference another household.
- Users can create, rename, move, archive, and merge household Product Concepts. Move updates parent edges after cycle/impact checks. Merge uses an audited redirect to the survivor, rewrites live Stock Target/classification references transactionally, and preserves snapshots.
- Use qualified `ProductConceptRef` and `ProductAttributeRef` (`scope: catalog | household`, key) so scopes cannot collide and concepts cannot be confused with attributes.
- A Stock Batch stores the direct/effective Product Concept and Product Attribute snapshot used at allocation. Later catalog/classification edits may flag drift but cannot silently remove historical stock from a Stock Target.

### 2A. Checked-in base classification content and runtime localization

Add one bounded, schema-validated base content pack owned by the classification feature slice. Prefer JSON over YAML for the MVP so existing TypeScript tooling can load and validate it without another parser dependency. Suggested layout:

- `packages/kamra-api-server/src/classification/base-content/base-classification.v1.json`
- `packages/kamra-api-server/src/classification/base-content/i18n/en.json`
- `packages/kamra-api-server/src/classification/base-content/i18n/hu.json`

The manifest defines stable ids, Product Concepts, parent refs, Product Attributes, and Stock Target Template Acceptance Criteria/default tracking units. Translation files map those stable ids to localized labels and optional short descriptions. Build/seed tests require English/Hungarian parity and reject unknown translation ids, duplicate ids, missing parents, cycles, or invalid criteria.

Keep the initial pack meaningful but bounded (roughly 25-40 Product Concepts, 5-10 Product Attributes, and 5-10 Stock Target Templates), not an attempt to model every grocery. It must include at least:

- milk, semi-skimmed milk, and lactose-free milk
- bread with a few common child concepts
- eggs
- pasta, penne, spaghetti, and tagliatelle
- laundry detergent with liquid/powder/capsule children
- a small set of other repeatable staples/supplies such as rice, flour, sugar, butter, toilet paper, dishwashing detergent, and hand soap
- attributes including `diet.gluten_free`, `diet.lactose_free`, and the exact MVP facet `fat.1_5_percent`
- templates for any milk, semi-skimmed/lactose-free milk, bread, eggs, any pasta, the documented gluten-free accepted-type pasta rule, and safe unit-specific household staples

Stock Target Templates are suggestions copied into a household Stock Target and then independently editable. Seed updates never rewrite household quantities/criteria. Avoid unsafe templates combining incompatible dimensions, such as treating liquid and powder detergent amounts as directly interchangeable.

At sync time, compose the feature-local translation files into small embedded `translations` maps on global concept/attribute/template records, with `defaultLocale` and `defaultLabel`. The classification query resolves the requested locale, then default locale, and returns `usedFallback` so the UI can render honestly. Static Angular locale JSON remains responsible for buttons, errors, and UI sentences; it must not be expanded with one compile-time key per runtime concept.

Household-created concepts/attributes require a default label and creator locale; additional translations are optional embedded values. A missing locale falls back to the default label. Stage 8 does not perform automatic translation or require a full translation-admin surface.

### 3. Household stock batch (concrete supply layer)

Add `household_stock_batches`.

Required shape:

- `id`, `householdId`
- `originalQuantity` and `remainingQuantity` in an explicit unit compatible with the selected Stock Target
- `acquiredOn` as a calendar date; optional `expiryOn` as a calendar date
- `status: available | depleted | discarded | voided`
- optional `productId` and `shopProductId`
- immutable acquisition snapshot: display name and, where known, brand, measurements/package label, GTIN, source name/key/URL
- immutable classification snapshot: direct/effective Product Concept refs, Product Attribute refs, and capture source/time
- optional `purchaseOperationId`, `shoppingNeedListId`, and `shoppingNeedId`
- `revision`, create/update actor and timestamps; `depletedAt`/`discardedAt` where relevant

Invariants:

- Every acquisition creates a new batch unless the user explicitly records several indistinguishable units with the same product, acquisition date, expiry, and snapshot as one batch quantity.
- Catalogue references are nullable soft references. The snapshot is required enough to render the historical batch after catalogue change or removal.
- A manual Stock Batch has null Product/Shop Product ids and user-confirmed household/global classification refs.
- No-expiry batches store `expiryOn: null` and sort after dated batches under earliest-expiry-first.
- Remaining quantity is a transactionally maintained read model. The movement ledger is the durable explanation of how it changed.
- Depleted/discarded/voided batches remain queryable in history and are excluded from available totals.

### 4. Stock Allocation (counting boundary)

Add `household_stock_allocations` between Stock Batches and Stock Targets.

- A Stock Allocation contains household, Stock Batch, Stock Target, allocated quantity/unit, acceptance result (`accepted | overridden | criteria_changed`), criteria revision, actor/timestamps, status, and revision.
- Stage 8 permits at most one active allocation per available batch and allocates its full remaining quantity. A batch may remain unallocated and appears in an “unassigned stock” view.
- Stock Targets sum Stock Allocations, never classification-query results. Matching suggests or validates allocation; it does not count stock by itself.
- An explicit override with a bounded reason can allocate a manual or non-matching batch. The UI shows the exception.
- Changing Acceptance Criteria recalculates acceptance status but does not silently unassign or stop counting existing stock. The user must confirm reassignment/exclusion.
- Consumption, correction, discard, and depletion update batch and allocation quantities atomically.
- The separate allocation boundary leaves a future path to split one Stock Batch quantity among several Stock Targets, but multi-allocation is not enabled in Stage 8.

### 5. Stock Movement and command receipt

Add immutable `household_stock_movements` and idempotency records in `household_domain_operations`.

Stock Movement fields:

- `id`, `operationId`, `householdId`, optional `stockTargetId`, `stockBatchId`
- `kind: acquisition | consumption | correction | discard | migration_opening_balance | reversal`
- signed `quantityDelta`, resulting quantity, unit
- optional reason code/note with bounded length
- source references (Purchase/Shopping Need/Trip Item/corrected Stock Movement as applicable)
- actor and occurrence/create timestamps

Operation fields:

- client-generated `operationId`, operation type, household, actor, request fingerprint
- `status: started | completed | failed`
- response/result identifiers and timestamps
- unique `(householdId, operationId)` index

Rules:

- A retry with the same id and same fingerprint returns the completed result.
- Reuse of an id with a different fingerprint returns `409 idempotency_conflict`.
- Expected revision mismatches return `409 stale_revision` with current summary.
- Stock mutation, allocation change, movement insertion, and operation completion occur in one Mongo transaction. Stage 9 extends the same protocol to purchase/trip side effects.

### 6. Aggregated stock projection

The API derives each Stock Target total from active Stock Allocations and available Stock Batches:

- `availableQuantity`
- `minimumQuantity`, `targetQuantity`, and `stockStatus`
- next expiry and count of expired/expiring batches
- batch count and optional compact batch summaries
- explanation codes for low-stock and expiry notices

Allocated quantities are normalized to the Stock Target's `trackingUnit`. Stage 8 supports exact-unit aggregation and explicit conversions for `g <-> kg` and `ml <-> l` only if approved during implementation. Existing arbitrary labels migrate to stable custom unit codes and remain exact-match only.

### 7. Consumption and correction

- `POST .../consume` accepts a Stock Target, quantity, operation id, expected aggregate revision, and optional ordered Stock Batch selections.
- Without a user-selected order, a pure strategy selects allocated Stock Batches deterministically by the Stock Target consumption policy, then `acquiredOn`, then batch id.
- Partial consumption may span batches and records one movement per allocation.
- Insufficient stock returns an explicit expected failure without any mutation.
- `POST .../batches/{id}/correct` accepts a resulting quantity, reason, operation id, and expected batch revision; the server records the delta.
- Discard/deplete/void are explicit commands, not deletes. Voiding erroneous history requires an owner or an explicitly approved capability and creates a reversal/audit trail.

### 8. Shopping Need

Persist `household_shopping_need_lists` containing `ShoppingNeed` records:

- optional strong `stockTargetId` for generated demand
- planned quantity/unit and reason snapshot
- Acceptance Criteria snapshot and optional preferred Product hint plus immutable display snapshot
- state `open | skipped`
- line revision

An ad-hoc Shopping Need may omit `stockTargetId`. Stage 8 generates/edits Shopping Needs from Stock Target totals and exposes stable snapshots for Stage 9. It does not select a shop, calculate Product/Price Observation choices, process a Shopping Trip, create a Purchase, submit ingestion, or convert purchases to stock.

### 9. Membership and household boundary

- Day-to-day members may read household data, mutate stock through commands, and edit Shopping Needs.
- Owners additionally manage household identity, invitations/memberships, policy-destructive actions, and final archival.
- Add owner-created invitations for an existing controlled-alpha identity by email, with `pending | accepted | revoked | expired` state and a bounded token or server-side invitation id.
- The invited signed-in user explicitly accepts; acceptance creates one membership idempotently.
- Prevent removal of the last active owner and cross-household references.
- Return `403` for an authenticated non-member/insufficient role and `404` only where resource hiding is intentional; log the stable denial reason.

## Relationship Classification

| Relationship/data | Classification | Stage 8 rule |
| --- | --- | --- |
| Stock Target -> household | Strong reference | Required and membership-scoped. |
| Global concept -> global concept | Strong taxonomy edge | Stage 8 supports cycle-safe transitive `is_a`; child membership implies every ancestor concept. |
| Household concept -> household/global concept | Scoped strong taxonomy edge | Child must belong to the same household; a global parent is allowed; cross-household edges are forbidden. |
| Product -> direct Product Concepts/Attributes | Strong classification assignment | Effective classification includes inherited Product Concept ancestors; Product Attributes do not create ancestry; Product id remains identity. |
| Base content pack -> global concept/attribute/template | Seed provenance, not runtime authority | Idempotent sync owns untouched seeded fields; customized/archive conflicts are reported and never overwritten silently. |
| Product Concept/Attribute/Stock Target Template -> translations | Embedded localized content keyed by locale | Stable id drives Acceptance Criteria; translated/default labels are display data and missing locale falls back explicitly. |
| Stock Target Template -> Stock Target | Copy/snapshot | Template creates starting Acceptance Criteria/unit; later template sync never mutates the household Stock Target. |
| Stock Batch -> catalog/manual classification snapshot | Immutable snapshot | Freezes direct/effective Product Concepts/Attributes used for admission so classification edits do not corrupt household history. |
| Stock Batch -> Stock Target | Strong Stock Allocation record | Aggregation uses explicit active Stock Allocation, not implicit classification matches; Stage 8 allows one full-batch allocation. |
| Stock Movement -> Stock Batch/Stock Target | Strong historical reference | Stock Batch is required; Stock Target is retained when the action affected an allocation. |
| Shopping Need -> Stock Target | Optional strong reference | Required for generated needs, optional for ad-hoc intent until Shopping Trip resolution. |
| Stock Batch/Shopping Need choice -> Product/Shop Product | Optional soft reference | Id is retained when unavailable; no cascade from catalog. |
| Product name/brand/package/GTIN at acquisition | Immutable snapshot | Used for display/history and never silently refreshed. |
| Preferred Product on Stock Target | Optional preference reference + snapshot | Link can be cleared/replaced without changing Acceptance Criteria, Stock Allocations, or Stock Batch history. |
| Product variant/brand/package size | Catalog first-class fields or acquisition snapshot | Do not model identity solely as Product Concepts/Attributes. |
| Classification match result | Derived eligibility data | Uses direct/inherited Product Concepts plus direct Product Attributes and Acceptance Criteria; it suggests/validates Stock Allocation but never counts stock by itself. |
| Available total, next expiry, notice status | Derived data | Computed from active Stock Allocations, available Stock Batches, and Stock Target policy; may be cached only with revision/invalidation rules. |
| Manual Product | Snapshot with null catalog ids | Fully supported and later reconcilable. |

Products, Product Concepts, and Product Attributes should be archived by default rather than hard-deleted. A privileged maintenance purge must report Stock Target, classification-snapshot, and Stock Allocation impacts first and must never cascade into household collections. Household link resolution returns `linked`, `catalog_unavailable`, or `unlinked`; users can unlink or manually relink while snapshots remain unchanged. Automated match/merge reconciliation is Stage 9.

## Data Model And Migration

Create stable database-maintenance entries `catalog-classification-v1`, `household-stock-targets-v1`, and `household-products-v1` before collection work.

### Validator action

- Create final Product Concept relation and Product Attribute assignment storage with cycle-safe writes and relation indexes; legacy tag validators are migration input only.
- Create `household_products`, `household_stock_targets`, `household_product_concepts`, `household_product_concept_relations`, `household_product_attributes`, `household_stock_batches`, `household_stock_allocations`, `household_stock_movements`, `household_domain_operations`, and `household_invitations` with strict validators and indexes.
- Create `household_shopping_need_lists` with final Stage 8 fields. Keep legacy `household_shopping_lists` and `household_local_products` as read-only migration input rather than overloading them with final semantics.
- Create general `feature_flags`, `feature_flag_changes`, and `audit_events` collections as part of their own stable registry entry, `application-operations-foundation`.
- Add indexes for Product Concept edge uniqueness/redirects, household classification scope, Stock Target/status, Stock Batch/status/expiry, one active Stock Allocation per batch, operation id uniqueness, Stock Movement chronology, one active membership per household/user, invitation state, and active Shopping Need lookup.
- Remove the legacy unique household-stock index only as part of the cutover action; do not repurpose it in place.

### Idempotent data migration

Run legacy tag-to-classification migration before Stock Target matching is enabled. Run the household stock migration under an admin-visible global maintenance gate that blocks household writes and leaves reads available.

For legacy catalog tags:

1. Convert each non-null legacy `parentKey` into one stable `is_a` edge.
2. Reject/report missing parents, self-links, and cycles instead of silently accepting a broken closure.
3. Preserve direct product-tag assignments; inherited/effective tags are derived, not backfilled as fake direct assignments.

For every active/archived legacy stock row:

1. Create one Stock Target from its legacy `household_local_products` parent and stock policy. Give it unconstrained empty Acceptance Criteria and preserve the manual display name; legacy `stockGroupKey` or one linked concrete Product is not sufficient evidence to invent criteria.
2. When the legacy row has a trustworthy catalogue Product link, create or reuse one household-owned Household Product anchor for that household/product identity. Do not create an anchor merely from a generic display name.
3. Create a stable batch id derived from the legacy row id and set `householdProductId` only when the Household Product anchor is trustworthy.
4. Set `acquiredOn` from `stockedAt`, `expiryOn: null`, and `remainingQuantity` to legacy `currentAmount`.
5. Use current amount as the migration opening quantity; retain legacy `initialAmount`, original ids, and source metadata in bounded migration provenance rather than inventing consumption history.
6. Create exactly one full-remaining-quantity Stock Allocation from the Stock Batch to the migrated Stock Target and one `migration_opening_balance` Stock Movement with stable ids.
7. Preserve catalogue/source and direct/effective tag snapshots where trustworthy, but do not pretend a legacy `stockGroupKey` is a taxonomy rule.

### Idempotent base-content sync

This is reference-data synchronization, not a structural database migration and not a destructive demo reseed.

- Register `catalog_classification_base_v1` in the existing seed runner/seed ledger and call one reusable sync service from both `npm run seed` and an admin-only dashboard action.
- Provide admin preview and apply behavior with counts for create/update/unchanged/conflict/invalid. The action is authenticated, audited, logged, and does not require an environment flag for routine use.
- Seed records carry `seedPackId`, pack version, and checksum/provenance. Sync creates missing records and may update a seed-owned record only when its current seed checksum proves it has not been manually customized since the last sync.
- A customized, archived, redirected, or conflicting record is skipped and reported for operator resolution. Sync never deletes records removed from the checked-in pack, never reactivates archived content silently, and never touches household-scoped custom content.
- Re-running the same pack is idempotent. Adding a new checked-in entry/translation and syncing creates only the missing content. Updating a safe untouched seed entry preserves stable ids and hierarchy integrity.
- The admin UI should call this `Preview/Sync base classification content`, not “reseed,” to avoid implying delete-and-recreate semantics.

For legacy shopping lists:

- Preserve completed/archived v1 lists as historical snapshots.
- Convert active v1 lists to Shopping Needs where references and units are valid; archive with a visible migration reason only when deterministic conversion is impossible.
- Carry applied-line state forward so old purchases cannot be applied again.

For feature flags:

- Copy the two global records from `household_feature_flags` to `feature_flags` with stable keys and revisions.
- Seed code-defined defaults only when no persisted value exists; do not overwrite admin choices.
- Write a migration audit event without fabricating a human actor.

### Cutover and verification

- Migration is rerunnable and reports scanned/created/skipped/conflict counts, classification-edge problems, plus Stock Target/Stock Allocation reconciliation totals.
- Verify every legacy tag parent maps to one valid `is_a` edge; every legacy stock row maps to one Stock Target, Stock Batch, Stock Allocation, and opening Stock Movement; aggregate totals match exactly; no batch is allocated twice; no negative quantities exist; active legacy shopping-list state is accounted for; and unrelated households remain unchanged.
- Switch v2 reads/writes only after validator and migration actions are independently complete.
- Do not dual-write v1 and v2. Keep legacy collections read-only for rollback evidence until Stage 8 acceptance, then remove runtime dependencies in a separate commit; physical purge is deferred and requires a later explicit maintenance entry.
- Disable the maintenance gate after smoke validation. Remove the temporary cutover toggle and dead compatibility branch before Stage 8 closeout.

## Backend And API Changes

Use a versioned `household/v2` contract/domain area while leaving `v1` available only to migration code. Existing `/api/household/*` URLs may cut over because this is a controlled MVP, but request/response `schemaVersion` and tests must make the break explicit.

Proposed resource-oriented surface:

- `GET/POST /api/households`
- `GET/PATCH /api/households/{householdId}`
- `GET/POST /api/households/{householdId}/stock-targets`
- `PATCH /api/households/{householdId}/stock-targets/{stockTargetId}`
- `POST /api/households/{householdId}/stock-targets/{stockTargetId}/archive`
- `GET/POST/PATCH /api/households/{householdId}/concepts` plus explicit move/merge/archive commands
- `GET/POST /api/households/{householdId}/product-attributes` for household-scoped attribute classification
- `GET /api/product-classification?locale=...` and bounded Product Concept hierarchy/effective Product Attribute queries for Acceptance Criteria editing and Product matching, returning resolved label/fallback metadata
- `POST /api/admin/dashboard/classification-content/preview`
- `POST /api/admin/dashboard/classification-content/sync`
- `GET/POST /api/households/{householdId}/batches`
- `POST /api/households/{householdId}/batches/{batchId}/allocate`
- `POST /api/households/{householdId}/batches/{batchId}/unallocate`
- `PATCH /api/households/{householdId}/batches/{batchId}` for non-quantity metadata with revision
- `POST /api/households/{householdId}/stock-targets/{stockTargetId}/consume`
- `POST /api/households/{householdId}/batches/{batchId}/correct`
- `POST /api/households/{householdId}/batches/{batchId}/discard`
- `GET /api/households/{householdId}/stock-history` with bounded paging
- `GET/POST/PATCH /api/households/{householdId}/shopping-needs...`
- `GET/POST /api/households/{householdId}/invitations`
- `POST /api/household-invitations/{id}/accept` and owner revoke endpoint
- `GET/PATCH /api/admin/feature-flags`

API rules:

- Centralize household capability checks (`read`, `manage_stock`, `manage_list`, `manage_members`, `void_history`) instead of repeating raw role checks.
- Centralize Product Concept closure and Stock Target matching. API responses distinguish direct/inherited concepts, direct attributes, match explanation, allocation state, and Acceptance Criteria drift.
- Use explicit Result-style domain errors and stable machine codes for validation, unavailable catalogue link, incompatible unit, insufficient stock, duplicate, stale revision, invalid transition, and idempotency conflict.
- Introduce request/correlation ids in route context and pass them to logs/operations.
- Do not accept server-owned snapshots or resulting totals blindly from the browser; resolve catalogue records server-side and build bounded snapshots there.
- Do not auto-count every Product matching a filter. Stock Allocation commands validate the Acceptance Criteria and enforce the Stage 8 one-active-allocation invariant transactionally.
- Validate dates as date-only strings and quantities as finite non-negative decimal values with a documented precision. Expiry may precede acquisition because the official date and later household acquisition are distinct facts; the household policy `allowExpiredItems` defaults to `true` and can exclude expired stock from consumption/derived availability when set to `false`.
- Ensure at most one active Shopping Need set per household, or deliberately return the existing active set on idempotent create.
- Replace direct catalogue hard delete in ordinary admin UI with archive. Keep purge behind dependency inspection and explicit maintenance/admin confirmation.
- Keep route files as adapters; put selection, aggregation, notice, transition, and transaction logic in testable domain services/repositories.

## Frontend And UX Changes

### Stock Target and stock workspace

- Replace the one-row editor with grouped Stock Target entries showing accepted Product Concepts/Attributes, allocated available total, minimum/target, next expiry, status, and batch count. The displayed current amount is derived and read-only.
- Selecting a Stock Target opens its policy/Acceptance Criteria, then allocated concrete Household Products, then their Stock Batches. Physical unallocated Products and unanchored Batches have a separate compact group with the same drill-down/edit affordances.
- Provide a minimal Acceptance Criteria editor: required/accepted Product Concepts, required/accepted Product Attributes, and excluded Product Attributes. It shows inherited meaning, for example “spaghetti counts as pasta.” Do not expose arbitrary nested boolean expressions in Stage 8.
- Seeded Product Concepts, Product Attributes, and Stock Target Templates are the default browse/search suggestions. Users can start from a template, edit the copied Acceptance Criteria/units/limits, or create household-local content without leaving the workflow.
- Provide explicit actions: add batch, consume, correct batch, discard/deplete, edit definition, archive tracking.
- Add-batch form supports selecting or creating a reusable Household Product, quantity/unit, acquisition date, optional expiry, optional catalogue Product, and classification for manual content. It suggests a matching Stock Target but requires a visible Stock Allocation decision or leaves the batch unassigned.
- Household Product editing captures reusable display identity and classification; Batch editing captures only physical quantity/date/expiry and permitted historical metadata. Product-first unclassified entry and Target-first unanchored opening stock are both supported.
- Consume defaults to the configured order and previews allocations; an advanced control lets the user choose/reorder batches.
- Show expired and expiring states with reason text and calendar dates. A no-expiry batch is clearly labelled, not treated as malformed.
- History shows action, quantity delta, batch/product snapshot, actor label where appropriate, and time without exposing internal diagnostics.

### Catalogue connection

- Add a signed-in catalogue picker/search from Stock Target and Stock Batch forms, filtered by effective direct/inherited classification.
- Let a user set/clear a preferred Product on the Stock Target and select a concrete Product per purchased Stock Batch.
- Show manual/unlinked/catalogue-unavailable states clearly.
- Show why a Product matches or fails (`missing required`, `no accepted any-of`, `excluded`) and whether Product Concepts/Attributes were direct, inherited, or household-added.
- Provide minimal household Product Concept/Product Attribute creation and assignment without exposing global classification editing to ordinary users.
- Resolve runtime classification labels from the API for the active language, display default-label fallback when needed, and keep UI chrome/errors in existing Angular locale files.
- Display catalogue data as suggested metadata; the user confirms quantity/unit and expiry because crawler/package data may be incomplete.
- Do not expose Product Concepts or Product Attributes as if they were Product identity links.

### Shopping Needs

- Generate one editable Shopping Need set from Stock Target shortages, with quantity/unit, reason, and Acceptance Criteria snapshot.
- Keep unresolved/ad-hoc generic lines usable without a catalogue product.
- Allow Shopping Needs to be skipped or restored without ambiguous bought/application booleans.
- Make the Stage 9 handoff explicit in the DTO/domain boundary, but do not add shop selection, automatic product matching, price calculation, trip processing, or purchase-to-stock conversion in Stage 8.
- Remove or clearly demote the receipt-upload placeholder so the manual MVP path does not imply a working import.

### Adjustable home workspace split

- Keep the existing Household/Shopping home composition and right-side editors. On desktop/tablet layouts where both primary blocks are visible, add one accessible divider grip that changes their width ratio without changing routes or domain state.
- Default is the current 50/50 balance. Clamp each side to a usable minimum (implementation default: 30/70 through 70/30) and provide keyboard arrow adjustment plus a reset-to-even action. Pointer/touch dragging updates a preview smoothly; persist the last ratio as a local UI preference only.
- On narrow stacked/mobile layouts, hide the ratio grip and retain normal responsive stacking; do not invent a second mobile state model in Stage 8.
- Resizing reveals more rows/content through the existing responsive tables; it does not add hidden business actions, duplicate editors, or encode Household/Shopping selection in persisted domain data.
- Defer the richer tri-state focused mode: animated expansion of one block, compact collapse of the other, and multi-row quick-action table rows. Capture it as a post-MVP home-workspace direction to revisit after real Alpha use identifies which management actions deserve inline placement.

### Household management

- Replace placeholder identity/invite cards with owner/member list, invite-existing-user flow, accept/revoke behavior, and role-appropriate controls.
- Keep create-household available.
- Explain owner-only controls and prevent last-owner removal in UI and server.

### Contract consistency and accessibility

- Prefer a browser-safe shared v2 contract package. If that is disproportionate, add exact contract fixture/parity tests between server serialization and frontend types; do not rely on manual duplicate edits.
- Add English/Hungarian locale parity for every new state and error.
- Preserve keyboard operation, labelled controls, non-color notice text, mobile shopping usability, and confirmation for destructive/history-affecting actions.

## Expiry And Notice Logic

- Store acquisition/expiry as calendar dates; compute against the household/user-local calendar date, not UTC instants.
- `expired`: `expiryOn < today` and remaining quantity > 0.
- `expires_today`: `expiryOn == today`.
- `expiring_soon`: `today < expiryOn <= today + expiryWarningDays`.
- `buy_before` is an explanation date derived from expiry, warning buffer, and current low-stock state; do not persist it as independent truth.
- Low-stock and expiry are independent reasons. One item can be well stocked but expiring, or low with no expiry.
- Aggregate notice response contains multiple reason codes and the contributing batch ids/quantities.
- Earliest-expiry-first places expired batches first for consumption visibility, then dated batches ascending, then no-expiry batches; ties use acquisition date and id.
- Stage 8 does not infer shelf life or consumption rate. Users enter dates and warning buffers explicitly.

## Feature-Toggle Architecture And Documentation

### Runtime design

- Move cross-cutting flags to `feature_flags`; keep flag definitions in a typed code registry with key, purpose, owner, default value, failure value, rollout scope, and removal condition.
- Provide one injected evaluator; feature code imports typed keys/helpers and never reads Mongo or repeats raw key strings.
- Missing records use the code-defined default. Storage/evaluation failure uses the code-defined failure value; risky access, writes, email, cron, maintenance, or destructive behavior fails closed.
- Cache globally evaluated values for a short bounded TTL. Admin writes invalidate the local cache; other serverless instances converge within the documented TTL. A last-known value may be used only within an explicit maximum-stale window and never to enable fail-closed behavior after storage failure.
- Store `revision`, last actor/time, and optional bounded change reason. Append every change to `feature_flag_changes` and `audit_events` with old/new values.
- Start with `scope: global`. Define an evaluation-context interface (`householdId`, `userId`, role, stable rollout key) for future extension, but do not implement targeting or percentage allocation in Stage 8.
- Admin UI lists registry metadata and effective/default/failure values, asks for a reason on sensitive flags, and warns about propagation delay.
- Temporary migration flags have an owner and removal step in this plan; no permanent compatibility flag remains at closeout.

### When to use toggles

Use for staged/risky behavior, kill switches, controlled access, external side effects, scheduled jobs, and short migration cutovers. Do not use for permissions, permanent configuration, schema versioning, ordinary user preferences, unfinished code with no safe disabled path, or mutually exclusive domain states.

Update `.agents/coding-guidelines.md`, `docs/architecture.md`, `docs/tech-ops.md`, and a focused `docs/feature-toggles.md`. The coding guidance must require typed centralized evaluation, explicit defaults/failure behavior, tests for both branches, admin/audit metadata, and a removal condition.

## Logging Architecture And Documentation

Extend the existing console/JSONL transport rather than replacing it with a vendor platform.

Add a typed domain logging facade with:

- stable `eventName` and `eventVersion`
- `classification: diagnostic | domain | warning | error | audit`
- severity `debug | info | warn | error`
- `outcome`, `errorCode`, request/correlation/operation id
- safe identifiers: household, Stock Target, Product Concept/Attribute/relation, Stock Allocation, Stock Batch, Shopping Need, Product/Shop Product, maintenance entry
- actor reference only where needed; operational logs should prefer an opaque id and audit storage may retain the authorized application user id
- centralized redaction and bounded serialization

Logging policy:

- Debug: local decision inputs/allocations behind debug level; disabled/noisy in normal hosted operation.
- Info/domain: successful Stock Batch creation, consumption/correction summary, expiry evaluation summary when actionable, Shopping Need transitions, and Product link/unlink. Reserve the same event vocabulary for Stage 9 Purchase conversion and catalog promotion outcomes.
- Warn: expected but significant validation failures, stale revision/idempotency conflicts, catalogue-unavailable references, recoverable reconciliation problems, and authorization denials.
- Error: infrastructure failure, failed transaction, impossible state, migration/repair failure, or unexpected transition.
- Audit: feature-toggle changes, maintenance acknowledgements/actions, base-classification sync preview/apply outcomes and conflicts, catalogue archive/purge/promotion/merge decisions, membership/owner changes, history void/reversal, and other privileged changes. Persist applied privileged changes in `audit_events`; previews emit diagnostics but do not pretend a write occurred.

Do not log passwords/tokens, raw request bodies, notes, household/product display names, full emails, source payloads, or unrestricted URLs. Validation logs contain field/error codes, not rejected values. Avoid generic success request logs and duplicate logging from route/repository/domain layers; the domain command owner emits the canonical action event.

Update `.agents/coding-guidelines.md`, `docs/logging.md`, and relevant package `AGENTS.md`/README guidance. Instrument household commands as they are implemented, then cover existing feature toggles, migrations, catalogue promotion/product management, and authorization boundaries named by the user.

## Ordered Implementation Steps And Commit Boundaries

Each step is a review checkpoint. The default is preparation of one commit-sized diff; do not create commits unless the user asks. Steps may be split further if a diff becomes hard to review, but must not be merged into a broad rewrite.

Execution rule for budget-focused implementation models: implement only the named step and final terms in `docs/domain-language.md`; inspect the listed likely files plus the nearest `AGENTS.md`/README; preserve unrelated changes; run the step validation before reporting. Do not infer richer criteria grammar, allocation optimization, migration fallback, UI states, or compatibility behavior. If a stated invariant cannot be met with the current repository shape, stop that step with the exact conflicting file/schema and revise the plan instead of improvising.

### Step 1 - Lock final Product Classification, Stock Target, Stock Batch, and infrastructure contracts

- Goal: Create `docs/domain-language.md`; add typed Product identity/Household Product anchor, Product Concept relation/effective-closure and Product Attribute contracts plus final `StockTarget`, `AcceptanceCriteria`, classification snapshot, `StockAllocation`, `StockBatch`, `StockMovement`, date/quantity/unit, capability, transaction, idempotency, and `ShoppingNeed` vocabulary before persistence or UI changes.
- Likely files: catalog v2/current taxonomy helpers, new `household/v2/*`, household/catalogue READMEs, Mongo abstraction/test support, contract/schema snapshots.
- Acceptance:
  - Contracts distinguish global Product identity, reusable household Product identity, direct/effective classification, Stock Target, match result, Stock Batch, Stock Allocation, Stock Movement, operation, and Shopping Need, with an explicit Stage 9 extension seam.
  - `is_a` closure is deterministic and rejects cycles; flat typed Acceptance Criteria return explainable results.
  - The one-full-batch-allocation Stage 8 invariant prevents double counting while allowing unassigned stock.
  - Unit/date/precision and lifecycle invariants are executable validators.
  - Consumption ordering/aggregation helpers cover no-expiry and tie cases.
  - A configured transaction smoke proves rollback/commit behavior against the supported Mongo topology; unit tests cover the abstraction on every relevant PR.
- Validation: focused v2 contract/domain tests, schema snapshots, typecheck.
- Commit idea: `feat: define household stock batch v2 contracts`

### Step 2 - Generalize feature toggles and structured logging foundations

- Goal: Create the typed application feature registry/evaluator, safe caching, persistent change/audit records, request correlation, and typed logging facade without changing household runtime behavior yet.
- Likely files: new `feature-toggles/*`, logging package, app route context, admin flag route/UI, schemas, docs.
- Acceptance:
  - Existing flags evaluate through the centralized provider with explicit default/failure values.
  - Admin changes persist old/new/reason/revision and an audit event.
  - Storage-failure tests prove sensitive flags fail closed.
  - Cache TTL/invalidation behavior is deterministic under fake time.
  - Stable structured event tests prove redaction and bounded details.
- Validation: feature/logging/admin route tests, typecheck, lint.
- Commit idea: `feat: add application feature flags and domain logging`

### Step 3A - Register and migrate final Product Classification

- Goal: Add `catalog-classification-v1`, final Product Concept/Product Attribute collections/indexes/validators, legacy category `parentKey` migration, closure/cycle validation, and impact reporting before Stock Target Acceptance Criteria depend on inherited Product Concepts.
- Likely files: database-maintenance registry/routes, catalog contracts/schemas/repository/taxonomy module, fake Mongo support, dev-admin maintenance UI.
- Acceptance:
  - Validator and migration completion remain independently tracked.
  - Running migration twice creates no duplicate edges and reports skips.
  - Legacy parent pointers become valid `is_a` edges; broken/missing/cyclic input is reported without fabricating closure.
  - Direct legacy Product tag assignments migrate to direct Product Concept/Attribute assignments; effective ancestors are derived.
  - Migration failure stops `Run all`, logs an actionable event, and leaves the gate enabled until an operator resolves or deliberately disables it.
- Validation: taxonomy fixture/migration/closure tests, registry route tests, configured database smoke.
- Commit idea: `feat: add inclusive product classification`

### Step 3B - Register and implement the idempotent Household Product/Stock Target/Stock Batch migration

- Goal: Add `household-stock-targets-v1` and `household-products-v1`, final household Product/Classification/Stock Target/Stock Batch/Stock Allocation/Stock Movement collections, compatibility validators, migration mapping, reconciliation report, and household maintenance write gate.
- Likely files: database-maintenance registry/routes, household repository/migration module, schemas, fake Mongo support, dev-admin maintenance UI.
- Acceptance:
  - Validator and migration completion remain independently tracked.
  - Running migration twice creates no duplicate Stock Targets, Stock Batches, Stock Allocations, or Stock Movements and reports skips.
  - Legacy aggregate amounts and policy fields match v2 allocation output exactly.
  - No-expiry/opening-balance and legacy classification provenance are explicit.
  - No Stock Batch has multiple active Stock Allocations and unclassifiable legacy rows remain usable through unconstrained migrated Stock Targets.
  - Migration failure stops `Run all`, logs an actionable event, and leaves the gate enabled until an operator resolves or deliberately disables it.
- Validation: fixture migration tests including active/archived/zero/custom-unit/manual/catalogue-linked rows, registry route tests, configured database reconciliation.
- Commit idea: `feat: migrate household stock targets and batches`

### Step 3C - Add the localized base classification content pack and sync surfaces

- Goal: Add the checked-in JSON manifest plus English/Hungarian feature-local translations, schema/parity validation, idempotent seed-ledger sync service, `npm run seed` registration, and admin preview/sync control.
- Likely files: new classification base-content files/schema/loader/sync service/tests, seed registry/repository, focused admin route/card/service, `scripts/README.md`, classification documentation.
- Acceptance:
  - The bounded milk/bread/eggs/pasta/detergent/staples Product Concept set, required Product Attributes, and safe Stock Target Templates validate with stable ids and cycle-free parents.
  - English and Hungarian entries have exact parity; unknown/missing translation ids fail tests.
  - First sync creates missing content; identical sync is a no-op; adding one pack entry creates only that entry.
  - Untouched seed-owned records update safely; customized/archived/conflicting records are skipped and reported; household content is never deleted or overwritten.
  - Admin preview performs no writes; apply is admin-only, audited, and returns bounded counts. CLI/admin use the same core service.
  - Locale queries return requested/default labels and explicit fallback state.
- Validation: content schema/parity/closure/template snapshots, sync idempotency/conflict tests, seed ledger tests, admin authorization/preview/apply route tests, locale API tests.
- Commit idea: `feat: seed localized classification base content`

### Step 4 - Implement atomic Stock Target, Stock Batch, and Stock Allocation services

- Goal: Add taxonomy matching plus transactional batch create/classify/allocate/unallocate, consume, correct, discard/void, history, aggregate reads, revision checks, and idempotent operation receipts.
- Likely files: `household/current` v2 services/repository, Mongo client abstraction, tests.
- Acceptance:
  - Generic/manual and explicit Products can be allocated to one matching Stock Target while retaining separate dates and snapshots.
  - A spaghetti Product inherits pasta; Product Attribute `diet.gluten_free` and accepted pasta-child any-of criteria enforce the example with explainable failures.
  - One Stock Batch cannot be actively allocated twice; Acceptance Criteria matching alone never increases an aggregate.
  - Partial deterministic consumption updates the intended batches and movements.
  - User-selected allocation is validated and honored.
  - Insufficient stock, stale revision, duplicate retries, and conflicting idempotency ids do not partially mutate.
  - Zero-remaining batches become depleted; no-expiry batches remain valid.
- Validation: pure strategy tests, repository tests, real-transaction smoke, concurrent double-submit tests.
- Commit idea: `feat: add atomic household stock commands`

### Step 5 - Cut household stock APIs to v2 and enforce capabilities

- Goal: Expose resource/command routes, stable Result errors, paged history, correlation ids, and capability checks; retire legacy stock mutation endpoints from runtime.
- Likely files: focused household route slices, app handler, v2 validation, auth/capability helper.
- Acceptance:
  - Member/owner/non-member cases match the capability matrix.
  - API never trusts client totals or catalogue snapshots.
  - `409` responses distinguish stale revision, invalid state, active duplicate, and idempotency conflict.
  - v1 routes cannot mutate after cutover.
  - Domain action/failure logs contain required safe identifiers once.
- Validation: route integration tests and authorization matrix tests.
- Commit idea: `feat: expose household stock batch api`

### Step 6 - Add Stock Target, Acceptance Criteria, Stock Allocation, Stock Batch, expiry, history, and adjustable-home UX

- Goal: Make the batch model usable before shopping conversion depends on it.
- Likely files: household services/contracts, stock panel/editor replacement components, i18n, home/management composition.
- Acceptance:
  - Users can create a Stock Target without a Product, configure minimal inclusive Acceptance Criteria, and add/allocate multiple generic/manual or explicit Stock Batches.
  - Unassigned and overridden/criteria-changed Stock Batches are visible and do not change totals unexpectedly.
  - Totals and next expiry update after add/consume/correct/discard.
  - Allocation preview and manual selection are understandable.
  - Expired/expiring/no-expiry states are accessible and localized.
  - Stale revision returns reload/retry guidance rather than overwriting.
  - Desktop/tablet divider adjusts and locally remembers a clamped Household/Shopping ratio, is keyboard operable, resets to 50/50, and disappears on the stacked mobile layout without affecting either editor or domain state.
- Validation: component/service tests where useful, locale parity, desktop/mobile browser walkthrough.
- Commit idea: `feat: add household batch inventory workspace`

### Step 7 - Add concept organization and safe household-to-catalogue linking

- Goal: Add global `is_a` hierarchy reads, effective concept/attribute catalogue filtering, household concept create/rename/move/merge/archive, household attributes, catalogue picker, preferred product, per-batch classification/product snapshot, link health, manual unlink/relink, and archive/dependency rules.
- Likely files: household/catalogue services and routes, catalog repository/admin UI, product picker components, schemas/tests.
- Acceptance:
  - A Stock Target and manual Stock Batch work with no Product link.
  - Different Stock Batches allocated to one Stock Target may link to different Products or none.
  - `Pilos 1.5% milk` remains a product with milk/fat facets; inherited concepts and independent facets are not collapsed into one false hierarchy.
  - Household Product Concepts can inherit from global/same-household Product Concepts, while household Product Attributes classify local content without modifying shared catalog classification.
  - Product Concept move rejects cycles and previews affected Stock Targets; merge redirects live references transactionally and preserves historical snapshots/audit.
  - Manual batches render with null ids.
  - Archived/deleted/merged-source catalogue data does not break batch/history rendering.
  - Ordinary delete becomes archive; purge reports dependencies and never cascades household data.
  - Product Concepts/Attributes are persisted classification/eligibility references and snapshots, while Product/Shop Product ids remain identity.
- Validation: catalogue-household integration tests, archive/unavailable/relink cases, admin permission tests.
- Commit idea: `feat: connect household batches to catalog products`

### Step 8 - Create final Shopping Needs

- Goal: Convert active legacy shopping lists to Shopping Needs, remove ambiguous Purchase/application booleans, and create a clean Stage 9 handoff without implementing a Shopping Trip prematurely.
- Likely files: shopping contracts/helpers/repository/routes and generic-list components.
- Acceptance:
  - Generated Shopping Needs use the Stock Target's Stock Allocation aggregate, policy, and Acceptance Criteria snapshot, not a Stock Batch row or an unconstrained classification query.
  - The one-active-Shopping-Need-set invariant and duplicate behavior are explicit.
  - Manual ad-hoc and unresolved generic lines remain usable.
  - Skip/restore/cancel transitions are explicit and idempotent.
  - No Stage 8 route writes catalogue prices or pretends a generic line is a completed purchase.
- Validation: Shopping Need generator/domain/repository/API tests and browser flow.
- Commit idea: `feat: generate household shopping needs`

### Step 9 - Complete expiry/low-stock notices and repeat workflow

- Goal: Produce explainable combined notices and make generic list generation repeat cleanly after consumption or manual stock addition.
- Likely files: notice helpers/routes, home panel, shopping generator, i18n.
- Acceptance:
  - Low-stock and expiry reasons coexist without overwriting.
  - Buy-before explanation is derived and traceable to policy/batches.
  - Items without expiry have no false expiry warning.
  - After closing one Shopping Need set and consuming stock, the next set uses current Stock Target allocation aggregates without manual reconstruction.
  - Recently closed Shopping Need sets remain history and are not returned as active.
- Validation: date-boundary/locale/ordering tests, full loop API test, browser walkthrough.
- Commit idea: `feat: add explainable household expiry notices`

### Step 10 - Implement create-or-join household management and ownership rules

- Goal: Replace placeholder management UI with member listing and invite/accept/revoke flow for existing controlled users.
- Likely files: household membership contracts/repository/routes, management component, i18n, access docs.
- Acceptance:
  - User can create a household or accept one valid invitation.
  - Non-owner cannot invite/remove; last owner cannot be removed.
  - Repeated acceptance is idempotent and cross-household access remains denied.
  - Invitation identifiers expire/revoke safely and no raw secret is logged.
- Validation: role/ownership/invitation tests and two-user browser smoke.
- Commit idea: `feat: complete household membership workflow`

### Step 11 - Instrument remaining required domain/admin events

- Goal: Apply the logging/audit taxonomy to feature changes, household commands, expiry, shopping transitions, catalogue link/reconciliation state, crawler promotion/product management, migrations/repairs, authorization, validation, and unexpected transitions.
- Likely files: domain services/routes across household/catalogue/ingestion/maintenance, logger tests, docs.
- Acceptance:
  - Required event matrix is documented and covered by representative tests.
  - No raw request/form/source payload or credential appears in captured logs.
  - Administrative changes are queryable in persisted audit history.
  - Routine GET/low-level success noise is absent.
- Validation: logger capture assertions, redaction tests, manual local JSONL review.
- Commit idea: `chore: add domain and audit event coverage`

### Step 12 - Remove compatibility paths, refresh seeds/docs, and close Stage 8

- Goal: Remove temporary cutover flag/dead v1 runtime code, update demo data to multiple batches/expiries, document operations, and run full acceptance.
- Likely files: old household current/v1 runtime references, seeds, `docs/household.md`, architecture/tech-ops/logging/feature-toggle docs, roadmap, scripts README if smoke behavior changes.
- Acceptance:
  - No runtime write uses `household_stock_items` or v1 completion logic.
  - Temporary migration/compatibility flag and raw string checks are removed.
  - Demo includes an unconstrained milk Stock Target, gluten-free accepted-type pasta Acceptance Criteria, inherited Product Concept matching, generic/manual and explicit Stock Batches, an unassigned Stock Batch, two different expiries, partial consumption history, and generated Shopping Needs.
  - Maintenance registry state and rollback evidence are documented; legacy physical purge remains explicit/deferred.
  - Full MVP checklist below passes.
- Validation: full automated suite, build/lint/typecheck, database smoke, locale parity, desktop/mobile/two-user manual journey.
- Commit idea: `docs: close stage 8 household foundation`

## Testing Strategy

### Pure domain tests

- Tag DAG closure, multiple parents, missing parents, self/cycle rejection, and direct-versus-inherited explanations.
- Stock Target Acceptance Criteria matching for catalog and household-qualified Product Concept/Attribute references.
- Stock Allocation uniqueness, unassigned stock, mismatch override, criteria-change drift, and no double counting across overlapping Stock Targets.
- Batch ordering: expired, earliest expiry, same-date tie, no expiry, acquisition fallback.
- Partial and multi-batch consumption; exact depletion; insufficient stock.
- Corrections up/down/zero and discard/void/reversal invariants.
- Aggregate total, low-stock, expiry, and combined notice explanations.
- Unit compatibility and precision boundaries.
- Shopping Needs from aggregate Stock Target policy and explicit shortage reasoning.
- State transition tables for batches, lists, lines, invitations, and operations.

### Contract/schema tests

- Stable snapshots for every new Mongo record/API response.
- Base-content manifest and per-locale translation parity, stable ids, parent existence/cycles, Stock Target Template criteria/unit compatibility, and embedded translation output.
- Validators reject invalid/cross-household Product Concept edges, unqualified Product Concept/Attribute refs, cyclic application writes, duplicate active Stock Allocation, and unsupported nested Acceptance Criteria expressions.
- Validators reject negative/NaN quantities, invalid dates, missing snapshots on linked historical records, and illegal statuses; expiry-before-acquisition is valid and remains an explicit historical state.
- Frontend/server parity fixtures if shared browser-safe contracts are not introduced.

### Repository/migration tests

- Idempotent migration and conflict reporting.
- Base-content first/repeat/additive/update/conflict/archive sync behavior through both shared core and admin route; seed ledger/audit provenance.
- Parent-key-to-Product-Concept-relation migration, effective closure, classification snapshot preservation, and classification/archive dependency reporting.
- Existing arbitrary units and null links.
- Index uniqueness and validator upgrade behavior.
- Transaction rollback on each injected failure point.
- Optimistic concurrency and simultaneous operation-id requests.
- No cross-household query/update leakage.

### API/auth tests

- Unauthenticated, non-member, member, owner, and admin-without-membership matrices.
- Stable expected error codes/statuses.
- Catalogue archive/unavailable/manual relink.
- One active Shopping Need set, skipped/restored need, ad-hoc need, multiple expiry Stock Batches, and repeated generation.
- Invite accept/revoke/expire/repeat and last-owner guard.

### Feature/log/audit tests

- Missing/default/failure flag behavior, cache expiry, mutation invalidation, revision conflict, history append.
- Typed event shape, correlation propagation, safe serialization/redaction, classification/level mapping.
- Audit persistence for privileged changes and no duplicated domain event.

### End-to-end/manual

The human verification list is maintained centrally in `.agents/plans/stage8-10-manual-acceptance-checklist.md`; keep this section aligned with that file rather than creating a second checklist.

- Run a two-user create/invite/join flow.
- Create `concept.pasta.spaghetti is_a concept.pasta`, then configure “10,000 g pasta; gluten-free; penne/spaghetti/tagliatelle” and verify matching/non-matching product explanations.
- Sync the checked-in base pack from admin, create a Stock Target from a localized Stock Target Template, switch English/Hungarian labels, and confirm a missing custom translation falls back without changing Acceptance Criteria identity.
- Allocate generic manual pasta and multiple explicit Products to the Stock Target; verify overlap does not double-count and an unassigned Stock Batch stays outside the total.
- Create bread; add old and new batches with different expiries; consume partially; correct one batch.
- Generate Shopping Needs from aggregate shortage, edit/skip/restore them, then manually add a later Stock Batch and verify regenerated needs.
- Archive/unpublish the linked catalogue product and confirm household stock/history remains usable.
- Check English/Hungarian, keyboard, narrow mobile shopping view, stale-tab guidance, admin flags/audit/maintenance.

Standard closeout commands:

```powershell
npm test -- packages/kamra-api-server/src/household
npm test -- packages/kamra-api-server/src/http/app-handler.test.ts
npm run typecheck
npm run test
npm run lint
npm run build
```

Add a configured database smoke command for v2 transactions/migration/reconciliation and document its safety/required environment before use.

## Stage 8 Scope

### Home workspace refinement (2026-07-11)

- Replace the temporary side-by-side comparison with one compact, scrollable grouped Stock Target table. Keep a fixed header with **Name**, **Current**, **Minimum**, **State**, and a right-aligned edit action.
- Render hierarchy through stable grid columns: Stock Target rows are the primary entries; concrete Household Products and their Stock Batches are indented child rows with a quieter token treatment. Do not use name-dependent flex placement for actions or variable-width quantity prefixes.
- A Stock Target expands to its Products and Batches. Its row can open an inline Target editor for name, unit, minimum, target, warning days, and policy. Batch rows are read-only until their own Edit action opens an inline physical-stock editor with labelled Quantity, Stocked at, and Expiry fields.
- Selecting a Product opens the dedicated right-side Product editor; do not overload Batch editing with reusable Product identity/classification editing. Product-specific minimum/target policies need a dedicated child-target/reservation model and are deferred until after MVP rather than being represented by ambiguous Batch fields. Drag-and-drop classification is also deferred post-MVP.
- The legacy v1 stock editor is not a valid creation/edit surface once grouped v2 Home is shown: it writes `household_local_products` and `household_stock_items`, which v2 Home intentionally does not read. Replace its active Home role with a v2 Product editor. A Product may exist without a Batch and appears in Unassigned as an empty Product entry. The editor may optionally create the first positive-quantity Batch after Product creation; if that Batch fails, preserve the Product and report the failed stock creation explicitly. Do not create a fake zero-quantity physical Batch merely to make a Product visible.
- Adding further manual stock for an existing Product is an explicit **Add batch** action under that Product or in the Unassigned footer; it creates a new physical Batch. Shopping-list completion becomes the preferred purchase-to-batch path in Stage 9, not the only way to add stock.
- A newly created manual Batch starts unassigned unless the user explicitly selects a Stock Target and the server validates/creates its Allocation in the same transaction. Do not infer allocation from another Batch of the same Product; a Target assignment control is the next editor slice.
- Product Concepts are separate classification vocabulary, not stock rows. Home must not create, rename, or group by household-local Product Concepts during Stage 8; the existing persistence/API remains available for later catalogue/classification work, but its temporary Home controls are removed. Product-to-Concept association/de-association and drag-and-drop classification are deferred post-MVP.
- Household-level policy belongs in Manage household, not Home. Manage household owns editable household name, default calculated max-limit multiplier, and `allowExpiredItems`, plus a clearly marked invitation placeholder.
- Shopping-list selection is a distinct two-step state: **Build shopping list** selects the scale-eligible rows, exposes checkboxes, and becomes **Generate shopping list**; changing scale resets the selection from eligibility, cancellation exits the mode, and generation exits it after persisting only checked rows. This requires v2 Shopping Need/Target-backed list creation; do not pass grouped v2 row ids to the legacy v1 list endpoint.

### Stock Target-first editing model (2026-07-12)

- Home terminology uses **Stock Target** (or the shorter user-facing **stock group**) for the top-level generic household need. It owns minimum/target quantities, unit, state, and policy. It is not a Product Concept.
- The primary table has exactly three editable domain layers: Stock Target (plus the Unassigned group), Household Product, then Stock Batch. Product classification is intentionally absent from this workspace until seeded catalogue classification has a dedicated MVP design.
- Rows use stable icon buttons with accessible names: edit/cancel/save, details, add Product on a Stock Target, and add Batch on a Product. A persisted Batch has an explicit history-preserving discard action; a new draft only has Cancel.
- Stock Target details contain minimum, target/max, tracking unit, and existing policy fields. Product details contain supported identity metadata (GTIN, optional catalogue Product id, and a bounded household note added with the Product identity contract). Batch rows directly expose quantity, unit, stocked-at, and expiry.
- Adding a Product from a Stock Target preselects that Target only for an optional first Batch. Saving a Product without a Batch leaves it visibly Unassigned; it must not imply an allocation. Adding a Batch from a Product inside a Target creates its allocation only when the user confirms that Target and server validation succeeds in the same transaction. Batches created from Unassigned remain unassigned until explicitly allocated.
- The table is the complete primary CRUD surface. After it is coherent, the right side becomes a compact three-block composer (Target, Product, Batch) that mirrors only unsaved draft names. Its action labels make scope explicit: create Target, create Product, create Batch, or create all missing levels atomically from the Batch block. Editing a saved Target never renames concrete Products or immutable Batch snapshots.

### Home Stock Group / Product / Batch redesign (implementation gate, 2026-07-12)

The interim grouped Home UI is not the requested final interaction model. It was built against the original Batch-to-Stock-Target allocation model and must not be extended piecemeal. The next implementation run first changes the household stock ownership model, then replaces the UI as one coherent slice.

#### Adopted terminology and model

- **Stock Group** is the user-facing replacement for the current **Stock Target**. It is a household stock policy with a name, tracking unit, minimum, target/maximum, state, and optional parent Stock Group. API/storage migration may retain stable `stockTargetId` identifiers temporarily, but Home copy, contracts introduced for this slice, and new maintenance entries use Stock Group consistently.
- **Product Concept** remains classification/tagging vocabulary. It is not a Home grouping layer and Home does not create, rename, or assign it. Therefore every earlier request referring to a “concept row” in Home means a **Stock Group row**; the requested Product assignment dropdown is a **Stock Group assignment dropdown**, not a Product Concept selector.
- A Household Product belongs to zero or one direct Stock Group through `stockGroupId`. Its physical Stock Batches always belong to that Product. A generic manual Product covers need-first opening stock, so the normal UI has no anonymous top-level Batch.
- A Stock Group can have a parent. A Product’s available Batches count toward its direct Group and that Group’s ancestors exactly once; Products are never directly assigned to multiple sibling Groups. This supports a nested `Bread → White bread → White loaf` structure without a second unrelated allocation.
- Product-level minimum/target limits are independent of the enclosing Group limits. Product state is derived from its active Batches; Group state is derived from direct and descendant Products. Batch quantity, acquisition date, expiry date, and movement history remain physical facts and are never copied to Product or Group records.
- Existing `household_stock_allocations` are legacy migration input/history after this cutover, not a parallel live grouping mechanism. New Home writes must not maintain both Product→Group and Batch→Target allocation state.

#### Required safe cutover before UI work

1. Add database-maintenance registry entries for the Stock Group/Product relationship and any Group-parent/Product-limit validator changes. Validator upgrade and existing-data migration stay independently acknowledged.
2. Extend `household_stock_targets` (or introduce a deliberately named successor collection) with optional `parentStockGroupId`; extend `household_products` with nullable `stockGroupId`, Product limit policy, bounded `gtin`, optional catalogue Product id, and bounded note. Add indexes for household/group/name ordering and parent lookup.
3. Migrate/reconcile live allocations deterministically:
   - a Product whose active Batches all allocate to one Target receives that Target as `stockGroupId`;
   - unallocated Products and generic opening Batches become visible under Unassigned (an opening Batch without a Product gets a generated generic manual Product before cutover);
   - a Product whose active Batches allocate to different Targets is reported as an operator conflict and stays Unassigned until an explicit Group is selected; no quantity is silently moved or deleted;
   - allocation and movement records remain historical evidence, with a durable cutover marker/reconciliation report; parent Groups are never inferred.
4. Replace aggregate/read/write commands in one transaction-aware slice: create/update/move Product, create/update/archive Stock Group, and create/correct/discard Batch. A Product Group move validates units and recalculates source/destination/ancestor states atomically. Consumption and Shopping Need generation use Product/Group membership after cutover, not active allocations.
5. Only after migration/reconciliation tests and the configured transaction smoke pass may the old Allocation controls/read grouping be removed from Home. Keep historical allocation display available in history, not as an editable Home action.

#### Left table: the complete primary CRUD surface

The fixed-header table remains compact and scrollable. Its stable columns are **Name**, **Current**, **Minimum**, **State**, and **Actions**. Rows use a real grid, quiet nested surfaces, and fixed action space; variable names or quantities cannot shift controls.

1. **Stock Group and Unassigned rows** form the first layer. Groups are alphabetically ordered among siblings, then recursively show child Groups before Products. Unassigned is a persistent pseudo-group after normal Groups and has no editable limits.
   - The core Group row shows its derived Current, Minimum, State badge, expand control, and icon actions.
   - Pencil starts inline edit for the Group name; it becomes save (floppy) and discard (X). The details row becomes editable in the same edit state.
   - A combined Group-plus-Product icon adds an inline Product draft directly beneath that Group.
   - A magnifier-plus opens the Group details row and changes to magnifier-minus while open. Details include tracking unit, minimum, target/maximum, optional parent Group, expiry/consumption policy, and the explanation that Current is derived/read-only.
   - The Unassigned row offers the same Product-add entry point but no Group edit/details controls. A table footer offers **Add Stock Group** and **Add unassigned Product**.
2. **Product rows** are always nested under their assigned Group or Unassigned. They show derived Product Current, Product Minimum (or an em dash when no Product limit is enabled), Product State, and fixed icon actions.
   - Pencil starts inline Product-name edit and swaps to save/discard icons.
   - A magnifier-plus/minus opens a Product details row. It contains the Stock Group dropdown (including `Unassigned`), Product minimum/target policy, GTIN, optional catalogue Product id, and note. Saving a Group change moves the whole Product and its Batches transactionally; it never duplicates stock.
   - A combined stock-plus icon creates one inline Batch draft directly beneath that Product. This is the only normal manual way to add another physical Batch for an existing Product.
   - Selecting a Product also loads the right-side Product block. Details never expose Product Concepts in this MVP workspace.
3. **Batch rows** are nested only under their Product. Their core row has no name/action ambiguity: quantity + unit, clearly labelled **Stocked at**, clearly labelled **Expiry**, and a state/expiry indicator.
   - Pencil opens the Batch edit row; save and discard are explicit. A discarded persisted Batch records history rather than disappearing silently. A new unsaved Batch has Save and Cancel only.
   - Batch rows have no Group assignment selector, add control, or details magnifier. Changing Group is always a Product action.
4. Use accessible labelled SVG/icon components rather than ambiguous text buttons or Unicode-only merged symbols. The visual glyphs are pencil, disk, X, magnifier-plus/minus, product-plus, and stock-plus; every one has an explicit accessible label and tooltip.

#### Right-side three-block composer

Keep the right column, but make it a secondary, fully functional composer rather than a second inconsistent editor. It contains connected **Stock Group**, **Product**, and **Stock Batch** blocks in that order. Each block has a left-facing action icon: **Add** for a new draft and **Save** for a selected persisted record.

- A blank composer starts with three drafts. Typing a new Group name seeds the Product name only while that Product name is pristine; changing a Product name never overwrites it again. Batches do not have names, so their block displays the selected/draft Product name as context instead of inventing a Batch-name field.
- Group Add saves only the Group. Product Add saves only the Product (and creates its unsaved parent Group first when selected). Batch Add saves only the Batch, but may create any unsaved parent Group and Product in the same idempotent server transaction. This is the intentional **create all missing levels** path and must not leave a partially created chain after a failure.
- Selecting a Group in the table loads that Group into the first block and clears Product/Batch drafts. Selecting a Product loads its assigned Group into the first block, the Product into the second, and clears the Batch draft. Selecting a Batch loads its Group, Product, and Batch. Selecting Unassigned leaves the Group block empty/disabled and Product save keeps the Product unassigned unless a Group is selected.
- The Product block contains the same Group dropdown and expandable identity/details fields as the table. The Batch block contains quantity/unit/Stocked at/Expiry only. A clear/cancel action resets only the relevant unsaved block and its dependent child drafts; it never impersonates Save.
- Table and composer use the same draft/state service and commands. A successful save refreshes the one workspace read model, preserves a sensible selection, and adds a concise Activity-console success/failure record.

#### Implementation sequence and acceptance gate

1. Update domain contracts, maintenance registry, validators, indexes, migration/reconciliation report, transaction commands, and repository/route tests for direct Product→Stock Group membership and nested Group rollup.
2. Update the read model/API to return a recursive Group tree, Product limits/identity fields, and Product-owned Batches. Remove live allocation-derived grouping only after cutover verification.
3. Replace the left table with the three-layer editor and shared accessible icon actions; add focused component tests for draft/reset/selection transitions.
4. Replace the one-block Product editor with the three-block composer using the same command service; remove the obsolete batch-only and inferred-target paths.
5. Reseed the demo household with nested Groups, multiple Products and Batches, an Unassigned Product, an expired-but-allowed Batch, and a legacy-allocation migration conflict fixture for automated reconciliation only.
6. Update the Manual, domain-language documentation, Stage 8 manual checklist, and session evidence. Do not mark Stage 8 complete until the manual flows below pass or are explicitly waived.

Manual acceptance for this slice: create a Group, child Group, unassigned Product, Product with a Group, and multiple Batches; move a Product between Groups and to Unassigned; confirm ancestor rollups and Product/Group limits; rename/edit/save/discard at each layer; verify icon expand/collapse states; create each level from both table and composer; verify compound Batch creation is atomic/idempotent; correct/discard a Batch; confirm no Product Concept controls appear; test light/dark, keyboard, mobile, stale revisions, and activity-log messages.

### Final Product Group target-policy model (2026-07-12)

This supersedes the preceding temporary “Stock Group/Stock Target” wording and every earlier Stage 8 planning statement that treats a target as the top-level household entity.

- The first-class household entity is **Product Group**, not Stock Target. A Product Group owns hierarchy, display identity, grouping, and optional target-policy data. `Stock Target` remains only in explicitly named migration/history adapters until the cutover is complete.
- A **target policy** is an optional embedded value on either `ProductGroup` or `HouseholdProduct`; it is not a separate collection or relation. The policy holds the owner's tracking unit, `minimumQuantity`, `desiredQuantity`, expiry-warning settings, and consumption/replenishment settings. An absent policy is valid and produces a neutral `not_tracked` state rather than a shortage.
- A Product belongs to zero or one direct `productGroupId`. Every normal Batch belongs to one Product. Product Group aggregation is Product membership plus recursive ancestor rollup; never combine it with current allocation aggregation.
- Product and Group policies are complementary, not additive Shopping Needs. The Shopping Need generator plans the deepest Product/child-Group deficits first, then calculates each ancestor Group’s residual after those planned contributions. Configuration validation warns when a parent desired/minimum quantity is lower than the converted sum of its tracked children; it does not silently rewrite intentional settings.
- Product Groups retain a mandatory tracking unit even when their target policy is absent, because Group aggregation must be meaningful. A Product supplies a default tracking unit for new Batches; Group membership requires compatible units or an explicit supported conversion. Existing `g`/`kg` and `ml`/`l` conversion rules remain the only automatic conversions.
- The old Target Acceptance Criteria are not retained as a live grouping rule. Direct Product Group membership is authoritative. Existing criteria/snapshots are preserved with historical allocations and may later power Product-Concept-based assignment suggestions, never silent grouping or counting.
- A generated Shopping Need references its target-policy owner through `{ ownerKind: "product_group" | "household_product", ownerId }`, plus an immutable policy/shortage snapshot. It does not reference a standalone Stock Target.

The required collection/contract cutover is therefore `household_stock_targets` → `household_product_groups` (or a documented compatibility successor), `household_products.productGroupId`, optional embedded target policies on both entities, Product-owned Batches, and historical-only allocations. New runtime code, Home copy, manual vocabulary, Stage 9 purchase conversion, and Stage 10 final terminology use **Product Group** and **target policy**.

- Household Stock Targets with combined minimum/target, reorder/expiry policy, and minimal flat typed Product Concept/Attribute Acceptance Criteria.
- Global cycle-safe concept `is_a` relations, inherited concepts, legacy category-parent migration, qualified household concepts/attributes, and explainable matching.
- Bounded checked-in JSON base classification/template pack with feature-local English/Hungarian translations, idempotent additive sync through both the seed runner and admin dashboard, and runtime localized-label fallback.
- Multiple concrete batches, manual/unlinked classification snapshots, one explicit full-batch allocation or unassigned state, no double counting, history, aggregation, consume/correct/discard, and deterministic/user-selected consumption.
- Safe v1-to-v2 migration and operational cutover.
- Minimum hierarchy-aware catalogue picker/link/preference/classification snapshot/manual relink and archive-safe behavior.
- Final Shopping Needs with explicit Stage 9 handoff; Shopping Trip planning and Purchase conversion are excluded.
- Explainable in-app low-stock/expiry/buy-before notices.
- Create and join via controlled existing-user invitation, basic owner/member capabilities.
- Optimistic concurrency, idempotency, transactions, explicit validation/errors.
- Global admin-managed feature flags with typed evaluation, safe cache/default/failure behavior, history/audit, and removal rules.
- Structured domain logging plus persistent privileged audit events.
- Demo/seed/docs/UX completion required to exercise the primary loop.

## Stage 9 Dependent Scope

Stage 9 uses this foundation to complete the core MVP journey:

- country-specific shop-market administration and ingestion-source links
- one-shop matching of Shopping Needs to concrete Products/Shop Products
- validity/staleness-aware price selection and deterministic cheapest repeated-package choice
- manual match replacement, unresolved generic lines, skips, and no-price fallbacks
- resumable manual shopping-trip completion with actual product/quantity/prices/expiry
- atomic, idempotent purchase-to-new-batch conversion
- structured Purchase Ingestion that is immediately useful to the household but asynchronously reviewed for catalog promotion
- minimum manual product, shop-product, and price-observation administration required to unblock that journey

Richer nested rules, multi-shop optimization, receipt/OCR, automatic substitutions, forecasting, and advanced catalogue/price visualization remain later work.

## Deferred Items And Reasons

| Deferred item | Reason |
| --- | --- |
| Automatic catalogue reconciliation/merge propagation | Manual link health and snapshots make MVP safe; automated identity decisions need confidence/review design. |
| Nested/advanced Acceptance Criteria | Stage 8 flat typed Product Concept/Attribute criteria cover the motivating milk/pasta cases and stay explainable; arbitrary boolean expressions need a deliberate query/UI grammar. |
| Automatic allocation and multi-target quantity splitting | Stage 8 explicit one-full-Stock-Batch allocation prevents double counting. Automated optimization needs priority/reservation/conflict rules. |
| Acceptable-substitute ranking | Minimal hierarchy-aware acceptance is in Stage 8; ranking needs reliable identity/package/preference evidence. |
| Recurring/frequent-item automation | Persisted definitions and history already allow repetition; automation can derive from trustworthy Stage 8 events later. |
| Arbitrary unit/package conversion | Silent conversions risk corrupt totals. Stage 8 uses one tracking unit and narrow explicit compatibility. |
| Consumption forecasting | Requires reliable movement history, which Stage 8 first creates. |
| Receipt/barcode/OCR | Manual purchase recording completes the MVP and avoids building automation on the old row model. |
| External notification channels | In-app notices complete the loop without email/push scheduling, consent, and delivery infrastructure. |
| Catalogue hard-purge cleanup | Archive plus snapshots protects users; physical purge needs separate retention/maintenance approval. |
| Targeted/percentage rollouts | Define evaluation context now, implement only when a real rollout needs it. |
| Full audit explorer | Persistent records and admin-safe query support are enough initially; rich filtering/export is operational extension. |

## Risks And Mitigations

- **Large cross-layer cutover:** keep v2 contracts/domain first, migrate under a write gate, avoid dual writes, and review each commit-sized unit.
- **Migration loses inferred history:** create an explicit opening balance and preserve legacy provenance; never invent old consumption events.
- **Transactions unsupported locally/hosted:** prove topology in Step 1 and pause for plan revision if absent.
- **Free-text units corrupt aggregation:** enforce per-Stock-Target tracking unit and explicit conversions only.
- **Tag cycles or false ancestry corrupt eligibility:** use typed `is_a` edges, cycle checks, qualified scopes, bounded closure, and independent facets instead of forcing every attribute into one tree.
- **Overlapping Acceptance Criteria double-count stock if used implicitly:** aggregate only explicit Stock Allocation quantities and enforce one active full-Stock-Batch allocation in Stage 8.
- **Rule/taxonomy edits make stock disappear:** freeze admission classification, surface drift, and require explicit reallocation/exclusion.
- **Seed sync overwrites curated/custom data:** update only checksum-proven untouched seed-owned records, skip/report conflicts, never delete missing-pack or household records, and preview admin changes first.
- **Dynamic translations become a second UI localization system:** store only domain-content labels/descriptions with content records; keep application copy in Angular locales and use explicit default-label fallback.
- **The initial vocabulary becomes an unfinishable ontology:** cap the MVP pack, require only representative household staples/criteria, and expand through checked-in additive changes or reviewed custom-content promotion.
- **Catalogue churn breaks display:** optional ids plus immutable acquisition/list snapshots and archive-first catalogue lifecycle.
- **Retries duplicate stock:** client operation ids, unique index, request fingerprint, transaction, and replayed completed response.
- **Concurrent tabs overwrite state:** per-entity revisions and compare-and-set filters with `409` guidance.
- **Event/audit logging leaks data:** centralized allowlisted context/redaction, bounded payloads, tests, and no raw bodies.
- **Feature flags become permanent branches:** registry owner/removal condition, closeout removal of migration flags, and documented non-use cases.
- **Stage 8 grows into recommendation intelligence:** enforce the explicit Stage 9 boundary above.
- **Current uncommitted UI changes are overwritten:** inspect status before each UI commit and preserve unrelated edits.

## Stage 8 Foundation Acceptance Checklist

- [ ] A controlled user can sign in and create a household.
- [ ] An owner can invite an existing controlled user; that user can join; unrelated users remain isolated.
- [ ] A member can define a Stock Target without choosing a Product.
- [ ] Reorder minimum, target, unit, expiry warning, consumption policy, and Acceptance Criteria belong to the Stock Target.
- [ ] Product Concept `is_a` ancestry is cycle-safe and inclusive; Product Attributes remain composable rather than forced into a false tree.
- [ ] Flat typed Acceptance Criteria express both “any milk” and the gluten-free accepted-type pasta example with match explanations.
- [ ] Household Product Concepts and Product Attributes classify manual/local content without leaking into another household or mutating global classification.
- [ ] The initial concept/attribute/template pack is meaningful but bounded, schema-valid, cycle-free, and translated with English/Hungarian parity.
- [ ] CLI and admin sync share one idempotent non-destructive service; customized/archived conflicts are reported rather than overwritten.
- [ ] Seeded and custom runtime labels resolve by requested locale with explicit default fallback; Acceptance Criteria identity never depends on translated text.
- [ ] Multiple generic/manual and explicit-Product Stock Batches can be allocated to one Stock Target with different acquisition/expiry dates.
- [ ] A reusable Household Product anchor can own reusable classification for repeated manual/receipt-imported batches, while each batch retains its own immutable acquisition/classification snapshot.
- [ ] Product-first unclassified entry and need-first unanchored opening stock both remain usable and can later converge on the same Stock Target through explicit actions.
- [ ] A Stock Batch is unassigned or has one active full Stock Allocation; overlapping Acceptance Criteria never double-count it.
- [ ] Total available quantity is correct and explainable from allocations and batches.
- [ ] Partial consumption uses deterministic or selected allocations and preserves movements/history.
- [ ] Corrections/discards/depletion are explicit, validated, and reversible/auditable where allowed.
- [ ] No-expiry products work without false warnings.
- [ ] Low-stock and expiry reasons coexist and show contributing data.
- [ ] User can add a Stock-Target-backed or ad-hoc Shopping Need to one active Shopping Need set with quantity/unit.
- [ ] Shopping Need generation remains usable without a Shop Market, Product, or Price Observation.
- [ ] Shopping Need state and snapshots form a clear input to Stage 9 without Stage 8 Purchase side effects.
- [ ] Preferred catalogue product is optional; unavailable/archived catalogue data does not invalidate household history.
- [ ] Manual link/unlink/relink is possible; Product Concepts/Attributes drive classification/eligibility while Product ids remain identity.
- [ ] Home groups Stock Targets first, then concrete Household Products, then individual Stock Batches, with visible unassigned/unclassified stock and derived read-only target totals.
- [ ] The accessible desktop/tablet Household/Shopping divider persists a clamped local ratio, resets to 50/50, and does not alter stacked mobile/domain state.
- [ ] Archive/history semantics preserve completed lists, purchases, batches, and movements.
- [ ] Expected validation, authorization, duplicate, and stale-state errors are clear and localized.
- [ ] Feature flags are global/admin-managed/persisted/typed/audited/cached safely with explicit failure behavior.
- [ ] Required domain and privileged actions emit useful structured, redacted logs/audit events without request noise.
- [ ] Existing household data migrates idempotently with exact aggregate reconciliation.
- [ ] Demo data and browser flow prove the repeatable household-to-generic-demand loop on desktop and mobile.
- [ ] Full tests, typecheck, lint, build, locale parity, transaction smoke, and migration reconciliation pass.
- [ ] Temporary cutover flags and v1 runtime writes are removed before closeout.

## Approval Checkpoint

Implementation must not begin until the user approves this plan or a named subset/step. Because this plan changes data shape, catalogue lifecycle, API contracts, permissions, validation strategy, and commit sequence, any material change discovered during implementation must pause the affected step and revise this plan explicitly.
