---
name: assess
description: Adopt an existing codebase into MNDX. Learn the whole project, document what really exists, get an independent audit against the quality bar and every production concern, then let the user choose to rebuild it the right way, fix what needs fixing, or keep it as-is and continue. Runs automatically from /mndx:init on existing code; re-run any time.
argument-hint: "[focus area or notes]"
---

# /mndx:assess

Notes from the user (may be empty): **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.
This step only **reads** code. You write only `.md` docs, which the gate allows, until the user picks a path and
approves an item.

## 1. Learn the project (you, in this session)
The goal is real understanding, because every later decision depends on it.
- **Map it:** directory tree (skip `node_modules`, build output, vendored code), languages, frameworks and
  versions (package.json / pyproject / go.mod / Cargo.toml / lockfiles), entry points, and how it starts.
- **History:** `git log --oneline | head -50`, the most-changed files, recent activity, and whether it's live
  (deploy config, env files, prod URLs in config).
- **Read the code**, thoroughly. Start at every entry point and boundary (routes/screens, DB access, external
  APIs, auth, payments, background jobs), follow the main flows end to end, and read the tests. For a large
  codebase, launch parallel `Explore` agents per area and read their summaries. Say what you sampled.
- **Run what exists, to get facts:** install dependencies with the project's own package manager, then run its
  existing test, lint, typecheck and build commands, plus a dependency audit. Record the exact commands and real
  results. **Never** run migrations, seeds, deploy scripts, or anything that would talk to a real database or
  external service. Check the env and config first. If running something could affect real data, don't.
- **Domain:** the nouns and verbs the code uses. Note inconsistent names.

## 2. Document what exists (it's true even if they choose "keep")
Using `${CLAUDE_PLUGIN_ROOT}/templates/project/`:
- `docs/ARCHITECTURE.md`: the **actual** architecture (components, flows, data model, conventions), not an ideal one
- `docs/PRODUCT.md`: inferred from the code and README. Mark inferences as **Assumptions** for the user to confirm.
  Production concerns come from `mndx.js route` run on what the product does.
- `GLOSSARY.md`: domain terms as the code uses them (the `domain-modeling` skill)
- `CLAUDE.md`: the **real** quality-bar commands found in step 1 (merge with any existing CLAUDE.md, keeping its content)
- `docs/adr/0001-existing-stack.md`: the stack as found, and why it's likely that way (from evidence)

## 3. Independent audit
Launch the `mndx:project-auditor` agent with the project root, the stack, the commands, and the real results from
step 1 (and the user's focus notes, if any). Then load `security-and-hardening` and spot-check its critical and high
findings yourself. Drop anything you can't confirm, and say so.

Write `docs/ASSESSMENT.md` from the template: the checks that were run, the scorecard, findings with file:line,
what's worth keeping, and the three options with effort and risk.

## 4. Ask the user to choose
Summarize in a few lines: what the project is, its health (scorecard highlights), the top 3 findings, and what's
good. Then use **AskUserQuestion** with the recommended option first (marked "(Recommended)"):

1. **Rebuild it the right way:** a new foundation built properly, with nothing the current app does lost
2. **Fix what needs fixing:** a prioritized backlog of fixes, highest risk first, keeping the codebase
3. **Keep as-is and continue:** adopt it now, save the findings for later, and go straight to new work

## 5. Follow the choice
Record it in `docs/adr/NNNN-adoption.md` (the options, the decision, the reasons, what's accepted), set the
Decision line in ASSESSMENT.md, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" init` if `.mndx/` doesn't
exist yet, then:

### Rebuild
1. Ask (AskUserQuestion) for the strategy, recommending one based on the audit:
   - **Incremental, in place** (strangler pattern): replace module by module behind the existing interfaces, and
     keep the app working at every step. Best when it's live or has real users or data.
   - **Fresh foundation alongside:** build the new app in a new folder or branch, using the old one as the
     reference, then cut over. Best when the current structure can't be salvaged and nothing is live.
2. Write `docs/REBUILD.md`: the target architecture (following the stack playbooks plus the "worth keeping" list),
   and a **parity inventory**, meaning every capability the current app has, with its observable behavior. The
   old code is the source of truth for behavior unless the user says otherwise. Add a data migration plan if
   there's persistent data, and the cutover and rollback plan.
3. Fill in `docs/BACKLOG.md`: a foundation chore (scaffold + quality bar + CI), then one parity feature per
   capability (each spec cites the old behavior it must match, with tests proving parity), then a cutover chore,
   then a removal chore for the old code.
4. Start the first item with `mndx.js new chore "rebuild foundation"` and write its `chore.md`.

### Fix
1. Turn the findings into `docs/BACKLOG.md`, ordered by risk: critical first, then high, then the medium items
   that slow every change. Bug-like findings (wrong behavior, security holes) become **fix** items. Structural,
   tooling and test-gap findings become **chore** items. Batch all quick wins into one chore. Each line cites its
   ASSESSMENT number.
2. If the quality bar is missing (no tests, lint or typecheck), its chore goes **first**: fixes need a safety net.
3. Start the first item (`mndx.js new fix|chore "<title>"`), and fill in its doc.

### Keep as-is
1. Leave `docs/BACKLOG.md` with any critical findings listed as "accepted risk (see ASSESSMENT #n)", so they're
   visible but not scheduled.
   **If the project has no Test command**, say so plainly: MNDX can't ship any item until CLAUDE.md's quality bar
   has a test command that `mndx.js check` can run. So "keep" still starts with one small chore that adds a test
   runner and a first smoke test. Put it as backlog item 1.
2. Tell the user MNDX is ready: new work goes through `/mndx:spec`, `/mndx:fix` and `/mndx:chore` as normal,
   and the gate applies from now on. Ask what they want to build next.

Every path ends with the usual hand-off: what was written (paths) and the exact next command
(usually "review `chore.md` / `bug.md`, then `/mndx:approve`").

## Autopilot
Don't ask. Choose **Fix** for critical and high findings that affect security, data or money, otherwise **Keep**,
and continue toward the goal. **Never choose Rebuild without the user.** Recommend it in the report if the audit
says so. Record the choice and reasons under "Decisions made without you".

## Re-running
On a project already in MNDX, `/mndx:assess` refreshes ASSESSMENT.md (keeping the old one's decision for comparison),
marks resolved findings, and offers the same three choices for what remains.
