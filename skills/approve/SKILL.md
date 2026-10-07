---
name: approve
description: User-only. Approve the active MNDX item's next doc (spec, plan, bug, or chore), or a named one.
argument-hint: "[spec|plan|bug|chore]"
disable-model-invocation: true
---

# /mndx:approve

The user just approved. The MNDX hook already recorded the approval before this message reached you; it
blocks the command itself if approval wasn't possible.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status` to confirm what was approved and the new stage.
2. Reply in one or two lines with what's approved and the next command:
   - spec approved: next is `/mndx:plan`
   - plan, bug or chore approved: the code gate is open, so next is `/mndx:build`
   - release approved: the gate is open, so continue with step 3 of `/mndx:release`
3. Don't start the next step unless the user asked for it in the same message (for example "approve and continue").

Never edit `.mndx/` and never re-record approvals yourself.
