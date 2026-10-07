# User guide

How to work with MNDX every day. For installation see [GETTING-STARTED.md](GETTING-STARTED.md).

- [The idea](#the-idea)
- [Commands](#commands)
- [The feature loop, step by step](#the-feature-loop-step-by-step)
- [Bugs and chores](#bugs-and-chores)
- [Approving, re-approving, abandoning](#approving-re-approving-abandoning)
- [What MNDX creates in your project](#what-mndx-creates-in-your-project)
- [Existing projects](#existing-projects)
- [Tips](#tips)

## The idea

Claude is a fast builder, but speed without understanding produces code nobody thought through. MNDX makes every
change go through the steps a good product team follows, and leaves a document behind at each one:

```
idea ─► route ─► spec ─► (you approve) ─► plan ─► (you approve) ─► build ─► verify ─► ship
         │        │                        │                         │        │         │
     concerns   what & why             how & tests              test-first  proof    commit
```

- **Route**: work out which production concerns the task touches (security, payments, privacy, UX…), and load
  the checklists and skills for them. See [CONCERNS.md](CONCERNS.md).
- **Spec**: what we're building and why, with numbered acceptance criteria (AC1, AC2…) that can be tested.
- **Plan**: how. The design, the files, an ordered task list, and a test for every AC and every concern.
- **Build**: test-first, task by task, exactly as planned.
- **Verify**: the whole quality bar, AC → test proof, concern checklists, and an independent code review.
- **Ship**: update the living docs and changelog, then make a local commit.

Until you approve the spec and plan, Claude **can't** edit code. A hook enforces it. See
[HOW-IT-WORKS.md](HOW-IT-WORKS.md).

## Commands

| Command | Who | What |
|---|---|---|
| `/mndx:init [idea]` | you | New project: interview, stack, docs, quality bar, setup chore. Existing code: learn → audit → rebuild / fix / keep |
| `/mndx:assess [focus]` | you | (Re-)audit an existing codebase and choose rebuild / fix / keep |
| `/mndx:spec <idea>` | you | Start a feature and write its spec |
| `/mndx:plan` | you | Write the plan for the approved spec |
| `/mndx:build` | you | Implement the approved plan |
| `/mndx:verify` | you | Prove it works, record it in verify.md |
| `/mndx:ship` | you | Docs + changelog + local commit, close the item |
| `/mndx:fix <bug>` | you | Bug path: root cause → bug.md → regression test → fix |
| `/mndx:chore <task>` | you | Small non-feature work (deps, config, tooling) |
| `/mndx:status` | you / Claude | Where am I, and the exact next command |
| `/mndx:route <task>` | you / Claude | Which concerns, checklists and skills a task needs |
| `/mndx:release [version\|major\|minor\|patch] [deploy]` | you | Gated release: release.md → approve → bump + changelog + check + local tag; deploys only if asked |
| `/mndx:skills [list\|install\|update]` | you | Manage community skills |
| `/mndx:approve [doc]` | **you only** | Approve the waiting doc |
| `/mndx:abandon [reason]` | **you only** | Drop the active item (docs are kept) |
| `/mndx:autopilot <goal\|stop>` | **you only** | Run everything unattended, see [AUTOPILOT.md](AUTOPILOT.md) |

You don't have to remember the order. `/mndx:status` always tells you the next command, and every step ends by
saying what comes next.

## The feature loop, step by step

### `/mndx:spec <idea>`
Write the idea the way you'd say it: *"/mndx:spec let users export their data as CSV"*.

1. Claude runs the router. "Export their data" brings in **data** and **privacy** (data portability), plus
   **testing** and **security** (always).
2. If something's ambiguous, Claude interviews you in rounds. Each question has a recommended answer; answer
   the ones you care about, or say "use your recommendations".
3. It writes `docs/features/NNN-slug/spec.md`: problem, users, stories, **acceptance criteria**, edge cases,
   non-functional requirements, the **Concerns** table, out of scope, and open questions.
4. The `spec-reviewer` agent (a fresh context, so it judges only the page) attacks the spec. Blockers and majors
   get fixed before you see it.

**Your job:** read the spec. If it's right, `/mndx:approve`. If not, say what to change. Claude edits it and
you approve then.

### `/mndx:plan`
Claude reads the code, reuses what exists, and writes `plan.md`: the approach (and why not the alternatives),
data and interface changes, every file touched, an ordered task checklist, a **test plan mapping every AC to a
test**, **concern coverage** (a design decision + proof per concern), risks, and an ADR for any real decision.

**Your job:** read the plan, then `/mndx:approve`. This opens the code gate.

### `/mndx:build`
Test-first, one vertical slice at a time (the `tdd` skill), at the seams the plan named. Each task gets ticked off
in `plan.md`. Ticking boxes doesn't count as changing the plan. If the plan turns out to be wrong, Claude
**stops and tells you**. The plan gets updated and re-approved rather than silently changed.

### `/mndx:verify`
Runs **every** quality-bar command from your project's CLAUDE.md through `mndx.js check`, which records the real exit
codes and a fingerprint of the code. **Shipping is mechanically refused** unless that record is green and current.
Then it **runs the app for real** and walks through every acceptance criterion like a user: browser for web, real
requests for an API, real commands for a CLI. Then:
- AC → test traceability, where every AC must have a passing test
- concern checklists with evidence (a semgrep scan, an accessibility audit, screenshots, and so on)
- the `code-reviewer` agent reviews the change against the spec, plan and checklists, and its findings get fixed

Everything goes into `verify.md`, ending with a **PASS / FAIL** verdict. On FAIL, it fixes and repeats.

### `/mndx:ship`
Updates ARCHITECTURE.md, ticks PRODUCT.md's scope, adds a CHANGELOG entry, makes a conventional commit (**never
pushed** unless you ask), and closes the item. The gate closes again.

## Bugs and chores

**`/mndx:fix <bug>`**: paste the error or describe the symptom. Claude builds a reproduction loop in `.scratch/`
(always writable, git-ignored), proves the root cause with file:line references, and writes `bug.md` (symptom,
repro, root cause, fix plan, regression test, blast radius). You approve, and then `/mndx:build` writes the
**failing regression test first**, then the fix. Then `/mndx:verify` → `/mndx:ship`.

**`/mndx:chore <task>`**: dependency bumps, config, renames, tooling. A one-paragraph `chore.md` → approve →
`/mndx:build` → `/mndx:ship`. If the "chore" turns out to change what users see, Claude turns it into a spec.

## Releases

`/mndx:release` turns the changelog's `[Unreleased]` into a version. It's a gated item like any other:
1. Claude proposes the version (SemVer from the changelog: breaking → major, Added/Changed → minor, only fixes →
   patch) and writes `docs/releases/NNN-vX.Y.Z/release.md` with what's in it, a readiness checklist and a rollback plan.
2. You approve. Claude bumps the version in the manifest, finalizes CHANGELOG, runs `mndx.js check`, ships the item,
   commits `chore(release): vX.Y.Z` and creates a **local** tag.
3. `stage ship` refuses unless the version agrees in release.md, CHANGELOG (with a fresh `[Unreleased]`) and
   package.json, on a green, current check.
4. **Deploy only if you asked** (`/mndx:release minor deploy`), using the command in `docs/RUNBOOK.md`, followed by a
   smoke check. Nothing is pushed: Claude gives you `git push && git push --tags` to run when you're ready.

## Scope warnings

While building, every edit is compared with the plan's **Files** table. An edit outside it isn't blocked, but Claude
is warned right away and the file is logged. `/mndx:status` shows them, and verify has to explain each one under
"Deviations from the plan". Anything that changes behavior means the plan goes back to you for re-approval.

## Approving, re-approving, abandoning

- `/mndx:approve` approves the **next** doc that needs it (spec, then plan; or bug; or chore).
- `/mndx:approve spec` / `plan` re-approves a specific doc. You'll need that after a doc changes, because an
  approval is tied to the doc's exact content (a SHA-256 hash). Edit an approved spec, and the gate closes until
  you re-approve.
- You can't approve an unfilled template, or a plan before its spec. The hook refuses and tells you why.
- `/mndx:abandon <reason>` closes the active item without shipping. Its docs stay as a record. If code was
  already written, Claude asks whether to keep or revert it.
- Only **one item is active** at a time. Ship or abandon it before starting the next.

## What MNDX creates in your project

```
CLAUDE.md                        quality-bar commands + conventions (Claude reads this every session)
CHANGELOG.md
GLOSSARY.md                      domain terms (when they come up)
.mndx/state.json                 active item, approval hashes, history (commit it)
.scratch/                        throwaway repros and spikes (git-ignored)
docs/
  PRODUCT.md                     problem, users, goals, production concerns, markets, v1 scope
  ARCHITECTURE.md                living architecture
  DESIGN-SYSTEM.md               tokens and visual rules (UI projects)
  PRIVACY.md                     personal-data inventory (if any)
  BACKLOG.md                     ordered list of what's next (status/ship suggest its top line)
  ASSESSMENT.md, REBUILD.md      existing projects: audit results, rebuild plan
  RUNBOOK.md                     deploy / rollback / restore (when hosting exists)
  adr/0001-stack.md …            decisions and their reasons
  features/NNN-slug/             spec.md  plan.md  verify.md
  fixes/NNN-slug/                bug.md  verify.md
  chores/NNN-slug/               chore.md
  autopilot/<date>-<goal>.md     autopilot reports
```

Commit all of it, including `.mndx/state.json`. Then the project carries its full history and works on any PC.

## Existing projects

Run `/mndx:init` in a folder that already has code. Claude **learns the whole project** (reads it, runs its real
tests and build), documents what really exists, has the `project-auditor` agent score it with file:line
evidence, and then asks you to choose one of three:

- **Rebuild it the right way**, incrementally or fresh alongside, with parity specs so nothing is lost
- **Fix what needs fixing**, as a risk-ordered backlog of fix and chore items
- **Keep as-is and continue**, adopting it now and keeping the findings for later

Re-run the audit any time with `/mndx:assess`. Full details: [EXISTING-PROJECTS.md](EXISTING-PROJECTS.md).

## Tips

- **Write ideas like a user would.** "Let teachers invite students by email" is better than "add invite
  endpoint". The router and spec work best from intent.
- **Small items ship faster.** If a spec has more than about 8 ACs, ask Claude to split it.
- **Answer ⚖ questions.** Legal and compliance items are flagged precisely because they need a human.
- **Say "approve and continue"** after `/mndx:approve` if you want Claude to start the next step right away.
- **Use autopilot for well-understood work** (scaffolding, CRUD, a feature whose spec you already approved),
  and the manual loop for anything novel.
