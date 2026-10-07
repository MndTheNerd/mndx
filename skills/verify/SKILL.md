---
name: verify
description: Verify the active MNDX item for real. Run the quality bar through mndx.js check (recorded, not claimed), prove every acceptance criterion with a test and a live run of the app, apply the concern checklists, get an independent code review, and record it all in verify.md.
---

# /mndx:verify

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` and the `quality-bar` skill first if you haven't loaded them yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. The gate must be open and the stage `build` or `verify`.
If it's `build`, check that every task in the plan is ticked; if not, say so and stop.
Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" stage verify`.

## 2. Run the quality bar (for real)
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" check
```
This runs every command in CLAUDE.md's Quality bar table and records the real exit codes in `.mndx/checks.json`,
along with a fingerprint of the code. **Shipping is refused** unless that record is green, includes a Test command,
is newer than the item's approval, and still matches the code. Any later code change means running `check` again.
Copy the real results (test counts, too) into verify.md. Never write "should pass".

## 3. Trace the ACs
For every AC in `spec.md` (or the regression test in `bug.md`), find the test that proves it and confirm it
ran and passed. An AC without a test is a failure: write the test, then run `check` again.

## 4. Live run (use the app like a user)
Tests can pass while the product is broken. Start the app with CLAUDE.md's **Run (dev)** command (in the background),
then exercise **every AC's user flow for real**:
- **Web:** drive it in a browser (the built-in browser pane, or `playwright-cli`): click through each flow, check
  the console for errors, and take screenshots at phone (~390 px) and desktop widths into the item's `evidence/` folder.
- **API / backend:** real requests (curl or a script in `.scratch/`) against the running server, including one error
  case. Paste trimmed responses.
- **CLI:** run the real commands with real arguments, including a bad-input case.
- **Mobile:** Expo web or a simulator/emulator if available. If none is available, record that, and what was checked instead.
- Use the Claude Code `run` skill if the project has a launch skill.

Record each flow in verify.md's **Live run** table (steps, what you observed, evidence). Then stop the app.
Anything broken here is a FAIL even if every test passed. Fix it, add a test that catches it, and run `check` again.

## 5. Concern checklists
For **every concern in the Concerns table**, go through its checklist (`${CLAUDE_PLUGIN_ROOT}/skills/concerns/`)
and record evidence for each item that applies. Run the concern tooling where it's installed:
- **Security:** a `semgrep` scan, the dependency audit, and `secret-serialization` if logs/telemetry changed.
  `gha-security-review` if workflows changed.
- **UI:** `web-design-guidelines` review, the `accessibility` audit (axe in e2e), using the live-run screenshots.
- **Web performance / SEO** (if in scope): `core-web-vitals` / `seo` / `web-quality-audit`.
- **Mobile release** (if in scope): `apple-appstore-reviewer`.
If a tool a concern needs isn't installed (for example the `semgrep` CLI; `mndx.js skills list` shows which ones),
**never record that check as passed**. Record it as **open** under Manual checks with its install command, and run
the fallback you do have (dependency audit, grep for dangerous APIs). A missing scanner never blocks PASS on its own,
but it must be visible.
⚖ items that need a human decision go under Manual checks as **open**. They don't block a PASS verdict, but they
must be listed in the ship summary (and in the autopilot report).

## 6. Independent review
Launch the `mndx:code-reviewer` agent. Pass it the item folder, the Concerns table, and the list of changed files
(`git diff --name-only` plus untracked files, or the plan's Files table if there's no git).
For each finding:
- **blocker / major:** fix it (the gate is open), then run `check` again
- **minor:** fix it, or note why not
- **disagree:** say why, in one line

## 7. Record
Fill in the item's `verify.md`: quality bar (from `check`), AC→test traceability, **live run**, concern
checklists, every review finding with its resolution, manual checks, and any small deviations from the plan.
**Verdict:** write PASS only if the last `check` is green and current, every AC is proven by a test **and** the
live run, and every blocker/major finding is fixed.

## 8. Loop or finish
- **FAIL:** fix, then repeat from step 2.
- **PASS:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" stage ship`. It re-checks everything mechanically
  and refuses with the exact reason if something's off. Then show the verdict summary and say: "Ready to ship.
  Run `/mndx:ship`."
