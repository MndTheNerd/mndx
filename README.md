# MNDX

**A solo product team inside Claude Code.** MNDX makes every change go through
**Spec → Plan → Build → Verify → Ship**. Code can't be written until you've approved what's being built, and
everything that ships is typed, tested, reviewed and documented.

Inspired by [OBX](https://obx.obytes.com/) from Obytes, minus the team features. It runs entirely on your Claude
subscription: no API keys, no servers.

## Install

From a terminal:

```bash
claude plugin marketplace add D:\localAi\MNDX
```

```bash
claude plugin install mndx@mndx
```

Then restart Claude Code (or open a new session in the desktop app). Requires Node 18+ on your PATH.

## Use

```
/mndx:init "a habit tracker for people who hate habit trackers"
    → interview → docs/PRODUCT.md, ARCHITECTURE.md, adr/0001-stack.md, CLAUDE.md (quality bar), setup chore
/mndx:approve          ← you, after reading chore.md
/mndx:build            → scaffolds the project, quality bar green
/mndx:ship             → local commit

/mndx:spec "streaks with a grace day"   → spec.md + independent review
/mndx:approve
/mndx:plan                               → plan.md (tasks + test plan per acceptance criterion)
/mndx:approve                            ← code gate opens
/mndx:build                              → test-first, task by task
/mndx:verify                             → full quality bar + AC traceability + code review → verify.md
/mndx:ship                               → docs + changelog + local commit, gate closes
```

| Command | What it does |
|---|---|
| `/mndx:init [idea]` | Set up a new or existing project |
| `/mndx:spec <idea>` | Start a feature: spec with numbered, testable acceptance criteria |
| `/mndx:plan` | Technical plan for the approved spec |
| `/mndx:build` | Implement the approved plan, test-first |
| `/mndx:verify` | Quality bar, AC→test proof, independent code review |
| `/mndx:ship` | Update docs, changelog, local commit, close the item |
| `/mndx:fix <bug>` | Bug path: root cause → `bug.md` → regression test first → fix |
| `/mndx:chore <task>` | Small non-feature work with a one-paragraph `chore.md` |
| `/mndx:status` | Where you are and the exact next step |
| `/mndx:route <task>` | Show which production concerns, checklists and skills a task needs |
| `/mndx:skills [list\|install\|update]` | Manage the community skills |
| `/mndx:approve [doc]` | **You only.** Approve the waiting doc |
| `/mndx:abandon [reason]` | **You only.** Drop the active item (docs are kept) |
| `/mndx:autopilot <goal>` | **You only.** Run everything unattended, see below |

## Every task is routed to its production concerns

Write tasks in plain language. Before speccing anything, MNDX's **router** maps the task to the production
concerns it touches. Then it loads the matching **checklists** (MNDX's own) and **community skills**:

| Concern | MNDX checklist | Community skills |
|---|---|---|
| Testing *(always)* | ✓ | `tdd`, `property-based-testing`, `playwright-best-practices` |
| Security *(always)* | ✓ OWASP | `security-and-hardening`, `sharp-edges`, `semgrep`, `secret-serialization` |
| Product & UX *(any UI)* | ✓ | `frontend-design`, `web-design-guidelines`, `expo-design-system` |
| Accessibility *(any UI)* | ✓ WCAG 2.2 AA, ADA/EAA | `accessibility` |
| Web frontend · Mobile · API | stack playbooks | `frontend-ui-engineering`, `vercel-react-best-practices`, `expo-*`, `vercel-react-native-skills`, `api-and-interface-design`, `fastify-best-practices`, `node` |
| Data & database | ✓ | `supabase-postgres-best-practices`, `domain-modeling` |
| Identity & access | ✓ | `better-auth-*` |
| Privacy, compliance & legal | ✓ GDPR, CCPA, COPPA, Gulf PDPLs… | none (no trustworthy community skill) |
| Payments & billing | ✓ PCI, webhooks, IAP rules | `stripe-best-practices` |
| i18n (incl. RTL) · Email/SMS · AI/LLM | ✓ | `claude-api` (AI) |
| Performance · SEO · Observability | — | `performance-optimization`, `core-web-vitals`, `seo`, `observability-and-instrumentation` |
| CI/CD · Infra & hosting · App stores | ✓ | `ci-cd-and-automation`, `gha-security-review`, `shipping-and-launch`, `apple-appstore-reviewer` |

```
node scripts/mndx.js route "Let users pay for a premium plan with Stripe"
→ payments (mentions: pay, stripe), security, privacy + messaging (implied by payments), testing …
```

A keyword pass does the first round (`config/concerns.json`, with implied concerns: accounts → privacy,
payments → security + privacy + receipts). Claude then adds what the words don't say and drops false positives.
The result goes into the spec's **Concerns** table, and from there:
- every concern adds acceptance criteria to the spec
- the plan has a design decision and a proof for each concern
- verify ticks each concern's checklist with evidence
- the reviewer agents treat a missing security, privacy or payments concern as a blocker

⚖ legal and compliance items are never decided silently. They become questions for you, or under autopilot a
safe default plus a "Please check" item. **Nothing here is legal advice.**

## Community skills

MNDX uses 45 community skills from [skills.sh](https://skills.sh/), installed globally with the open-source
`npx skills` CLI. Each one was chosen for its concern, ranked by installs and publisher trust (official vendors:
Vercel, Anthropic, Stripe, Expo, Supabase, Microsoft, Sentry, Trail of Bits, Better Auth; plus well-known
authors: Matt Pocock, Addy Osmani, Matteo Collina), and read before inclusion. The full list with reasons is in
[config/skills.json](config/skills.json).

```
/mndx:skills list                 # what's installed
/mndx:skills install [group|all]  # core, security, payments, ops, web, mobile, backend
/mndx:skills update               # = npx skills update -g
```

MNDX's rules always win over a community skill's. If a skill suggests pushing, deploying, committing or
skipping a doc, MNDX doesn't.

## The hard gate

- Until the active item's docs are approved, Claude can only edit `.md` files. Any other edit is blocked by a hook,
  which tells Claude which step comes next.
- An approval is tied to the doc's exact content (a SHA-256 hash). If the spec or plan changes afterwards, the gate
  closes again until you re-approve. Ticking task checkboxes doesn't count as a change.
- Approvals come only from **you typing** `/mndx:approve`. That command can't be triggered by Claude: the hook only
  fires for typed commands, Claude's Skill-tool calls to it are blocked, and `.mndx/` can't be edited by Claude's
  tools or shell.
- `.scratch/` (git-ignored) is always writable for bug repro harnesses and throwaway spikes. Nothing in it ships.
- Projects without a `.mndx/` folder aren't affected at all.

**Known limit:** a deliberately obfuscated shell command could still write a file. MNDX's rules forbid it, and the
gate exists to stop drift, not someone actively trying to get around it.

## Autopilot

```
/mndx:autopilot build the habit tracker v1 from docs/PRODUCT.md
```

Typing it is your up-front approval for that goal. Claude then runs the whole pipeline alone:
- it breaks the goal into items and writes every spec, plan and verify doc
- the `spec-reviewer` and `code-reviewer` agents gate each step instead of you
- it loops build ↔ verify until the quality bar is fully green
- each item ships with a **local commit only**, never pushed

It **stops cleanly** (instead of guessing) when the same failure survives 3 fix attempts, or when it reaches a
decision that's yours to make: money, credentials, destructive data changes, or an unclear product direction.

It always finishes with a report in `docs/autopilot/`: what was built, the real test and build results,
**decisions it made without you**, and **what to check first**.

- `/mndx:autopilot stop`, or typing any other `/mndx:` command, ends autopilot and hands approvals back to you.
- To truly leave it running, start the session in a permission mode that doesn't stop for edits and test/build
  commands (e.g. *Accept edits* plus allowed commands). Otherwise it waits at the first permission prompt.

## What's inside

```
.claude-plugin/   plugin.json, marketplace.json
skills/           the /mndx:* commands + reference playbooks (workflow, quality-bar, stack-*, route, concerns/ checklists)
config/           skills.json (community skills to install), concerns.json (router taxonomy)
agents/           spec-reviewer, code-reviewer (fresh context, report-only)
hooks/hooks.json  PreToolUse gate + UserPromptExpansion approvals
scripts/          lib.js (state), mndx.js (CLI), gate.js, approve.js, test/
templates/        project docs (PRODUCT, ARCHITECTURE, ADR, CLAUDE.md, CHANGELOG) and item docs
docs/DESIGN.md    the design of MNDX itself
```

Per project, MNDX creates:

```
.mndx/state.json                    active item, approvals (hashes), autopilot grant, history. Commit it
docs/PRODUCT.md, ARCHITECTURE.md, adr/
docs/features/001-…/spec.md plan.md verify.md
docs/fixes/…/bug.md verify.md
docs/chores/…/chore.md
docs/autopilot/<date>-<goal>.md     autopilot reports
CLAUDE.md, CHANGELOG.md
```

## Customize

The stack playbooks (`skills/stack-*/SKILL.md`) and the quality bar (`skills/quality-bar/SKILL.md`) are
opinionated starting points. Edit them as your preferences settle, then run `claude plugin update mndx@mndx`
(or restart, since local-directory plugins load in place).

## Develop

```bash
npm test
```

```bash
claude plugin validate .
```
