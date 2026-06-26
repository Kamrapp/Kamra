# shopping-list-service AGENTS.md

## Purpose

This service contains Kamra's focused shopping-list generation API.

It is a small C# Minimal API intended to run as a separate Render-hosted service while the main Kamra app continues to use:

* Angular frontend code in `src/`
* thin Vercel Function entrypoints in `api/`
* reusable Node/server logic in `packages/kamra-api-server/`

The service exists to model and eventually generate household-aware shopping plans. It should receive a normalized household shopping payload from the Kamra serverless API and return a packaged shopping list that describes what should be bought, where it should preferably be bought, and why those items are needed.

The first implementation may return an empty shopping-list result for deployment and contract testing. Keep that stub simple, explicit, and easy to replace.

## Concept

Kamra's frontend and serverless API should remain responsible for the customer-facing workflow:

* showing the household state to the customer
* letting the customer review current household stock
* letting the customer define minimum and maximum stock requirements
* letting the customer track expiry dates or freshness-sensitive items
* letting the customer set a shopping depth on a scale
* packaging the relevant household and catalog context into a request payload
* calling this service to generate a shopping-list package

This service should eventually be responsible for the planning decision itself.

Given a payload such as household stock, desired products, minimum stock limits, maximum stock limits, expiry dates, store options, known prices, and a shopping depth value, the service should return a structured shopping plan.

The target output is not merely a flat list of products. The planned output should be a packaged shopping list that can explain:

* which products should be bought
* how much should be bought
* which minimum stock limits are being restored
* which soon-expiring or missing household items caused the recommendation
* where each item is best bought when store or offer data is available
* whether the recommendation is essential, useful, or opportunistic
* how strongly the recommendation follows the selected shopping depth

The shopping depth scale should control how aggressively the planner fills gaps.

A low depth should prefer only urgent or minimum-stock items.

A medium depth should restore normal household readiness.

A high depth should include broader replenishment, useful offers, and efficient bundled shopping opportunities when the input data supports that.

## Boundaries

* Keep C# service code inside this service directory.
* Keep the public HTTP contract, request DTOs, response DTOs, validation, planning models, planner logic, health endpoint, and service-specific tests here.
* Keep this service stateless. Do not rely on in-memory state surviving between requests.
* Do not write customer data to local container storage.
* Do not hardcode Render URLs, Vercel URLs, database credentials, or environment-specific values.
* Use environment variables for deploy-time configuration.
* Bind to the platform-provided `PORT` value when running on Render.
* Keep the `/health` endpoint lightweight and dependency-minimal.
* Keep Render-specific hosting concerns small and isolated to deployment configuration, Dockerfile behavior, and startup wiring.
* Do not put Angular frontend code here.
* Do not put Vercel Function handlers here.
* Do not duplicate Kamra's Node/serverless route orchestration here.
* Do not put ingestion crawlers, catalog importers, admin tooling, seed scripts, or general repository scripts here.
* Do not let this service become the product catalog owner unless that is explicitly planned later.
* Prefer the existing Kamra serverless API as the caller of this service. The frontend should normally call Kamra's public API, not this service directly.

## API Direction

The initial endpoint should remain narrow:

* `GET /health`
* `POST /generate-shopping-list`

The generation endpoint should accept a simple request shape during early development, then evolve toward a richer household planning contract.

The request should eventually represent normalized data from the Kamra API, not raw frontend form state.

The response should be deterministic for the same input unless a future feature explicitly introduces external pricing updates, ranking randomness, or live catalog refresh behavior.

Prefer explicit DTOs over loose dynamic JSON.

Prefer additive contract changes where practical. Breaking contract changes should be deliberate and reflected in any calling code, tests, and documentation.

## Domain Language

Use names from the shopping and household planning domain.

Good examples:

* `ShoppingList`
* `ShoppingListItem`
* `ShoppingPackage`
* `HouseholdStock`
* `StockRequirement`
* `MinimumStockRequirement`
* `MaximumStockRequirement`
* `ExpiryDate`
* `ShoppingDepth`
* `StoreRecommendation`
* `PurchaseReason`
* `PlannerResult`

Avoid vague names such as:

* `Helper`
* `Manager`
* `Processor`
* `Data`
* `Thing`
* `Common`
* `Utils`

Use generic names only when the type is genuinely generic and not part of the shopping-planning domain.

## Planning Behavior

Expected failures should be represented explicitly where practical.

Validation failures should produce clear client-facing responses.

Planner failures should distinguish between:

* invalid input
* unsupported planning scenario
* missing catalog or offer data
* internal service error

Do not silently drop malformed household data.

Do not infer sensitive household attributes beyond what is needed for shopping-list generation.

Do not include raw customer secrets, credentials, tokens, or unnecessary personal data in logs.

When a recommendation cannot be produced because required input data is missing, return an empty or partial result with an explicit reason rather than pretending the planner made a confident decision.

## Logging

Keep logs useful in both local development and Render runtime logs.

Logs should make it possible to answer:

* did the service start correctly?
* did the health endpoint respond?
* did a generation request arrive?
* was the request accepted or rejected?
* did the planner return an empty, partial, or non-empty result?
* was an error caused by input, configuration, dependency failure, or code failure?

Avoid logging full request payloads by default. Household stock and shopping behavior may become personal enough to treat carefully.

## Testing

Prefer service-local tests for:

* request validation
* response shape
* shopping depth interpretation
* minimum stock gap detection
* expiry-date handling
* empty result behavior
* deterministic planner behavior
* health endpoint behavior

The initial stub should still be tested enough to prove that deployment and the API contract work.

Do not require live Render, Vercel, database, or catalog dependencies for normal unit tests.

## Validation

Use service-local .NET commands from this service directory where available:

```bash
dotnet restore
dotnet build
dotnet test
dotnet run
```

If the root repository later adds wrapper scripts for this service, keep this file updated with the preferred commands.

Before changing the public API contract, check the Vercel/serverless caller and update any request or response assumptions there.

## Deployment

This service is intended to be deployable as a Docker-backed Render web service.

Keep the Dockerfile small and boring.

The container should:

* restore dependencies
* build the service
* publish a release build
* run the published API
* listen on the configured `PORT`

Render free-tier behavior should be tolerated. The service may spin down when idle and cold-start later. The API must remain stateless so that cold starts do not change behavior.

Do not add background jobs, schedulers, or long-running in-memory workflows unless the deployment model is reconsidered.

## Relationship To The Main Kamra App

The main Kamra app owns the user-facing product experience.

This service owns the shopping-planning decision.

The intended flow is:

```text
Angular frontend
  -> Vercel API / kamra-api-server
  -> shopping-list-service
  -> generated shopping-list package
  -> Vercel API / kamra-api-server
  -> Angular frontend
```

The Vercel API should prepare and normalize the request.

This service should evaluate the request and produce the planning result.

The frontend should receive a customer-friendly result through the normal Kamra API boundary.

Keep this separation unless there is a deliberate architecture change.
