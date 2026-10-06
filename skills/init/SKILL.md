---
name: init
description: Set up a project for MNDX (new or existing codebase) by interviewing the user and writing the product, architecture, stack ADR, CLAUDE.md quality bar, and the first setup chore.
argument-hint: "[one-line idea of the product]"
---

# /mndx:init

Set up this project for MNDX. Idea from the user (may be empty): **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Detect the situation
- Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. If it's already an MNDX project **and**
  `docs/PRODUCT.md` exists, say so, show the status, and stop. (A `.mndx/` folder without docs means autopilot
  just created it, so carry on.)
- Look at the directory. **Existing codebase?** (package.json, pyproject.toml, go.mod, src/, …) Then read enough of
  it to understand what it is, how it's structured, and which commands it already uses. You'll document what
  exists rather than invent it.

## 2. Route the product
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" route "<the idea>"`, then apply the `route` skill's judgment
pass at **product level**. Which concerns will this product have across v1? This decides what the interview must
settle and what the setup chore must include.

Also run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" skills list`. If recommended skills are missing, tell the
user `/mndx:skills install` adds them (they load from the next session).

## 3. Interview (skip under autopilot, see below)
Use the `grilling` skill: rounds of numbered questions, each with your recommended answer. Settle at least:
- the problem and who has it; the 2–4 must-have capabilities for v1, and what's explicitly out
- the platform: web / mobile / API / CLI / mix
- **markets and users:** which countries, which languages (RTL?), whether minors could use it. These drive
  privacy/compliance and i18n.
- **data:** what personal or sensitive data is collected. This drives the privacy inventory.
- **money:** free / paid / subscriptions / marketplace, and the gateway or in-app purchase. This drives payments.
- **accounts:** none / email / social / SSO, and roles. This drives auth.
- constraints: hosting preference, monthly budget, offline, deadline; stack preference or "you recommend"

For an existing codebase, ask only what the code can't tell you.

## 4. Choose the stack
Load the matching playbook skill(s): `stack-web`, `stack-mobile`, `stack-backend`. Propose **one** recommended
stack plus 1–2 alternatives with honest trade-offs, and let the user pick. (Autopilot: pick the playbook default.)

## 5. Write the docs
Create these from `${CLAUDE_PLUGIN_ROOT}/templates/project/`, filled in fully with no placeholders left:
- `docs/PRODUCT.md`, including its **Production concerns** section (each concern that applies across v1, why,
  and the ⚖ items that need a human decision)
- `docs/ARCHITECTURE.md` (the target architecture; for an existing codebase, the actual one)
- `docs/adr/0001-stack.md` (the stack decision and the options considered)
- `CLAUDE.md` at the root. If one exists, merge the MNDX sections into it and keep the existing content.
  Fill in the **Quality bar** table with the exact commands for this stack.
- `CHANGELOG.md`, if missing
- `docs/PRIVACY.md` with the data inventory, if the product handles personal data
  (`${CLAUDE_PLUGIN_ROOT}/skills/concerns/privacy-compliance.md` §1)

## 6. Initialize state and the first item
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" init
```
- **New project:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new chore "project setup"`, then fill in its
  `chore.md`: scaffolding commands, config files (strict TS / linters / formatter / test runner), folder layout,
  a first passing smoke test, a `.gitignore` (including `.scratch/` and `.env*` except `.env.example`), and `git
  init` if needed. Based on the product's concerns, also include: a CI workflow running the quality bar (devops),
  env validation at boot plus `.env.example` (security), the i18n layer (i18n), and `docs/DESIGN-SYSTEM.md` with
  tokens wired into the styling setup (UX, via `frontend-design` / `expo-design-system`). Done when every
  quality-bar command runs green on the empty app.
- **Existing project:** if the quality bar has gaps (no tests, no linter, no typecheck), create a chore to add the
  missing ones. Otherwise don't create any item.

## 7. Hand off
Summarize what you wrote (paths), the stack, and the quality bar. End with the next step:
"Review `chore.md`, then type `/mndx:approve`". Under autopilot, continue straight on as the autopilot skill says.

## Autopilot
Don't interview. Infer everything from the goal, pick the playbook defaults, and record every inference under
**Assumptions** in `docs/PRODUCT.md`.
