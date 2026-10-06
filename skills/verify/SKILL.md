---
name: verify
description: Verify the active MNDX item against the full quality bar and its acceptance criteria, get an independent code review, fix the findings, and record everything in verify.md.
---

# /mndx:verify

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` and the `quality-bar` skill first if you haven't loaded them yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. The gate must be open and the stage `build` or `verify`.
If it's `build`, check that every task in the plan is ticked; if not, say so and stop.
Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" stage verify`.

## 2. Run the quality bar
Run **every** command from the CLAUDE.md quality-bar table (format check, lint, typecheck, full test suite,
build). Record the real result of each, including test counts. Never write "should pass".

## 3. Trace the ACs
For every AC in `spec.md` (or the regression test in `bug.md`), find the test that proves it and confirm it
ran and passed. An AC without a test is a failure: write the test.

## 3b. Concern checklists
For **every concern in the Concerns table**, go through its checklist (`${CLAUDE_PLUGIN_ROOT}/skills/concerns/`)
and record evidence for each item that applies. Run the concern tooling where it's installed:
- **Security:** a `semgrep` scan, the dependency audit, and `secret-serialization` if logs/telemetry changed.
  `gha-security-review` if workflows changed.
- **UI:** `web-design-guidelines` review, the `accessibility` audit (axe in e2e), and real screenshots of the key
  screens at phone and desktop sizes with `playwright-cli` (web) or the simulator (mobile).
- **Web performance / SEO** (if in scope): `core-web-vitals` / `seo` / `web-quality-audit`.
- **Mobile release** (if in scope): `apple-appstore-reviewer`.
⚖ items that need a human decision go under Manual checks as **open**. They don't block a PASS verdict, but they
must be listed in the ship summary (and in the autopilot report).

## 4. Independent review
Launch the `mndx:code-reviewer` agent. Pass it the item folder, the Concerns table, and the list of changed files
(`git diff --name-only` plus untracked files, or the plan's Files table if there's no git).
For each finding:
- **blocker / major:** fix it (the gate is open), then re-run the affected checks
- **minor:** fix it, or note why not
- **disagree:** say why, in one line

## 5. Record
Fill in the item's `verify.md`: the quality-bar table with the real results, AC→test traceability, every review
finding with its resolution, manual checks, and any small deviations from the plan.
**Verdict:** PASS only if every check is green and every AC is proven.

## 6. Loop or finish
- **FAIL:** fix, then repeat from step 2.
- **PASS:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" stage ship`, show the verdict summary, and say:
  "Ready to ship. Run `/mndx:ship`."
