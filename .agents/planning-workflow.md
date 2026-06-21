# Planning Workflow

## Purpose

This file defines how Kamra work moves from idea to plan to implementation to review.

The workflow is intentionally heavier than ad hoc coding because the project is meant to build a stable agent-assisted practice, not just ship isolated changes.

Planning and implementation have different temperaments:

- planning is exploratory, interactive, and open to steering
- implementation is narrow, commit-sized, and easy to supervise

The planner should help the user think through the work, not merely wait for a perfect prompt. Major misses are expensive to fix after commits are arranged, so early planning should deliberately look for absent product, architecture, data, and workflow concerns.

## Default Lifecycle

```text
idea
  -> planning discussion
  -> plan markdown
  -> user review
  -> approved commit-sized steps
  -> implementation session
  -> validation
  -> user review
  -> fixer pass when review or validation finds mistakes
  -> session state
  -> learnings
```

## Planning Discussion

Before writing or finalizing a plan, the planner should:

- restate the objective
- inspect relevant files
- identify current code reality
- ask only substantial clarifying questions
- ask focused discovery questions when product or architecture basics are missing
- provide 2-3 concrete options when the user needs to choose a direction
- include a short recommendation when one option is clearly safer or more aligned
- suggest side paths when they materially affect the outcome
- call out hidden risk
- separate must-haves from nice-to-haves
- revise the plan as the user steers, corrects, or expands the idea

Good planning questions are specific. Prefer:

- "Should auth begin as admin-only credentials, whitelisted email registration, or Google sign-in after the household/product MVP?"
- "Should admins see every crawled product, only ingestion runs and errors, or a full product moderation dashboard?"
- "Should household items be shared across household members, single-user first, or hybrid with private notes?"

Avoid making the user answer broad blanks like "What else do you need?" unless the concrete options are genuinely unknown.

## Discovery Checklist

For new repositories, major features, or architecture plans, consider whether the plan has covered:

- target users and roles
- sign-in method and identity provider
- admin/operator workflows
- ordinary user workflows
- first useful MVP feature set
- user-owned data boundaries
- shared/global data boundaries
- external integrations
- license and public-use constraints
- external source or crawler terms
- background jobs
- validation and observability
- privacy, security, and abuse risks
- source independence, ads, sponsorship, and recommendation bias
- likely future extensions

The checklist is not a form to fill mechanically. It is a way to notice missing basics early.

## Plan Files

Plans live in `.agents/plans/`.

Use names like:

- `YYYY-MM-DD-short-topic-plan.md`
- `stage-2-legacy-inventory-plan.md`
- `feature-product-search-plan.md`

Use `.agents/plan-template.md` unless a narrower format is clearly better.

## Approval

Implementation begins only after user approval.

Approval can be explicit, such as:

- "approved"
- "go ahead"
- "implement step 1"

If the user discusses the plan without approving it, continue planning.

If the user changes direction during planning, incorporate the change and revisit affected steps. If the user changes direction during implementation in a way that affects scope, commit split, architecture, or validation, pause implementation and update the plan first.

## Commit Split

Each plan should define commit-sized units.

A good unit:

- has one clear purpose
- can be reviewed independently
- has validation criteria
- avoids unrelated cleanup
- leaves the repo understandable

## Implementation Sessions

During implementation:

- work one approved unit at a time
- keep the user updated
- load only the docs needed for the current unit
- prefer the active plan and latest handoff over rediscovering old context
- adjust the plan when reality differs
- validate before calling the unit done
- avoid broad refactors unless they are the approved unit
- treat major missing requirements as a reason to return to planning
- keep optional ideas as followups unless the user reopens scope

Assume mistakes can happen. When review or validation finds a problem, handle it as a Fixer pass:

- target the specific issue
- review existing and newly added tests first
- add focused tests when they clarify or protect the fix
- avoid architectural changes or broad refactors unless the user explicitly asks
- return to planning if the issue reveals a larger design miss

## Session State

Create a session state note when:

- the plan is not complete
- context would be costly to rediscover
- validation is partially complete
- the next step depends on remembered decisions

Use `.agents/session-state-template.md`.

## Learning Capture

Add learning notes when:

- a pattern is likely to repeat
- a decision changes future implementation
- a mistake should not be repeated
- domain knowledge becomes clearer

Put focused notes in `.agents/learnings/`.

## Side Suggestions

Side suggestions are welcome.

During planning, side suggestions should be surfaced freely when they may prevent a weak architecture or missing product workflow.

During implementation, side suggestions should be written as optional followups unless the user approves scope expansion.

Format:

- suggestion
- why it matters
- when to consider it
- whether it affects current scope
