---
name: abandon
description: User-only. Close the active MNDX item without shipping it. Its docs are kept for reference.
argument-hint: "[reason]"
disable-model-invocation: true
---

# /mndx:abandon

Reason: **$ARGUMENTS**

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status` and show the user what will be abandoned.
2. If code was already written for it (check `git status`), list the changed files and ask whether to keep
   or revert them. Don't revert anything without a clear yes.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" abandon "<reason>"` and confirm it's done.
