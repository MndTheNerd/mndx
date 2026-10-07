---
name: ship
description: Ship the verified MNDX item by updating living docs and the changelog, making a local conventional commit, and closing the item.
---

# /mndx:ship

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. Continue only if the stage is `ship` (features and
fixes need `verify.md` with Verdict PASS). A **chore** at stage `build` or `verify` may ship once its "Done when"
is met and the quality bar is green: run `stage ship` first.

## 2. Update the living docs
- `docs/ARCHITECTURE.md`: update it if structure, flows, the data model or conventions changed.
- `docs/PRODUCT.md`: tick the v1 scope lines this item delivered, and move ideas that came up to **Later**.
- `CLAUDE.md`: add any convention that was learned or decided.
- `CHANGELOG.md`: add a user-facing entry under `[Unreleased]` (Added / Changed / Fixed), linking the item folder.

## 3. Commit (local only)
If this is a git repo:
- `git status`, and make sure nothing unintended is included: no secrets, `.env`, build output or stray files.
- Stage the item's code, tests and docs, including `.mndx/state.json`.
- Commit with a conventional message: `feat(<scope>): <summary>` / `fix(...)` / `chore(...)`, with a body that
  references the item id. Follow any attribution rules from your instructions.
- **Never push** unless the user explicitly asks.

## 4. Close
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" done`. This closes the gate again.
If the item came from `docs/BACKLOG.md`, set its Status to `done (<commit>)`. If it resolved an ASSESSMENT finding,
mark that finding resolved.
Report the commit hash, then suggest the next item: the first `todo` line in BACKLOG.md, or else PRODUCT.md's first
unticked v1 scope line (`/mndx:spec <it>`).
