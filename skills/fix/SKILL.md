---
name: fix
description: Fix a bug the MNDX way. Reproduce it, find the root cause, write bug.md for approval, then fix it with a regression test first.
argument-hint: "<bug description or error>"
---

# /mndx:fix

Bug: **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`.
- If a **fix is active at stage `bug`**, continue with it.
- If another item is active, say so and stop. The exception is a bug blocking that active item: tell the user
  and suggest abandoning it or finishing it first.
- Otherwise run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new fix "<short title>"`.

## 2. Investigate (source is gated, `.scratch/` is not)
Follow the `diagnosing-bugs` skill, with these MNDX adjustments:
- Build the **feedback loop in `.scratch/`**: a failing test copy, curl script, CLI fixture, or Playwright
  script (`playwright-cli` for UI bugs) that imports or calls the real code. That folder is always writable.
- Instrument through `.scratch/` harnesses and debuggers, not by editing source. If proving the cause really
  requires temporary source instrumentation, make that the first step of the fix plan instead.
- Reproduce, minimize, rank 3–5 falsifiable hypotheses, and prove the **root cause** with file:line references.
  It has to explain every symptom.
- Route it (`route` skill): a bug that leaks data is a security and privacy concern, wrong totals are a payments
  concern, and so on. Note the concerns in `bug.md`.
- Check the blast radius: other callers of the same code path.

## 3. Write `bug.md`
Fill in every section, and remove the template marker and the comments. The fix plan is the smallest change
that removes the cause. The regression test is specific: what it sets up and what it asserts.

## 4. Hand off
Summarize the cause and the fix in 2–3 lines, then: "Review `bug.md`, then type `/mndx:approve`.
After that, `/mndx:build` writes the failing regression test first, then the fix."
