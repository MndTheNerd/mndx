# MNDX

**A solo product team inside Claude Code.**

MNDX makes Claude build software the way a good product team does. Every change is understood, written down
and approved **before** code is written, then built test-first, verified against a production-grade bar, and
shipped with its docs.

```
idea ─► route ─► spec ─► ✋ you approve ─► plan ─► ✋ you approve ─► build ─► verify ─► ship
```

- 🛑 **Hard gate:** Claude physically can't edit code until you approve the spec and plan. Change an approved doc
  and the gate closes again. A watchdog catches code written through the shell.
- ✅ **Verified, not claimed:** `mndx.js check` runs your real test, lint, typecheck and build commands. Shipping is
  refused unless they're green **for the current code**, and the app was actually run and used for every acceptance
  criterion.
- 🧭 **Concern router:** any task written in plain language is checked against 20 production concerns (security,
  privacy & legal, payments, UX, accessibility, data, auth, i18n/RTL, devops, infra, app-store policies…). Their
  checklists and expert skills are applied all the way through.
- 🧰 **45 curated community skills** from [skills.sh](https://skills.sh/), from Stripe, Expo, Vercel, Anthropic,
  Supabase, Microsoft, Sentry, Trail of Bits and others, kept current with `npx skills update`.
- 🔍 **Independent reviewers:** fresh-context agents critique every spec and every change.
- 🏚️ **Existing projects:** MNDX learns the whole codebase, audits it with evidence, then lets you choose to
  **rebuild it the right way**, **fix what needs fixing**, or **keep it and continue**.
- 🤖 **Autopilot:** `/mndx:autopilot <goal>` runs the whole pipeline unattended and ends with an honest report.
- 💳 Runs **entirely on your Claude subscription**, inside Claude Code. No API keys, no servers.


---

## Install

You need Claude Code, Node.js 18+ and Git. Full walkthrough: **[docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)**.

```bash
claude plugin marketplace add MndTheNerd/mndx
```
```bash
claude plugin install mndx@mndx
```

Then, in a Claude Code session, run `/mndx:skills install all` and start a new session.

## Use

```
/mndx:init a habit tracker for people who hate habit trackers
      → interview → PRODUCT.md, ARCHITECTURE.md, stack ADR, CLAUDE.md (quality bar), setup chore
/mndx:approve   /mndx:build   /mndx:ship                 → scaffolded app, green quality bar, first commit

/mndx:init                       (in a folder with existing code)
      → learns the project, runs its tests, ASSESSMENT.md → you choose: rebuild · fix · keep

/mndx:spec streaks with a one-day grace period           → routed concerns + spec with numbered ACs + review
/mndx:approve
/mndx:plan                                               → tasks, a test per AC, a proof per concern
/mndx:approve                                            ← code gate opens
/mndx:build                                              → test-first, task by task
/mndx:verify                                             → quality bar, AC→test proof, checklists, code review
/mndx:ship                                               → docs + changelog + local commit, gate closes
```

| Command | What it does |
|---|---|
| `/mndx:init [idea]` | New project: interview → docs → setup chore. Existing code: learn → audit → rebuild / fix / keep |
| `/mndx:assess [focus]` | Re-audit an existing codebase and choose again |
| `/mndx:spec <idea>` | Start a feature: routed concerns + a spec with testable acceptance criteria |
| `/mndx:plan` | Technical plan for the approved spec |
| `/mndx:build` | Implement the approved plan, test-first |
| `/mndx:verify` | Quality bar, AC→test proof, concern checklists, independent code review |
| `/mndx:ship` | Update docs and changelog, local commit, close the item |
| `/mndx:fix <bug>` | Root cause → `bug.md` → regression test first → fix |
| `/mndx:chore <task>` | Small non-feature work |
| `/mndx:status` | Where you are and the exact next step |
| `/mndx:route <task>` | Which concerns, checklists and skills a task needs |
| `/mndx:release [version] [deploy]` | Gated release: version, changelog, check, local tag; deploys only if asked |
| `/mndx:skills [list\|install\|update\|rollback]` | Manage the community skills (updates are snapshotted and risk-scanned) |
| `/mndx:approve [doc]` | **You only.** Approve the waiting doc |
| `/mndx:abandon [reason]` | **You only.** Drop the active item |
| `/mndx:autopilot <goal\|stop>` | **You only.** Run everything unattended |

## Documentation

| Guide | |
|---|---|
| [Getting started](docs/GETTING-STARTED.md) | install on any PC, first project, first feature |
| [User guide](docs/GUIDE.md) | every command and step in depth, what MNDX creates, tips |
| [Existing projects](docs/EXISTING-PROJECTS.md) | learn → audit → rebuild / fix / keep, and the backlog |
| [Autopilot](docs/AUTOPILOT.md) | unattended runs, stop rules, permission setup |
| [Production concerns](docs/CONCERNS.md) | the router, the 20 concerns, legal/compliance, extending it |
| [Community skills](docs/SKILLS.md) | the 45 skills, why each was chosen, adding more |
| [Customizing](docs/CUSTOMIZING.md) | change stacks, quality bar, checklists, templates; release a new version |
| [How it works](docs/HOW-IT-WORKS.md) | hooks, state, the approval hash, the CLI, tests |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | gate, approvals, autopilot, updates |
| [Design](docs/DESIGN.md) | the approved design and its rationale |
| [Token savings](docs/TOKEN-SAVINGS.md) | where a run's tokens go, and the proposals to cut them (proposal) |
| [Changelog](CHANGELOG.md) | release history |

## Repository layout

```
.claude-plugin/   plugin.json, marketplace.json
skills/           /mndx:* commands, reference playbooks (workflow, quality-bar, stack-*), route, concerns/ checklists
agents/           spec-reviewer, code-reviewer, project-auditor (fresh context, report-only)
hooks/hooks.json  SessionStart context + PreToolUse gate + UserPromptExpansion approvals
scripts/          lib.js, mndx.js (CLI), gate.js, approve.js, session.js, route.js, skills.js, test/
config/           skills.json (community skills), concerns.json (router taxonomy)
templates/        project docs and per-item docs
docs/             the guides above
```

## Develop

```bash
npm test
```
```bash
claude plugin validate .
```

CI runs the tests on Ubuntu and Windows (Node 20 and 24) on every push. To release a change, raise the version in
`.claude-plugin/plugin.json`, push, then run `claude plugin marketplace update mndx` and
`claude plugin update mndx@mndx` on each PC. See [Customizing](docs/CUSTOMIZING.md#releasing-your-change).

## Proof it works

MNDX was dogfooded by building a real app (a habit tracker) end to end under autopilot. Its reviewers found
16 major defects across spec, plan and code before anything shipped. `mndx.js check` caught a typecheck/build
failure while all 76 tests were green. Every issue the run exposed in MNDX itself was fixed in v0.3.0
(see the [changelog](CHANGELOG.md)).

## Limits, honestly

- The shell watchdog detects and reports code written through the shell, but doesn't undo it, and needs git.
- The compliance, payments and store checklists flag what commonly applies. **They aren't legal advice.** ⚖
  items always go to a human.
- Autopilot needs a permissive permission mode to run unattended. It never pushes, deploys or spends money.

## License

[MIT](LICENSE) © mndthenerd. Community skills keep their own licenses (installed from their sources, not bundled here).
