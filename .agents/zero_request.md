# SIDE-NOTE INSTRUCTION FOR CHATGPT (BOOTSTRAP EXECUTION START)

## TASK

You are given a master bootstrap specification document (the GPT AGENT BOOTSTRAP SPEC).

Your job is to:

1. Read the entire document carefully
2. Validate internal consistency
   - check phase ordering logic
   - check artifact dependencies
   - check for missing or contradictory constraints
   - check that outputs are clearly defined and non-overlapping
3. Identify any structural issues that would cause:
   - ambiguity during execution
   - drift between phases
   - unclear ownership of outputs
   - premature implementation risks
4. Briefly report any inconsistencies or risks before proceeding

## IMPORTANT

- Do not rewrite the full spec
- Do not redesign the workflow
- Only surface meaningful issues that affect execution reliability

If no critical issues are found, proceed immediately.

---

## THEN EXECUTE

Start with:

### PHASE 0 — REUSABLE REPOSITORY BOOTSTRAP STANDARD

Generate the file:

`00-repo-bootstrap-standard.md`

Follow the specification exactly as defined in the master document.

Ensure:
- strict adherence to Phase 0 constraints
- no domain-specific content included
- no technologies or frameworks mentioned
- fully reusable across unrelated repositories

---

## OUTPUT STYLE

- Be structured and precise
- Prefer completeness over brevity for generated artifacts
- Keep consistency across naming and formatting
- Treat Phase 0 output as a foundational contract for all later phases

---

## SUCCESS CRITERION

You have succeeded when:
- Phase 0 file is complete
- It is reusable for other repositories
- It contains no accidental domain coupling
- It is structurally aligned with later phases