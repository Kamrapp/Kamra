# Alpha hardening baseline

Captured: 2026-07-13
Starting commit: `f130abc` (`Stage 9 wrapup`)

This is the Stage 10 Step 1 inventory. It records observed risks and assigns each to a later bounded slice. It is a baseline, not permission for a repository-wide rewrite.

## Validation baseline

The current branch passes:

- `npm test` — 55 test files, 211 tests
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run build:web`
- `npm run build:api`

Configured Mongo smoke, migration/reconciliation, archive/restore, and browser acceptance were not run in this baseline because they require the approved environment and human/browser evidence. Their absence is tracked in `.agents/plans/stage8-10-manual-acceptance-checklist.md`.

## Runtime and data boundary findings

| Severity | Finding                                                                                                                                                                   | Evidence                                                                                                                                               | Owner / later slice                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Raw ingestion evidence has no verified export/import archive workflow.                                                                                                    | `ingestion_raw_snapshots` and `ingestion_runs` exist; no `crawl:export`, `crawl:import`, manifest, checksum, or restore script exists.                 | Stage 10 Step 2: archive export; Step 6: import/reprocessing                                                                                                |
| High     | Stage 9 Trip completion currently embeds purchase result history in Trip Items and creates Ingestion Submissions, but no separate `household_purchases` aggregate exists. | `stage9-contracts.ts`, `household-v2-routes.ts`, and maintenance setup contain Trip/Submission persistence but no Purchase repository.                 | Stage 9 closeout: keep Trip as the MVP purchase-history envelope and remove stale separate-Purchase claims; do not add a second aggregate without evidence. |
| High     | The Home concrete Trip entry still accepts a raw Shop Market id instead of a household-visible market choice.                                                             | `household-shopping-trip-panel.component.ts` uses a free-text market input; only admin market routes currently list/create markets.                    | Stage 9 closeout: add an authenticated active-market read route and picker.                                                                                 |
| High     | Actual Trip completion UI is thinner than the backend contract.                                                                                                           | Backend accepts actual quantity/unit/price/acquisition/expiry and Product choice; Home currently exposes mostly bought/not-bought actions.             | Stage 9 closeout: add the compact actual-result editor and unplanned-purchase action.                                                                       |
| High     | Trip completion route owns significant matching, Product lookup, and transaction orchestration.                                                                           | `household-v2-routes.ts` is 1,667 lines and contains market loading, matcher setup, Product selection, Batch completion, and submission creation.      | Stage 10 Step 7: move policy into shopping/completion services; keep route as adapter.                                                                      |
| Medium   | Completion fallback searches all Household Products per item when matching a catalogue Product.                                                                           | `MongoHouseholdProductRepository.list(householdId)` is used during completion; the repository already has a catalog index but no focused lookup.       | Stage 9 closeout: add `findByCatalogProductId` and bounded lookup tests.                                                                                    |
| Medium   | Match options are embedded in Trip Items without an explicit size/truncation policy.                                                                                      | `ShoppingTripMatchOption[]` is returned from Trip creation.                                                                                            | Stage 9 closeout: bound candidate count/document size and expose truncation state.                                                                          |
| Medium   | Legacy Stage 8 shopping-list compatibility remains active beside Stage 9 Trips.                                                                                           | `household-shopping-list.component.ts`, legacy `/api/household/shopping-lists/*` routes, and Home template remain active.                              | Stage 9 closeout: prove equivalent Trip completion first; Stage 10 Step 9 removes dead writes only after evidence.                                          |
| Medium   | Validators and maintenance completion for the newly embedded purchase-alternative fields need explicit parity evidence.                                                   | `purchaseHouseholdProductId` is now part of Trip Item runtime contracts; no dedicated persistence/validator snapshot was found in the baseline search. | Stage 9 closeout / Stage 10 Step 9: validator, migration, and contract coverage.                                                                            |

## Change-locality findings

Measured file sizes identify review candidates, not automatic defects:

- `packages/kamra-api-server/src/http/app-handler.test.ts` — 3,528 lines
- `packages/kamra-api-server/src/catalog/current/mongo-catalog-repository.ts` — 1,269 lines
- `packages/kamra-api-server/src/household/current/mongo-household-repository.ts` — 1,300 lines
- `packages/kamra-api-server/src/http/routes/household-v2-routes.ts` — 1,667 lines
- `src/app/household/household-shopping-list.component.ts` — 667 lines

The first safe refactor target is the Stage 9 shopping route because it combines transport, matching, Product selection, and completion policy. No universal repository, event bus, or framework extraction is justified by file size alone.

## Terminology inventory

Final Stage 8/9 terms are defined in `docs/domain-language.md` and the Stage 10 plan. Remaining legacy vocabulary is concentrated in migration/history surfaces and older Stage 6/8 documentation:

- `product source` / `ProductSourceRecord` remains in ingestion/catalogue compatibility code and historical docs.
- `shopping list` is still used for the Stage 8 Shopping Need editor and is ambiguous when used for a concrete Trip.
- `Stock Target` / `Stock Allocation` remains in migration/history plans and older package README text.
- `catalog` and `catalogue` both appear; technical identifiers should use `catalog`, while prose/UI may use the chosen localized spelling.

Stage 10 must distinguish active runtime vocabulary from intentionally retained migration evidence. It must not perform a blind search-and-replace across historical plans or raw ingestion fields.

## Query/index and operational baseline

Existing indexes cover the primary Product Group, Shop Product, Price Observation, Trip, Submission, and raw-ingestion identifiers. The baseline has not yet run realistic-volume explain plans or configured Mongo transaction/archive checks. Those become explicit acceptance items for the owning slices rather than assumptions.

## Execution order

1. Preserve this baseline and implement verified Crawl Snapshot export with no database mutation.
2. Close the small Stage 9 user-flow/data-integrity gaps listed above before removing compatibility paths.
3. Apply final terminology and maintenance cleanup only after raw evidence is protected.
4. Refactor shopping completion only where focused tests demonstrate reduced policy duplication.
5. Run non-functional and Alpha documentation closeout after configured/manual evidence exists.

Any checksum mismatch, ambiguous legacy identity, unexpected validator rejection, or authorization/transaction failure is a stop condition. The agent must record the finding and return to the owning Stage 9/10 slice instead of repairing by guesswork.
