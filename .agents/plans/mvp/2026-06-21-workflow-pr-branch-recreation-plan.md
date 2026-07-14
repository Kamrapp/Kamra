# Workflow PR Branch Recreation Plan

## Objective

Make the PR automation resilient when auto-deleted integration branches no longer exist, so pushes to contributor `master_dev_*` branches can recreate `master_dev` from `master` before opening or refreshing pull requests.

## Context Read

- `AGENTS.md`
- `.agents/planning-workflow.md`
- `.agents/coding-guidelines.md`
- `.agents/plan-template.md`
- `.agents/plans/mvp/2026-06-21-stage-1-legacy-inventory-plan.md`
- `.agents/sessions/mvp/2026-06-21-stage-1-legacy-inventory.md`
- `.github/workflows/auto_push_dev_gyr.yml`
- `.github/workflows/auto_push_dev_gb.yml`
- `.github/workflows/auto_push_dev_merge.yml`
- `.github/workflows/auto_push_tag_release.yml`

## Discovery Questions

- None needed for initial implementation because the user described the intended branch flow and fallback behavior concretely.

## User Decisions

- Contributors push into dedicated `master_dev_*` branches.
- Those pushes should create or refresh PRs into `master_dev`.
- If `master_dev` was deleted after a prior merge, the workflows should recreate it from `master`.
- Release tagging should continue to drive the PR from `master_dev` into `master`.
- `v*` tag-triggered release automation should proceed only when the tagged commit belongs to `master_dev`, not when the same tag pattern is pushed from another branch context.

## Current Reality

- The contributor workflows only call `step-security/repo-sync-pull-request@v2`.
- None of the workflows verify that `master_dev` exists before trying to open a PR against it.
- All current workflows use `contents: read`, which is insufficient for branch creation.
- The PR action documents that it returns the created or existing PR, so repeated runs can target the same open PR when the source and destination branches still exist.
- The release workflow triggers on every pushed `v*` tag without checking whether the tagged commit belongs to `master_dev`.

## Intended Direction

- Keep the current workflow topology and PR action.
- Add a small guarded branch-bootstrap step ahead of PR creation in the workflows that target `master_dev`.
- Grant only the extra repository permission needed to create the missing branch.

## Scope

- Update the contributor PR workflows to ensure `master_dev` exists before running the PR action.
- Add a guard in the release-tag workflow so `v*` tags only create a release PR when the tagged commit is on `master_dev`.
- Preserve current reviewers, assignees, templates, and trigger patterns unless required for the fix.

## Non-Goals

- Redesigning the branch strategy.
- Changing repository settings such as GitHub's automatic branch deletion behavior.
- Replacing the current PR action.
- Introducing unrelated CI cleanup or workflow consolidation.

## Assumptions

- `master` always exists and is the correct source of truth for recreating `master_dev`.
- Developers recreate their own remote `master_dev_*` branches naturally by pushing them again after GitHub deletes a merged branch.
- The current PR action behavior is sufficient for open-PR refresh as long as the target branch exists.

## Open Questions

- Whether the release-tag workflow should also explicitly recreate `master_dev` when invoked in an unexpected deleted-branch state, or whether that should stay out of scope because the tag flow assumes `master_dev` already exists.

## Side Suggestions

- Consider disabling automatic deletion for `master_dev` in repository settings if the branch is intended to be a long-lived integration branch. This may reduce churn, but it is outside the current code-change scope.

## Steering Notes

- The initial user request mentioned both missing branch recreation and PR refresh on later pushes. Inspection suggests the missing target branch is the concrete failure, while PR refresh should already work through normal branch-backed GitHub PR behavior.

## Implementation Steps

### Step 1

- Goal: add a branch-bootstrap step for workflows that create PRs into `master_dev`
- Files likely affected: `.github/workflows/auto_push_dev_gyr.yml`, `.github/workflows/auto_push_dev_gb.yml`, `.github/workflows/auto_push_dev_merge.yml`
- Validation: YAML remains valid and each workflow now has `contents: write` plus a guarded create-if-missing step before the PR action
- Commit message idea: `ci: recreate master_dev before automated dev prs`

### Step 2

- Goal: guard the release workflow so only `master_dev` tags can create a PR into `master`
- Files likely affected: `.github/workflows/auto_push_tag_release.yml`
- Validation: release workflow fetches enough history to test branch membership and skips PR creation cleanly when a `v*` tag does not point to a `master_dev` commit
- Commit message idea: `ci: restrict release tag prs to master_dev`

## Validation Plan

- Read the updated YAML files to confirm trigger scope, permission scope, and step ordering.
- Run a YAML parse check if an appropriate local validator is available.
- Manually verify the branch-bootstrap script logic against these cases:
  - `master_dev` exists
  - `master_dev` is missing and `master` exists
- Manually verify the release guard logic against these cases:
  - a `v*` tag on a `master_dev` commit proceeds
  - a `v*` tag on a non-`master_dev` commit skips PR creation

## Risks

- Granting `contents: write` increases workflow capability, so the create-branch step should stay narrow and only create `master_dev` when absent.
- If repository policy changes the canonical integration branch later, recreating from `master` would need to be revisited.
- If the PR action has edge-case behavior around previously merged PRs on recreated branches, that will need a live GitHub validation pass after merge.
- Git branch-membership checks for tags can be subtle when commits are shared across branches, so the workflow should use a simple, explicit rule and report when it skips.

## Approval Checkpoint

Implementation should not begin until the user approves this plan.
