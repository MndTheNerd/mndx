# MNDX — Design Doc

> Status: **APPROVED · 2026-10-07** · Implemented in v0.1.0 (see README for usage)
> Owner: you (solo) · Builder: Claude Code on your subscription

## 1. Problem

Vibe coding with Claude is fast, but on its own it produces:

- code that nobody thought through (no spec, so no clear "done")
- architecture decisions that were made silently and later forgotten
- features with no tests, or tests that don't check the requirements
- docs that are missing or out of date

OBX (Obytes) fixes this for teams with a pipeline that has approval gates: Plan → approve → Build → Test → Merge → Monitor.
MNDX is the **solo-developer version**. It's the same disciplined pipeline without the team features
(no Slack/Jira/Linear, no PR review assignment, no multi-user approvals).

## 2. Goals / Non-goals

**Goals**
1. Every feature or bug fix goes through **Spec → Plan → Build → Verify → Ship**. Each step leaves a document behind.
2. A **hard gate** stops source code from being written until *you* approve the spec and plan.
3. The output is product-grade: typed, linted, tested, reviewed by a fresh-context agent, and documented.
4. Works for **web, mobile, backend/CLI**, or any stack. The stack is chosen per project and recorded as an ADR.
5. Runs entirely in Claude Code (CLI or desktop Code tab) on your subscription. No API keys, no servers.

**Non-goals**
- Team features (assignees, reviewers, chat or ticket integrations, dashboards).
- Autonomous production monitoring / self-healing. You run `/mndx:fix` when something breaks.
- Replacing your judgment. MNDX makes Claude stop at the points where you need to decide.

## 3. Packaging

A **Claude Code plugin** in this repo. You install it once and it's available in every project.

```
MNDX/
├─ .claude-plugin/
│  ├─ plugin.json            # plugin manifest
│  └─ marketplace.json       # lets you install from this local folder
├─ skills/                   # /mndx:* commands (the pipeline) + reference playbooks (stacks, quality bar)
├─ agents/                   # fresh-context reviewers
├─ hooks/hooks.json          # wires the gate + approval hooks
├─ scripts/                  # lib.js (state), mndx.js (CLI), gate.js, approve.js, tests
├─ templates/                # doc templates copied into projects
└─ docs/                     # MNDX's own docs (this file)
```

## 4. The pipeline

### Project level (once per project)

| Command | Produces | What happens |
|---|---|---|
| `/mndx:init` | `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/adr/0001-stack.md`, `CLAUDE.md`, `.mndx/state.json` | Claude interviews you about the problem, users, goals, non-goals and success criteria. It proposes a stack with trade-offs, you pick, and the choice is recorded as an ADR. It then sets the **quality bar**: the exact lint, typecheck, test and build commands. For an existing codebase it reads the code first and documents what's already there. |

### Feature level (repeat for every feature)

| # | Command | Produces | Gate |
|---|---|---|---|
| 1 | `/mndx:spec <idea>` | `docs/features/NNN-slug/spec.md` (user stories, **numbered acceptance criteria**, edge cases, out-of-scope) | `spec-reviewer` agent checks for gaps → **you approve** |
| 2 | `/mndx:plan` | `docs/features/NNN-slug/plan.md` (design, data/API changes, files to touch, ordered task checklist, test plan mapped to the acceptance criteria, risks), plus a new ADR if a real decision was made | **you approve** → gate opens |
| 3 | `/mndx:build` | Code + tests, working through the task checklist in order, each acceptance criterion backed by a test | gate must be open |
| 4 | `/mndx:verify` | `docs/features/NNN-slug/verify.md`: quality-bar results, an AC→test traceability table, and the `code-reviewer` agent's findings (correctness, security, performance, readability), with the findings fixed | all green |
| 5 | `/mndx:ship` | Updated `ARCHITECTURE.md` / `CHANGELOG.md`, a conventional commit, the feature marked done, the gate closed | — |

### Side paths

| Command | Use |
|---|---|
| `/mndx:fix <bug>` | Lightweight path for bugs: a `bug.md` (repro, root cause, fix plan) → **you approve** → regression test first → fix → verify. |
| `/mndx:chore <what>` | Small non-feature work (dependency bump, rename, config). A one-paragraph `chore.md` → **you approve** → do it. Keeps the gate honest without heavy ceremony. |
| `/mndx:status` | Where am I: active item, its stage, the remaining tasks, what to run next. |
| `/mndx:approve` | **Typed by you.** Approves the current stage's doc. |
| `/mndx:autopilot <idea>` | **Typed by you.** Runs the full pipeline unattended (see §5a). |

### 5a. Autopilot (leave it, come back to it done)

Typing `/mndx:autopilot <goal>` gives an **up-front approval for that goal**, which may cover several items
(for example the setup chore plus the first features). A hook records the grant, so only a command you typed can
create one.

- The pipeline itself doesn't change. Spec, plan and verify docs are still written, and the `spec-reviewer` and
  `code-reviewer` agents stand in for you at each approval point. Claude records the approvals through the MNDX CLI,
  which allows self-approval **only** while an autopilot grant is active for that item.
- Build → verify repeats until the whole quality bar passes, then it ships with a **local commit only** (never pushes).
- **Stop rules:** if the same failure survives 3 fix attempts, or a decision comes up that only you can make (product
  direction, paid service, destructive migration, credentials), it stops cleanly instead of guessing.
- It always ends with `docs/features/NNN-slug/report.md`: what was built, the test and build results, decisions made,
  shortcuts taken, and anything you should check.
- The grant ends when the goal is completed or autopilot stops, or as soon as you type `/mndx:autopilot stop` or
  any other `/mndx:` command (except status). After that, everything is gated normally again.
- For it to run unattended, start the session in a permission mode that doesn't stop to ask (e.g. auto-accept edits and
  allowed test/build commands). Otherwise Claude will wait at the first permission prompt.

## 5. The hard gate

**State:** `.mndx/state.json` in each project:
```json
{ "active": "003-user-auth", "kind": "feature", "stage": "build",
  "approvals": { "spec": "<sha256 of spec.md>", "plan": "<sha256 of plan.md>" } }
```

**Rules (PreToolUse hook on Edit / Write / MultiEdit / NotebookEdit):**
1. Always allowed: `docs/**`, root `*.md`, and `CLAUDE.md`. Writing the docs is the job before approval.
2. Anything else (source, tests, config) is **blocked** unless an item is active, its required docs are approved,
   and **the approved hashes still match the files on disk**. Editing the spec after approval closes the gate again
   until you re-approve, so the code can never drift from a document you didn't sign off on.
3. Claude can't approve its own work. Edits to `.mndx/**` are blocked. Approvals are written only by a
   **UserPromptExpansion hook** that fires when *you* type `/mndx:approve` (or `/mndx:autopilot`). Claude can't
   type those, and both commands are marked as not model-invocable. The one exception is self-approval through the
   MNDX CLI, which only works while an autopilot grant is active for the current item.
4. If the hook blocks an edit, Claude is told why and which command to run next.

**Known limit:** a determined Bash command (`echo > file`) could get around the edit hook. MNDX's instructions forbid
writing files through Bash, and the gate's job is to catch drift, not to stop someone who is deliberately bypassing it.

## 6. Quality bar ("product level")

The bar is defined once in `CLAUDE.md` by `/mndx:init` and enforced at `/mndx:verify`:
- strict typing (TS `strict`, mypy/pyright, Go vet), with a linter and formatter configured
- every acceptance criterion maps to at least one automated test; bug fixes always get a regression test
- no dead code, no unexplained TODOs, no secrets in code; inputs validated at the boundaries
- errors are handled deliberately (no swallowed exceptions); logging where it matters
- simple over clever: no abstraction without a second use
- docs are updated in the same change as the code

## 7. Agents (fresh context, so they're honest)

| Agent | Job |
|---|---|
| `spec-reviewer` | Attacks the spec: ambiguity, missing edge cases, untestable criteria, scope creep. |
| `code-reviewer` | Reviews the diff against the spec and plan: bugs, security, performance, readability, quality-bar violations. Reports findings only and doesn't fix them. |

## 8. Skills (reference playbooks Claude loads when relevant)

- `mndx-workflow`: the rules of the pipeline, so Claude follows it even outside the commands
- `stack-web`: Next.js/React conventions, folder structure, testing (Vitest/Playwright)
- `stack-mobile`: Expo/React Native conventions, inspired by the Obytes starter (expo-router, NativeWind, React Query, Zod, Jest, Maestro)
- `stack-backend`: Python (FastAPI/uv/pytest), Node (TS/Fastify), Go, CLI conventions
- `quality-bar`: the checklist from §6, with per-language commands

## 9. Install & use

```
claude plugin marketplace add MndTheNerd/mndx      # or a local folder path
claude plugin install mndx@mndx
```
(Full steps: [GETTING-STARTED.md](GETTING-STARTED.md).) Then in any project: `/mndx:init` → `/mndx:spec "..."` → `/mndx:approve` → `/mndx:plan` → `/mndx:approve` → `/mndx:build` → `/mndx:verify` → `/mndx:ship`.

## 10. Build plan for MNDX itself

1. Plugin manifest + marketplace file
2. Hook scripts (gate + approve), written in Node so they run the same on Windows, macOS and Linux
3. Templates (PRODUCT, ARCHITECTURE, ADR, spec, plan, verify, bug, chore, CLAUDE.md)
4. Commands (init, spec, plan, build, verify, ship, fix, chore, status, approve)
5. Agents (spec-reviewer, code-reviewer)
6. Skills (workflow, quality-bar, three stack playbooks)
7. Test the gate hooks with scripted cases (blocked / allowed / hash drift / self-approval attempt)
8. README with install + walkthrough

## 11. Production concerns, router & community skills (added 2026-10-07)

**Need:** a production product needs far more than "write the feature": design, frontend, backend, data, auth,
security, privacy and legal rules, payments, i18n, messaging, AI safety, observability, CI/CD, infra, store
policies. A task written in plain language rarely names these, so they get silently skipped.

**Design:**
- `config/concerns.json`: 20 concerns, each with trigger words, `implies` links (auth → privacy; payments →
  security + privacy + messaging), an `always` flag (testing/security always; UX/accessibility for any UI), an
  MNDX checklist, and community skills.
- `mndx.js route "<task>"`: a deterministic first pass (whole-word matching plus implied concerns). The `route`
  skill adds the judgment pass and records the result in the item's **Concerns** table. That table flows into
  spec ACs, the plan's Concern coverage, verify's concern checklists, and both reviewer agents.
- `skills/concerns/*.md`: MNDX checklists where no trustworthy community skill exists (privacy/compliance/legal,
  payments rules, i18n/RTL, messaging law, AI safety, devops, infra, app-store policies), plus security/testing/UX/
  accessibility/data/auth baselines. ⚖ marks items that need a human; they're never decided silently, and under
  autopilot they get a conservative default plus a report item.
- `config/skills.json`: 45 community skills from skills.sh, installed globally via `npx skills` (telemetry off) so
  `npx skills update` maintains them. Selection rule: fit to a concern, then install count, then publisher trust.
  Each skill was read before inclusion. Excluded: skills that duplicate or bypass the pipeline (`implement`,
  mattpocock `code-review`), off-topic popular ones, unreviewable or unlicensed ones.
- **Precedence:** MNDX rules override community skills (no push/deploy/commit/approval outside the pipeline;
  seams and decisions settled by approved docs).
- **Gate change:** `.scratch/` is always writable (git-ignored) so `diagnosing-bugs` can build repro loops before
  `bug.md` is approved, without opening source files.

## 12. Adopting existing projects (added 2026-10-07, v0.2.0)

**Need:** most real work happens on code that already exists, often vibe-coded or inherited. MNDX has to
understand it before changing it, and the owner must choose how far to go.

**Design:**
- `/mndx:init` detects an existing codebase and hands off to the **assess** skill (also runnable as `/mndx:assess`).
- **Learn:** read the whole project (parallel Explore agents for large ones), git hot spots, and **run** its own
  install/test/lint/typecheck/build plus a dependency audit for real facts. Never migrations, seeds, deploys, or
  anything touching real data.
- **Document what exists:** the actual ARCHITECTURE, an inferred PRODUCT (assumptions marked), GLOSSARY, the real
  quality bar in CLAUDE.md, and an existing-stack ADR, true whatever the choice.
- **Audit:** the new `project-auditor` agent (fresh context, read-only) scores 15 areas 0–3 and ranks findings with
  file:line, impact, fix and effort, plus what's worth keeping. Claude verifies the critical and high findings
  before reporting. Output: `docs/ASSESSMENT.md`.
- **Choose** (AskUserQuestion, recommendation first): **Rebuild** (incremental strangler vs fresh alongside;
  REBUILD.md with a parity inventory; backlog foundation → parity features → cutover → removal) · **Fix** (a
  risk-ordered BACKLOG of fix and chore items, quality bar first) · **Keep** (adopt; critical findings listed as
  accepted risk). The decision is recorded as an ADR.
- **Backlog:** `docs/BACKLOG.md` holds the ordered queue (only one item is active at a time). status, ship and the
  session hook suggest its first `todo` line.
- **Autopilot:** fix critical/high security, data or money findings, otherwise keep; **never rebuild without the user**.
- **SessionStart hook** (`session.js`): MNDX projects start each session with the active item, gate and next
  backlog item; un-adopted codebases get a one-time `/mndx:init` hint; `.mndxignore` silences it.

## 13. Open questions

- None blocking. Stack playbooks start opinionated, and you can edit them as your preferences settle.
