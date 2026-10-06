---
name: build
description: Implement the active, approved MNDX item task by task, test-first, following the approved plan exactly.
---

# /mndx:build

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` and the `quality-bar` skill first if you haven't loaded them yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. Continue only if the code gate is **OPEN**.
Otherwise report what the status says is needed, then stop.

Read the approved docs: `plan.md` (+ `spec.md`) for a feature, `bug.md` for a fix, `chore.md` for a chore.
Also read `CLAUDE.md` for the quality-bar commands and conventions.

**Load the skills before writing code:** `tdd`, then the installed community skills and checklists for every
concern in the item's Concerns table. For example: `frontend-design` + `frontend-ui-engineering` for web UI,
`expo-overview` (it routes to the right `expo-*` skill) for mobile, `stripe-best-practices` for payments,
`security-and-hardening` always, and `supabase-postgres-best-practices` for schema work. The approved plan
decides *what*; these skills inform *how*.

## 2. Work through the tasks in order
For each unchecked task:
1. **Test first**, following `tdd`: one vertical slice at a time, at the seams named in the plan's test plan
   (they're already agreed, so don't re-ask). Watch each test fail for the right reason. For a fix, the regression
   test from `bug.md` always comes first and must fail before the fix.
2. Write the smallest clean implementation that passes them. Reuse what exists and match the surrounding code.
3. Run the tests for the area you changed, plus the typecheck. Fix it until it's green before moving on.
4. Tick the task in `plan.md` (`- [x]`). Checkbox state is ignored by the approval hash. Changing anything
   else in an approved doc closes the gate.

## 3. While building
- **Stick to the plan.** If it turns out to be wrong, stop and explain. The doc gets updated and re-approved.
  Small mechanical deviations (a helper extracted, a file renamed) are noted in `verify.md` later; anything that
  changes behavior or design needs re-approval.
- Never write files through Bash to get around the gate.
- Don't leave TODOs, commented-out code, debug logs, or unused exports behind.
- Add or update code comments only where the *why* isn't obvious.

## 4. Finish
When every task is ticked and the full test suite passes, run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" stage verify`, then give a short summary of what was built.
Next step: `/mndx:verify` (chores with no code may go straight to `/mndx:ship`).
