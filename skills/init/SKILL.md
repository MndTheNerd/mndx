---
name: init
description: Set up a project for MNDX. New project - interview, stack choice, product/architecture docs, quality bar, setup chore. Existing codebase - learn it fully, audit it, and let the user choose rebuild, fix, or keep as-is (via the assess skill).
argument-hint: "[one-line idea of the product]"
---

# /mndx:init

Set up this project for MNDX. Idea from the user (may be empty): **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Detect the situation
- Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. If it's already an MNDX project **and**
  `docs/PRODUCT.md` exists, say so, show the status, and stop. (A `.mndx/` folder without docs means autopilot
  just created it, so carry on.)
- Look at the directory. **Is there an existing codebase?** Signs: source files beyond a README, package.json /
  pyproject.toml / go.mod / Cargo.toml / *.csproj / pubspec.yaml, `src/` or `app/`, or a git history with code
  commits. **If so, stop here and follow `${CLAUDE_PLUGIN_ROOT}/skills/assess/SKILL.md` instead.** It learns the
  whole project, documents what really exists, audits it, and asks the user to rebuild, fix or keep it. The rest
  of this file is for new projects.

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

## 4. Choose the stack
Load the matching playbook skill(s): `stack-web`, `stack-mobile`, `stack-backend`. Propose **one** recommended
stack plus 1–2 alternatives with honest trade-offs, and let the user pick. (Autopilot: pick the playbook default.)

## 5. Write the docs
Create these from `${CLAUDE_PLUGIN_ROOT}/templates/project/`, filled in fully with no placeholders left:
- `docs/PRODUCT.md`, including its **Production concerns** section (each concern that applies across v1, why,
  and the ⚖ items that need a human decision)
- `docs/ARCHITECTURE.md` (the target architecture)
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
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new chore "project setup"`, then fill in its
  `chore.md`: scaffolding commands, config files (strict TS / linters / formatter / test runner), folder layout,
  a first passing smoke test, a `.gitignore` (including `.scratch/` and `.env*` except `.env.example`), a
  `.gitattributes` with `* text=auto eol=lf` (the same line endings on every OS), and `git init` if needed.
  Scaffold generators into `.scratch/` and copy the result in, so a generator can never touch existing docs. Based on the product's concerns, also include: a CI workflow running the quality bar (devops),
  env validation at boot plus `.env.example` (security), the i18n layer (i18n), and `docs/DESIGN-SYSTEM.md` with
  tokens wired into the styling setup (UX, via `frontend-design` / `expo-design-system`). Done when every
  quality-bar command runs green on the empty app.
- Create `docs/BACKLOG.md` from the template, listing the v1 scope lines as `/mndx:spec` items in build order.

## 7. Hand off
Summarize what you wrote (paths), the stack, and the quality bar. End with the next step:
"Review `chore.md`, then type `/mndx:approve`". Under autopilot, continue straight on as the autopilot skill says.

## Autopilot
Don't interview. Infer everything from the goal, pick the playbook defaults, and record every inference under
**Assumptions** in `docs/PRODUCT.md`.
