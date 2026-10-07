<!-- mndx:template -->
# {{ID}} — Verification

> Filled in by /mndx:verify. Re-run after any fix.

## Quality bar
<!-- From `mndx.js check`, which ran CLAUDE.md's commands for real (recorded in .mndx/checks.json). -->
| Check | Command | Result |
|---|---|---|
| Lint | `…` | ✅ / ❌ |
| Typecheck | `…` | |
| Tests | `…` | e.g. 42 passed, 0 failed |
| Build | `…` | |

## Acceptance criteria → tests
| AC | Test(s) | Result |
|---|---|---|
| AC1 | `path::test name` | ✅ |

## Live run
<!-- The app was started for real (CLAUDE.md "Run (dev)") and each AC's user flow was exercised the way a user
     would. Browser/simulator for UI, real requests for an API, real invocations for a CLI. One row per flow.
     Screenshots go in ./evidence/. If it truly can't be run here, write one row saying why and what was done instead. -->
| Flow | Steps | Observed | Evidence |
|---|---|---|---|
| AC1 … | … | ✅ … | `evidence/ac1-desktop.png` |

## Concern checklists
<!-- For each concern in spec.md: its checklist items that apply, ticked with evidence (command output, test, screenshot).
     ⚖ items that need the user go under "Manual checks" as open. -->
| Concern | Checklist result | Evidence |
|---|---|---|

## Code review
<!-- Findings from the mndx:code-reviewer agent and what was done about each. -->
| # | Severity | Finding | Resolution |
|---|---|---|---|

## Deviations from the plan
<!-- Every file from `mndx.js scope` (edited outside plan.md's Files table), plus any other mechanical deviation,
     each with a one-line reason. Behavior or design changes are not deviations: they need plan re-approval. -->

## Manual checks
<!-- Anything that still needs a human (real device, ⚖ decisions), and its status. -->

## Verdict
<!-- Write PASS (every check green, every AC proven by a test and the live run) or FAIL plus what remains. -->
