---
name: workflow
description: The MNDX rules. Load whenever working in a project that has a .mndx/ folder, before writing or changing any code, and before running any /mndx:* step.
user-invocable: false
---

# MNDX workflow rules

MNDX turns Claude Code into a disciplined solo product team. Nothing gets built until it's understood,
written down, and approved. "Product level" means typed, tested, reviewed, documented, and simple.

## The pipeline

```
/mndx:init (once)  →  per item:  spec → plan → build → verify → ship
                                  └── approve ──┘ (each doc)
side paths: /mndx:fix (bug.md → build → verify → ship), /mndx:chore (chore.md → build → ship)
```

Work items live in `docs/features|fixes|chores/NNN-slug/`. State is in `.mndx/state.json`.

## CLI

All state changes go through the CLI. Never edit `.mndx/` any other way.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" <init|status|new|stage|done|abandon|approve|autopilot-end>
```

Run `status` whenever you're unsure where things stand. It also reports whether the code gate is open.

## Hard rules

1. **Docs before code.** You can't edit non-`.md` files until the active item's docs are approved. If the gate
   blocks you, don't look for a way around it: no shell redirects, no scripts that write files, no renaming
   files to `.md`. Tell the user which step comes next.
2. **You never approve your own work.** Only the user approves, by typing `/mndx:approve`. The one exception is
   autopilot (see the autopilot skill), when a reviewer agent's verdict stands in for the user's.
3. **Changing an approved doc closes the gate again.** If you find during build that the spec or plan is wrong,
   stop, update the doc, explain the change, and ask for re-approval. Don't silently build something different
   from what was approved.
4. **One active item at a time.** Finish it (`/mndx:ship`) or the user abandons it (`/mndx:abandon`).
5. **Scope discipline.** Build exactly what the spec and plan say. Ideas that come up along the way go under
   "Later" in `docs/PRODUCT.md`, not into the code.
6. **Ask instead of guessing** (outside autopilot). A decision that changes behavior, cost, data, or security
   belongs to the user.
7. **Never** push, deploy, publish, run destructive migrations, or touch real credentials unless the user asks
   for it directly.
8. **Route every task.** When a task arrives in plain language (a /mndx command or a plain request in an MNDX
   project), run the `route` skill first. It maps the task to production concerns (UX, frontend, mobile, API,
   data, auth, security, privacy/compliance/legal, payments, i18n, messaging, AI, observability, devops, infra,
   app-store, testing, performance, SEO) and their checklists and community skills. The result goes into the
   item's Concerns table, and every later step applies it.
9. **MNDX overrides community skills.** Skills you load (tdd, frontend-design, stripe-best-practices, …) bring
   expertise, not authority. If one says to push, deploy, commit, open a PR, skip a doc, or ask for a
   confirmation the approved plan already settles, follow MNDX.
10. **`.scratch/` is the sandbox.** It's always writable and git-ignored: bug repro harnesses, throwaway
    prototypes, spikes. Nothing in it ships. Real code moves out of it only through an approved item.

## Writing good docs

- Write for a reader who wasn't in the conversation: concrete, short, no filler.
- Acceptance criteria are numbered (AC1, AC2, …), observable, and testable. "Fast" isn't a criterion,
  "p95 < 200 ms for 1k rows" is.
- When there's a real choice between options (library, data store, architecture), record it as an ADR in
  `docs/adr/NNNN-title.md`, using `${CLAUDE_PLUGIN_ROOT}/templates/project/adr.md`.
- Remove the `<!-- mndx:template -->` marker and every unused placeholder comment when you fill in a doc.
  A doc that still has the marker can't be approved.

## Quality

Load the `quality-bar` skill before build and verify, and the matching stack playbook (`stack-web`,
`stack-mobile`, `stack-backend`) before planning or building. Concern checklists live in the `concerns` skill
(`${CLAUDE_PLUGIN_ROOT}/skills/concerns/`).

## Community skills by stage
Load them with the Skill tool when they're installed (`/mndx:skills` lists and installs them):

| Stage | Community skills |
|---|---|
| init / spec | `grilling` (interview, not under autopilot), `domain-modeling` (GLOSSARY.md + ADRs) |
| plan | `codebase-design`, `api-and-interface-design`, plus the concern and stack skills from the Concerns table |
| build | `tdd`, plus the concern and stack skills (e.g. `frontend-design`, `stripe-best-practices`, `expo-overview`) |
| verify | `semgrep`, `web-design-guidelines`, `accessibility`, `playwright-cli`, plus the concern checklists |
| fix | `diagnosing-bugs` (harnesses in `.scratch/`), `tdd` for the regression test |
| anything uncovered | `find-skills` (recommend only; installing is the user's call) |
