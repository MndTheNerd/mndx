---
name: reviews
description: How to launch and re-launch the MNDX reviewer agents (spec-reviewer, code-reviewer) in quick or full mode. Load before launching any reviewer.
user-invocable: false
---

# Reviews: quick and full

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" review-mode` to see the mode. The default is **quick**, the
token-saving one. The user switches with "use full reviews" or "use quick reviews": run
`mndx.js review-mode full` or `mndx.js review-mode quick`. Both modes need the same approvals and the same
verdict rule (no blocker or major findings). Only the cost differs.

## First review (both modes)
A fresh, full review. Pass the reviewer: the doc or item folder, the changed file list, and the Concerns table.

## Re-review after fixing findings

| | Quick (default) | Full |
|---|---|---|
| Re-review needed? | Only if the last review had a **blocker or major** finding | Same |
| Minor findings | Apply or reject each with a one-line reason, then approve. **Never** re-review for minors | Same |
| What the reviewer gets | **Delta mode**: the numbered previous findings and the diff since the last review (`git diff`, or the doc's before and after text) | The same instructions as the first review, so it re-reads everything |
| Reviewer reads | Only the findings, the diff and the files it touches | Everything a first review reads |
| Expected cost | About 60-75% less per re-review | Full cost per re-review |

In delta mode the reviewer answers one line per previous finding (`resolved`, `not resolved (why)`) and reports a
**new problem** only if the diff introduced it. Start the prompt with `MODE: DELTA` and list the findings. Never
send `MODE: DELTA` for a first review.

## Always
- Never approve or ship on a reviewer that returned REVISE or CHANGES REQUIRED with a blocker or major open.
- A `VERDICT: APPROVE` or `PASS` with only minors is final: don't launch a reviewer to confirm minors.
- verify's code review of the whole item is always a fresh full review, in both modes. It is the backstop for
  anything a delta review missed.
