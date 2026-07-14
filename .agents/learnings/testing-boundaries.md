# Testing boundaries

## Durable lesson

The Stage 11 closeout showed that a small number of larger focused spec files can protect core
coordination more efficiently than repeatedly driving several UI blocks by hand. The useful boundary
is the behavior/state coordinator, not the rendered HTML.

## Working rule

- Define the expected outcome before running the test against current code.
- Put deterministic rules and cross-block state transitions in focused specs. A small extraction or
  injectable seam is acceptable when it improves testability without becoming a general refactor.
- Use route/repository tests for server contracts and configured `npm run smoke:*` scripts for real
  MongoDB behavior that fakes cannot prove.
- Use HTML-level browser contracts only when frontend-to-browser wiring is itself consequential.
- Avoid UI snapshots as a substitute for behavioral assertions; reserve snapshots for genuinely
  stable serialized contracts where reviewable churn is valuable.
- Maintain one manual acceptance script for the active phase/stage. Keep visual clarity,
  accessibility interaction, localization, approved real data, and operator safety there.
- When an approved next stage will replace a flow, transfer its acceptance and run it after the new
  behavior stabilizes instead of spending a full pass on the outgoing UX.

This does not mean all manual testing waits until release. A focused manual check is still warranted
while diagnosing a browser-only defect or validating a risky interaction; the efficiency rule applies
to the repeated integrated acceptance pass.
