# Home shopping panel layout refinement

## Objective

Keep Home's household, shopping-list, and Shopping Trip panels visually separated while allowing
only the shopping-list item table to consume expandable vertical space.

## Implementation units

1. Refine Home grid rows so collapsed panels stay compact, expanded desktop panels share available
   space predictably, and mobile panels use natural stacked flow with explicit minimum space.
2. Make the active shopping-list overview a compact grid whose item shell is the only flexible,
   scrollable area.
3. Add a default-collapsed Shopping Trip disclosure control with accessible state and responsive
   content sizing.
4. Validate formatting, lint, typecheck, and browser contracts; update the Stage 11 runbook only
   if the new interaction creates a manual acceptance point.

## Boundary

No shopping behavior, API, persistence, or data model changes are included.
