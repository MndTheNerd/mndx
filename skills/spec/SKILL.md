---
name: spec
description: Start an MNDX feature by turning an idea into a reviewed spec with numbered, testable acceptance criteria. Use when the user wants to build a new feature in an MNDX project.
argument-hint: "<feature idea>"
---

# /mndx:spec

Feature idea: **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

## 1. Check state
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`.
- If it's not an MNDX project, tell the user to run `/mndx:init`, then stop.
- If a **feature is active at stage `spec`**, work on that spec. Don't create a new item.
- If any other item is active, say which one and that it has to be shipped or abandoned first, then stop.
- If no item is active, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new feature "<short title>"`.

## 2. Understand it
- Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `GLOSSARY.md` (if present) and the relevant existing code, so
  the spec fits what exists.
- **Route it:** follow the `route` skill for this idea. It identifies every production concern (security,
  privacy/compliance, payments, accessibility, …), loads their checklists and skills, and fills in the spec's
  Concerns table.
- **Interview:** if the idea is ambiguous in ways that change behavior, interview the user with the `grilling`
  skill (rounds, with a recommended answer for each question). Include questions the concerns raise, such as ⚖
  legal or compliance items, which gateway, or which countries. Don't ask about things you can reasonably decide;
  write those as stated assumptions instead. Use `domain-modeling` when terms are fuzzy, and update GLOSSARY.md.

## 3. Write `spec.md`
Fill in every section of the item's `spec.md`, and remove the template marker and the comments.
- Acceptance criteria are numbered, start with Given/When/Then, are observable, and **each one can be tested
  automatically** (or is marked *manual* with a reason).
- Cover errors and edge cases on purpose: empty, invalid, too large, unauthorized, duplicate, offline, concurrent.
- **Every concern's requirements are in the spec**: e.g. authorization rules (security), consent and deletion
  (privacy), webhook-driven payment state (payments), WCAG AA (accessibility), RTL (i18n). Each one is an AC
  or a non-functional requirement, never left implicit.
- "Out of scope" is specific. "Open questions" ends up empty, or every remaining item is explicitly deferred.
- Product-level only: describe behavior, not implementation. That goes in the plan.

## 4. Independent review
Launch the `mndx:spec-reviewer` agent with the spec's path. Fix every **blocker** and **major** finding in the
spec. For minor findings, apply or reject each one with a reason.

## 5. Hand off
Show a short summary: the problem in one line, the AC list, what's out of scope, and any assumptions. Then:
"Review `docs/features/<id>/spec.md`, then type `/mndx:approve` (or tell me what to change). Next is `/mndx:plan`."
Don't write the plan or any code yet.
