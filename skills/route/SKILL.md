---
name: route
description: Map any task written in plain language to the production concerns it touches (UX, frontend, mobile, API, data, auth, security, privacy/compliance/legal, payments, i18n, messaging, AI, observability, devops, infra, app-store, testing, performance, SEO) and the checklists and skills to apply. Use at the start of every MNDX spec, fix or chore, and whenever a request's scope changes.
argument-hint: "<task in plain language>"
---

# /mndx:route

Task: **$ARGUMENTS** (when invoked from another MNDX step, the task is that step's idea, bug or chore)

## 1. First pass (deterministic)
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" route "<the task, verbatim>"
```
Add `--ui` if the product has a user interface even when the task doesn't say so (check `docs/PRODUCT.md`).
This returns the matched concerns, why each matched, its MNDX checklist, and its community skills (with install status).

## 2. Judgment pass (this is the part that matters)
Keyword matching is only a starting point. Think like a staff engineer, a designer, a security reviewer and a
compliance officer looking at this task in **this** product (read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`):
- **Add implied concerns** the words don't mention. For example, "let users upload a profile photo" implies
  security (uploads), privacy (personal data), data (storage), infra (object storage, cost), UX (states), and
  accessibility (alt text). "Add a subscription" implies payments, auth, privacy, messaging (receipts), and
  app-store (IAP) if there's a mobile app.
- **Drop false positives** where a keyword matched but the concern doesn't apply. Say so in one line.
- The full concern list is in `${CLAUDE_PLUGIN_ROOT}/config/concerns.json`. **Testing** and **security** always
  apply. **UX** and **accessibility** apply to anything a user sees.

## 3. Load what applies
For each concern you keep:
- Read its checklist from `${CLAUDE_PLUGIN_ROOT}/skills/concerns/` (if it has one).
- Load its community skills that are installed (call the Skill tool with the skill name). Load them now if you're
  about to design or build; at spec time, skim them for requirements the spec should capture.
- **Missing skill:** tell the user `/mndx:skills install` adds it (under autopilot, note it in the report and continue).
- **No concern fits** part of the task (a new domain, such as maps, video, blockchain or hardware): load
  `find-skills`, search the skills.sh leaderboard, and **recommend** the best-ranked option from a trusted
  publisher. Installing it is the user's decision; never install it under autopilot.

MNDX rules override every skill you load: no push/deploy/commit/approval outside the pipeline, and stay inside
the approved plan.

## 4. Record it
Fill in the **Concerns** table in the active item's `spec.md` (or `bug.md` / `chore.md`): concern → why it
applies → checklist and skills → what it adds to this item. Every requirement a concern adds becomes an AC or
non-functional requirement in the spec, and a test or verify check in the plan. That's how the plan, build and
verify steps know what to apply. The table is approved together with the doc.

When invoked directly by the user (outside a spec), just report the concerns, the skills you'd apply, and the
⚖ items that need their decision, and suggest the MNDX command to start.
