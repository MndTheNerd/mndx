---
name: autopilot
description: User-only. Run the whole MNDX pipeline unattended for a goal (init if needed, then spec, plan, build, verify, ship for every item), with reviewer agents standing in for the user's approvals, and finish with a report.
argument-hint: "<goal> | stop"
disable-model-invocation: true
---

# /mndx:autopilot

Goal: **$ARGUMENTS**

The user typed this and has left. Their approval for this goal was given up front: the MNDX hook recorded an
autopilot grant before this message reached you (it blocks the command if the grant failed). If `$ARGUMENTS`
is `stop`, just confirm autopilot is off with `mndx.js status`, and you're done.

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` and `${CLAUDE_PLUGIN_ROOT}/skills/quality-bar/SKILL.md` now.

## What changes under autopilot, and what doesn't

**Unchanged:** every doc still gets written in full, every step still runs, the quality bar still has to be
fully green, and you still never get around the gate.

**Changed:**
- **No questions to the user.** Decide using the product docs, the playbook defaults, and common sense. Record
  every non-obvious decision and assumption, because the user reviews them in the report.
- **Reviewers approve instead of the user.** A doc is approved only when its review comes back with no
  blocker or major findings. Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" approve`.
  Never approve a doc that hasn't been reviewed.
- **Continue on your own** from one step to the next and from one item to the next, without waiting.
- **Route every item** (the `route` skill) exactly as in manual mode, and apply every concern's checklist and
  installed skills. Concerns aren't optional under autopilot.
- **⚖ items** (legal, compliance, store policy, tax, gateway contracts) are never decided by you. Pick the safest
  conservative default (e.g. opt-in consent, test-mode payments, no tracking), build it, and list each item under
  "Please check" in the report.
- **Never install skills** under autopilot. Note missing or recommended ones in the report.
- **Skill instructions that would wait for the user** (`grilling` rounds, `tdd` seam confirmation,
  `diagnosing-bugs` hypothesis review) are settled by the approved docs and your recorded assumptions instead.

CLI shorthand below: `mndx` means `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js"`.

## Loop

0. `mndx status`. Note the start time. If the project isn't initialized, follow
   `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md` in its autopilot form. That creates and documents everything,
   including the setup chore. For an **existing codebase**, init hands off to the assess skill's autopilot form:
   learn, document and audit, fix critical/high security, data or money findings, otherwise keep, and **never
   rebuild without the user**.
1. **Break the goal down** into an ordered list of items (the setup chore if needed, then features and fixes),
   each small enough to spec, build and verify in one pass. Write them into `docs/BACKLOG.md` (and the v1 scope in
   `docs/PRODUCT.md`). If an item is already active, finish it first. If the goal is "work the backlog", take its
   `todo` lines in order.
2. **For each item**, follow the matching skill file in `${CLAUDE_PLUGIN_ROOT}/skills/`, skipping its hand-off
   step:
   - **feature:** `spec/SKILL.md`, where `mndx:spec-reviewer` is the gate. Fix the findings, re-review if there
     were blockers, then `mndx approve`. Then `plan/SKILL.md`: launch `mndx:spec-reviewer` again on the plan
     (ask it to check the plan against the spec: every AC covered, tasks complete and in order, risks handled),
     fix, then `mndx approve`.
   - **fix:** `fix/SKILL.md`, then `mndx:spec-reviewer` on `bug.md` (root cause proven? regression test
     specific?), then `mndx approve`.
   - **chore:** fill in `chore.md`, then a brief self-check against the quality bar, then `mndx approve`.
   - Then `build/SKILL.md`, then `verify/SKILL.md` (the code-reviewer findings get fixed), then `ship/SKILL.md`
     (a **local commit only**, never pushed). Then move on to the next item.
3. **Build ↔ verify loop:** a failing check gets diagnosed at its root cause and fixed, then re-verified. Keep a
   count of attempts per distinct failure.

## Stop rules (stop cleanly instead of guessing)

Stop the whole run when:
- the **same failure** survives **3** genuine fix attempts
- a decision only the user can make blocks progress (and has no safe conservative default): spending money or a paid service, real credentials or API keys, live payment mode,
  destructive data or migration changes, deleting user files, legal or licensing questions, or a product
  direction the docs don't cover and where both options are reasonable but conflict
- a permission prompt or a missing tool you can't install blocks progress
- the goal turns out much larger than it looked (more than ~8 items). Ship the first meaningful slice, then stop
  and propose the rest.

When stopping: leave the active item as it is (don't abandon it), and make sure the working tree is coherent
(commit nothing that's broken).

## Finish (always, whether completed or stopped)

1. Write `docs/autopilot/<YYYY-MM-DD>-<goal-slug>.md` from `${CLAUDE_PLUGIN_ROOT}/templates/item/report.md`,
   filled in honestly with real results. **"Decisions made without you"** and **"Please check"** are the most
   important sections. If stopped: exactly why, and what you need from the user.
2. `mndx autopilot-end completed "<one line>"` or `mndx autopilot-end stopped "<reason>"`.
3. Final message: the report path, a 3-line summary, the commits made, and the first thing the user should look at.
