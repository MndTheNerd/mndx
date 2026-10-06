---
name: plan
description: Write the MNDX technical plan for the active, spec-approved feature, with design, file changes, an ordered task list, and a test plan mapped to every acceptance criterion.
---

# /mndx:plan

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. Continue only if the active item is a feature with
`spec.md: approved`. Otherwise tell the user what's missing (for example "the spec isn't approved yet: type
`/mndx:approve`"), then stop.

## 2. Research
- Read the approved `spec.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, the ADRs, and the stack playbook skill.
- For **every concern in the spec's Concerns table**: read its checklist (`${CLAUDE_PLUGIN_ROOT}/skills/concerns/`)
  and load its installed community skills. The design has to satisfy them. Load `codebase-design` for module
  and seam decisions, and `api-and-interface-design` for any API or public interface.
- Read the code you're going to change, and find existing utilities, components and patterns to **reuse**.
  The best plan adds the least new code.
- If a library or API is involved, check its current documentation instead of relying on memory.

## 3. Write `plan.md`
Fill in every section, and remove the template marker and the comments.
- **Approach:** the chosen design, and for each serious alternative, one line on why it lost.
- **Files:** every file that will be created or modified, and why.
- **Tasks:** ordered so the code builds and tests pass after each task. Usually the order is
  types/data → logic → interface → wiring. Each task is small.
- **Test plan:** every AC from the spec appears at least once. Choose the cheapest test type that really proves
  it: unit, then integration, then e2e.
- **Concern coverage:** one row per concern, with the design decision that satisfies it and the test or verify
  check that proves it. The test plan's seams are the ones `tdd` will use, so approving the plan confirms them.
- **Risks:** what could go wrong (migration, performance, security, breaking change) and how the plan handles it.
- Real decisions get an ADR in `docs/adr/` (next number), linked under Decisions.

If planning shows the spec is wrong or incomplete, don't paper over it. Update the spec, say so, and tell the
user the spec needs re-approval.

## 4. Hand off
Summarize the approach, the number of tasks, the files touched, the risks, and any ADRs. Then:
"Review `plan.md`, then type `/mndx:approve`. That opens the code gate for `/mndx:build`."
Don't write code yet.
