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
  With no active item, it's the first `todo` line of `docs/BACKLOG.md` (as `/mndx:spec|fix|chore <it>`), or else
  the first unticked v1 scope line in PRODUCT.md.

If it's not an MNDX project, say so and suggest `/mndx:init`. For an existing codebase, init learns and audits it
first, then asks whether to rebuild, fix or keep it.
