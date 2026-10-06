---
name: status
description: Show where the MNDX project stands, including the active item, approvals, code gate, autopilot, and the exact next step.
---

# /mndx:status

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`.

If there's an active item, also read its docs and count the ticked and unticked tasks in `plan.md`.

Reply in a few lines:
- **Active:** id, kind, title, stage, plus tasks done/total if building
- **Gate:** OPEN or CLOSED, and why
- **Autopilot:** on (with the goal) or off
- **Next:** the one exact command to run next. Use `/mndx:approve` when a filled-in doc is waiting for approval.

If it's not an MNDX project, say so and suggest `/mndx:init`.
