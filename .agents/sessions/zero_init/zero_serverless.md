# SERVERLESS ARCHITECTURE DECISION EXTENSION (ADDENDUM TO BOOTSTRAP SPEC)

## PURPOSE

This document extends the existing GPT Agent Bootstrap Spec with a concrete architectural constraint:

The system is intentionally designed as a **serverless-first architecture** with no dedicated backend server.

All future planning, specification, and implementation must align with this constraint.

---

# ARCHITECTURAL DECISION: SERVERLESS-FIRST MODEL

## CORE PRINCIPLE

The system does not use a persistent backend server.

Instead, it is composed of:

- stateless serverless API functions
- event-driven background processing via GitHub Actions
- external managed database (MongoDB)
- static + dynamic frontend hosting via Vercel

This is a deliberate simplification to reduce operational complexity while preserving scalability.

---

# SYSTEM BOUNDARIES

## 1. FRONTEND LAYER

- Hosted on Vercel
- Serves UI for end users
- Communicates with backend via HTTP API routes
- Must not contain business-critical logic beyond presentation and lightweight orchestration

---

## 2. API LAYER (SERVERLESS)

- Implemented as Vercel serverless functions
- Stateless request handlers
- Responsible for:
  - querying normalized product data
  - generating shopping lists
  - computing lightweight optimization logic
- Must not perform long-running tasks
- Must not perform crawling or batch ingestion

---

## 3. DATA INGESTION LAYER

- Implemented via GitHub Actions workflows
- One workflow per shop/source
- Responsible for:
  - crawling product data
  - downloading structured sources (including PDFs where needed)
  - producing raw snapshots
- Outputs are immutable and versioned per shop and run

---

## 4. TRANSFORMATION LAYER

- Runs in GitHub Actions (preferred) or serverless functions (if small)
- Converts raw snapshots into canonical product model
- Responsible for:
  - deduplication
  - normalization
  - identity resolution across shops
- Produces materialized canonical datasets in MongoDB

---

## 5. DATABASE LAYER

- MongoDB Atlas (managed service)
- Contains:
  - raw shop snapshots (versioned per shop and run)
  - canonical product catalog
  - store-product price mappings
  - price history aggregates
- No relational schema migrations required
- Data evolution is handled via versioned documents and transformation jobs

---

# DATA FLOW MODEL

```text
GitHub Action (shop crawler)
        ↓
Raw Snapshot Storage (MongoDB)
        ↓
Transformation Job (GitHub Actions or batch process)
        ↓
Canonical Product Collections (MongoDB)
        ↓
Vercel API (stateless query layer)
        ↓
Frontend (Vercel UI)
```

# VERSIONING STRATEGY

## RAW DATA LAYER

- Every crawler execution produces a snapshot
- Snapshots are immutable
- Stored per:
  - shop
  - timestamp
  - crawler version

Example structure conceptually:

- shop: "lidl"
- run: "2026-06-21T03:00Z"
- payload: raw scraped products or PDF-parsed offers

---

## CANONICAL DATA LAYER

- Derived from raw snapshots
- Represents the current best-known state of products
- May be fully recomputed from raw data
- Always reproducible and deterministic from ingestion history

---

# IDENTITY RESOLUTION MODEL

The system must support:

- cross-shop product matching
- fuzzy matching on product names
- category-based intent queries (e.g. “flour” without brand)
- constraint tagging (e.g. BL55 wheat flour, powdered sugar)
- canonical product identity mapping

Identity resolution is treated as a **deterministic transformation step**, not runtime API logic.

---

# ROUTING & DOMAIN ACCESS

## KEY CLARIFICATION

The system does NOT rely on fixed IP addresses.

Instead:

- Vercel provides stable deployment URLs
- Custom domains map to deployments
- API endpoints are accessed via HTTPS routes

Example:

- `https://yourdomain.com/api/products`

Frontend and backend communication is always URL-based, never IP-based.

---

# DESIGN CONSEQUENCES

## ALLOWED PATTERNS

- stateless API functions
- event-driven ingestion pipelines
- immutable snapshot storage
- batch transformation jobs
- serverless compute execution
- GitHub Actions orchestration

---

## DISALLOWED PATTERNS

- persistent backend servers
- long-running API processes
- in-memory backend state dependency
- tightly coupled backend runtime orchestration
- crawler execution inside API layer

---

# COMPLEXITY MODEL

System complexity is intentionally shifted away from infrastructure and into:

- data modeling
- transformation logic
- identity resolution
- versioning strategy
- pipeline correctness

Infrastructure remains deliberately minimal.

---

# COMPATIBILITY REQUIREMENTS

All future agent-generated outputs must:

- respect serverless-first constraints
- treat GitHub Actions as ingestion compute layer
- treat Vercel as stateless API + frontend host only
- treat MongoDB as system of record
- avoid introducing backend server assumptions

---

# FINAL INTENT

This extension ensures the system remains:

- low operational overhead
- scalable for MVP and moderate growth
- reproducible via deterministic pipelines
- architecture-driven rather than infrastructure-driven

All future phases must remain consistent with this model unless explicitly revised.
