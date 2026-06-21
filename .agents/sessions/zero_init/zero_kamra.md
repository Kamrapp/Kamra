# GPT AGENT BOOTSTRAP SPEC — REPOSITORY INITIALIZATION + ARCHITECTURE GENERATION

## PURPOSE

This document defines a single, strict, phase-driven workflow for initializing and standardizing a software repository using GPT as the sole agent.

It is designed to produce:

1. a reusable repository bootstrap standard
2. a repository-agnostic system architecture foundation
3. a repository-specific application specification
4. a structured agent execution system (AGENTS.md)
5. architecture documentation for the repo
6. optional analysis of existing codebases
7. a deterministic refactor + standardization plan
8. a controlled feature implementation pipeline

The end result is a repository that is:
- modular
- extensible
- consistently structured
- suitable for long-term AI-assisted development

---

# CORE WORKING PRINCIPLES (GPT OPTIMIZED)

- Work in clearly separated phases
- Treat each phase output as an independent artifact
- Use prior phase outputs as the only input for the next phase
- Prefer explicit structure over implicit reasoning
- Keep outputs deterministic, predictable, and reviewable
- Prioritize correctness over completeness when tradeoffs appear
- When uncertainty exists, surface assumptions explicitly before proceeding
- Keep formatting stable across phases for downstream parsing

---

# DOMAIN CONTEXT (SYSTEM BEING BUILT)

This system is a grocery intelligence and optimization platform.

It will eventually support:

## Data ingestion
- crawling product and price data from multiple supermarkets (e.g. SPAR, Lidl, and others)
- handling inconsistent product naming across providers
- ingesting manual user data (future extension)
- supporting external data sources via adapters

## Normalization layer
- mapping heterogeneous product representations into canonical entities
- resolving product identity across stores
- handling fuzzy matches and category-based intent (e.g. “flour” instead of brand-specific products)

## Storage layer
- raw ingestion data (temporary staging)
- canonical product database
- store-product-price mappings
- historical price tracking

## Query layer
- product search
- category and constraint filtering
- intent-based queries (brand-agnostic product lookup)

## Optimization layer
- shopping list generation
- multi-store optimization (minimize cost + time + distance)
- constraint-based decisions (e.g. “max 2 shops” preference)

## Future extensions
- mobile price scanning (OCR)
- household inventory tracking
- fridge + expiry tracking system
- manual product enrichment workflows

---

# GLOBAL CONSTRAINTS

- No implementation during phases 0–4
- No premature framework selection in early phases
- No mixing of conceptual design and code structure
- Codebase (if present) always represents runtime truth
- Specifications represent intended architecture, not reality
- Each phase output must stand alone without hidden dependencies
- Avoid overfitting design to current implementation details too early

---

# PHASE 0 — REUSABLE REPOSITORY BOOTSTRAP STANDARD

## OUTPUT FILE
`00-repo-bootstrap-standard.md`

## PURPOSE

Define a reusable, generic system for initializing future repositories with the same structured AI-driven workflow.

## REQUIRED CONTENT

- phase-based architecture generation model
- strict separation between phases
- rule that each phase produces immutable artifacts
- lifecycle model:
  ingestion → normalization → storage → query → optimization
- role definition of AGENTS.md in system execution
- rules for AI-driven repository evolution

## CONSTRAINTS

- No mention of groceries or domain-specific logic
- No frameworks, languages, or storage systems
- No file structures or repo naming conventions

---

# PHASE 1 — GENERIC SYSTEM FOUNDATION

## OUTPUT FILE
`01-system-foundation.md`

## PURPOSE

Define a technology-agnostic system architecture.

## REQUIRED CONTENT

Define the system as a conceptual pipeline:

- ingestion system (abstract)
- normalization system (abstract)
- storage system (abstract)
- query system (abstract)
- optimization system (abstract)

## MUST INCLUDE

- full data lifecycle:
  raw external data → normalized entities → canonical storage → queryable model → derived outputs
- extensibility model:
  - pluggable ingestion adapters
  - pluggable normalization strategies
  - pluggable optimization strategies
- strict separation of concerns between components

## CONSTRAINTS

- no technologies
- no frameworks
- no databases
- no implementation detail
- no folder structure

---

# PHASE 2 — APPLICATION-SPECIFIC SPECIFICATION

## OUTPUT FILE
`02-application-spec.md`

## PURPOSE

Translate the abstract system into a concrete application design for the grocery intelligence platform.

## IMPORTANT INSTRUCTION

If a repository already exists:
- inspect the codebase first
- treat code as runtime truth
- reconcile differences between code and intended architecture
- explicitly surface mismatches

## REQUIRED CONTENT

### Domain model

- Product (canonical entity)
- Store
- StoreProduct mapping
- Price history
- Category system
- Tagging and constraints system (e.g. BL55 flour, powdered sugar)
- Intent-based product queries (brand-agnostic search like “flour”)

### Ingestion system

- multi-source crawler system
- per-store adapters (SPAR, Lidl, etc.)
- raw staging layer
- normalization pipeline

### Identity resolution

Must explicitly define:
- product matching across stores
- fuzzy matching strategies
- canonical product definition rules
- conflict resolution strategy for inconsistent naming

### Storage strategy (abstract)

- raw ingestion storage
- normalized canonical store
- historical price tracking

### Optimization system

- shopping list generation
- cost optimization
- route optimization:
  - max preferred number of stores (e.g. 2)
  - tradeoffs between price, distance, time

### Future extensions

- OCR-based scanning system
- household inventory tracking
- fridge + expiry tracking
- manual product enrichment workflows

---

# PHASE 3 — REPOSITORY EXECUTION SYSTEM (AGENTS + ARCHITECTURE DOCS)

## OUTPUT FILES

- `AGENTS.md`
- `docs/architecture.md`

## PURPOSE

Define how GPT agents operate inside the repository.

---

## AGENTS.md MUST DEFINE

### Execution lifecycle

- plan → implement → validate → commit → followups

### Core rule

- implementation only begins after plan approval

### Drift handling model

- code represents runtime truth
- specification represents intended design
- differences must be explicitly surfaced and resolved, not ignored

### Agent roles

- Planner Agent (designs changes)
- Implementation Agent (executes steps)
- Review Agent (validates correctness and completeness)

### Commit conventions

- atomic commits per step
- clear mapping between plan step and commit

### Planning system

- all changes must originate from structured plan files
- no direct implementation without a plan

### Collaboration model

- agent asks for clarification when ambiguity affects architecture
- agent prioritizes consistency across layers over local optimization
- agent highlights risks before implementation begins

---

## docs/architecture.md MUST DEFINE

### System architecture

- ingestion layer
- normalization layer
- persistence layer
- query layer
- optimization layer
- frontend layer (if applicable)

### Data lifecycle

End-to-end flow from:
external data → ingestion → normalization → storage → query → optimization output

### Module boundaries

- strict separation of responsibilities
- no circular dependencies between layers

---

# PHASE 4 — CODEBASE ANALYSIS (IF REPOSITORY EXISTS)

## OUTPUT FILE
`03-codebase-analysis.md`

## PURPOSE

Understand current system state before any modification.

## REQUIRED CONTENT

- current architecture overview
- comparison against Phase 2 design
- coupling and layering issues
- missing abstractions (e.g. crawler interfaces)
- duplication and fragmentation analysis
- structural risks

## CONSTRAINTS

- no code changes
- no refactoring
- analysis only

---

# PHASE 5 — STANDARDIZATION PLAN (NO IMPLEMENTATION)

## OUTPUT FILE
`04-standardization-plan.md`

## PURPOSE

Define a deterministic refactor path to align codebase with AGENTS.md and architecture spec.

## REQUIRED CONTENT

- step-by-step refactor sequence
- atomic change units
- file-level scope inventory
- dependency migration order
- risk assessment per step
- validation criteria per step

## CONSTRAINTS

- no implementation
- no execution
- no feature development

---

# PHASE 6 — FEATURE IMPLEMENTATION PIPELINE

## PURPOSE

Begin feature development only after system stabilization.

## INITIAL MVP FEATURES

- crawler system with multi-store adapters
- ingestion pipeline (raw → normalized → canonical)
- product identity resolution system
- basic API layer for product querying
- shopping list generation
- simple route optimization (2-store constraint)

---

# GPT COLLABORATION MODEL

This system is designed for iterative collaboration with GPT.

## EXPECTED BEHAVIOR

- produce structured, reviewable outputs
- maintain consistency across phases
- explicitly state assumptions when needed
- prefer clarity over implicit reasoning
- keep outputs modular and composable
- treat each phase as a contract, not a suggestion

## WORK STYLE

- step-by-step execution
- phase completion before progression
- explicit validation before moving forward
- incremental refinement rather than large uncontrolled changes

---

# FINAL INTENT

This workflow produces a repository that evolves from:

- conceptual system design
- to concrete architecture
- to controlled implementation
- to extensible feature development

All through structured AI-assisted phases that remain stable over time.