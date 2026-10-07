# Existing projects

MNDX isn't only for new projects. Point it at code you already have, whether you wrote it, inherited it, or
vibe-coded it, and it learns the project first, tells you honestly what state it's in, and lets **you** decide what
happens next.

```
/mndx:init        (in a folder that already has code)
     │
     ▼  1. LEARN    read the whole codebase, run its real tests / lint / build, map the domain
     ▼  2. DOCUMENT ARCHITECTURE.md (as it really is), PRODUCT.md (inferred), GLOSSARY.md, CLAUDE.md
     ▼  3. AUDIT    the project-auditor agent scores 15 areas and ranks findings with file:line evidence
     ▼  4. CHOOSE   ┌─ Rebuild it the right way
                    ├─ Fix what needs fixing
                    └─ Keep as-is and continue
```

You'll also get a one-line hint the first time you open an un-adopted codebase in Claude Code (from MNDX's session
hook). Put an empty `.mndxignore` file in a folder to turn the hint off there.

## 1. Learn

Claude reads the project the way a new senior hire would:
- structure, languages, frameworks and versions, entry points, how it starts
- git history: what changes most, how recent it is, whether it looks live
- every entry point and boundary (routes and screens, database, external APIs, auth, payments, jobs), followed
  end to end, plus the tests. Large codebases are split across parallel explorer agents.
- **it runs what exists**: installs dependencies, then runs the project's own tests, lint, typecheck, build and a
  dependency audit, and records the real results

It **never** runs migrations, seeds, deploy scripts, or anything that could touch a real database or external
service.

## 2. Document

Whatever you choose next, the project ends up documented:

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | the architecture as it **actually** is |
| `docs/PRODUCT.md` | what the product does, inferred from code and README, with inferences marked as assumptions for you to confirm |
| `GLOSSARY.md` | the domain terms the code uses |
| `CLAUDE.md` | the project's **real** quality-bar commands (merged with any existing CLAUDE.md) |
| `docs/adr/0001-existing-stack.md` | the stack as found |

## 3. Audit

The `project-auditor` agent works in a fresh context with no stake in the code. It scores 15 areas from 0 (missing or
dangerous) to 3 (production-grade):

> architecture · code quality · types · tests · security · data & migrations · auth · privacy & compliance ·
> payments · UX & accessibility · performance · observability · CI/CD · dependencies · docs

Every finding has a severity (critical / high / medium / low), a `file:line`, a concrete impact, a fix and an
effort estimate. Claude then double-checks the critical and high findings itself and drops anything it can't
confirm. It also lists **what's worth keeping**, because good parts must survive any fix or rebuild.

Everything lands in **`docs/ASSESSMENT.md`**.

## 4. Choose

You get a short summary (health, the top 3 findings, the strengths) and three options, with a recommendation:

### Rebuild it the right way
For when fixing would cost more than rebuilding: pervasive structural problems, an abandoned stack, or no
salvageable core. You then pick a strategy:
- **Incremental, in place** (strangler pattern): replace module by module and keep the app working at every
  step. Best when it's live, or has users or data.
- **Fresh foundation alongside:** build the new app next to the old one, then cut over. Best when nothing is live
  and the structure can't be saved.

Claude writes `docs/REBUILD.md`, with the target architecture and a **parity inventory** (every capability the
current app has, and its behavior), plus a data migration and cutover/rollback plan. The backlog becomes:
foundation → one **parity feature** per capability (with tests proving it matches the old behavior) → cutover →
remove old code.

### Fix what needs fixing
The findings become `docs/BACKLOG.md`, ordered by risk: critical, high, then the debt that slows every change.
Wrong behavior and security holes become `/mndx:fix` items. Structure, tooling and test gaps become `/mndx:chore`
items. Quick wins are batched into one chore. If there's no quality bar (tests, lint, typecheck), adding it comes
**first**, because fixes need a safety net.

### Keep as-is and continue
Adopt it now. The findings stay in ASSESSMENT.md, with critical ones listed in the backlog as **accepted risk** so
they stay visible. One exception: if the project has **no test command**, nothing can ship (MNDX's ship rules
need a real, green test run), so "keep" begins with one small chore that adds a test runner and a smoke test. New work goes through `/mndx:spec`, `/mndx:fix` and `/mndx:chore` as usual, and the gate applies
from here on.

The choice is recorded as an ADR (`docs/adr/NNNN-adoption.md`) with its reasons and the risks you accepted.

## Re-assessing

Run `/mndx:assess` any time, for example after a round of fixes or before a launch. It refreshes ASSESSMENT.md,
marks resolved findings, and offers the three choices again for what's left. Add a focus if you like:
`/mndx:assess security and payments`.

## Under autopilot

`/mndx:autopilot` on an existing codebase learns, documents and audits it, **fixes critical and high findings that
affect security, data or money**, and otherwise keeps the code. It **never chooses Rebuild by itself**. If the
audit recommends one, that goes in the report for you to decide.

## The backlog

`docs/BACKLOG.md` is an ordered table of what's next. `/mndx:status`, `/mndx:ship` and the session hook all suggest
its first `todo` line, so after each shipped item you're told exactly what to start next. Only one item is
active at a time; the backlog holds the rest.
