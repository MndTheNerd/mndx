---
name: chore
description: Small non-feature work in an MNDX project (dependency bump, config, rename, tooling) with a one-paragraph chore.md for approval.
argument-hint: "<what to do>"
---

# /mndx:chore

Chore: **$ARGUMENTS**

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. If a chore is active at stage `chore`, continue it.
   If another item is active, say so and stop. Otherwise run
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new chore "<short title>"`.
2. Look at what's involved (read-only), run the `route` skill on it (a dependency bump is a security concern, a
   CI change is devops + `gha-security-review`), then fill in `chore.md`: what and why, the concerns, the concrete
   steps, and "done when". Remove the template marker.
3. **If it turns out to change user-facing behavior, it isn't a chore.** Abandon it and suggest `/mndx:spec`.
4. Hand off: "Review `chore.md`, then type `/mndx:approve`. Then `/mndx:build`, then `/mndx:ship`."
