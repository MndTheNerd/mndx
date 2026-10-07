# Token savings: spec

> Status: **proposal**, for the owner to review. Nothing here is implemented except item 1, which is
> [PR #6](https://github.com/MndTheNerd/mndx/pull/6).
> Goal: a feature costs far fewer tokens to run through MNDX, **without weakening any gate**.

## Where the tokens went
Measured on one real run: building the MNDX site (a landing page, search metadata, a release and a fix) took
16 fresh-context reviewer runs. The agent tool reported about **770k tokens** for them, from 24k to 94k each
(figures include the resumed context of re-reviews). Roughly half were re-reviews after fixing earlier
findings. Reviews were by far the largest single cost. Everything else was smaller:

| Cost | Size | Notes |
|---|---|---|
| Reviewer runs | ~770k | 16 runs, all inheriting the session's most expensive model |
| Re-reviews | about half of the above | each re-read the whole doc and its context to check a handful of fixes |
| Long docs | specs and plans of 100–200 lines | every reviewer re-reads them |
| Skill files | ~27k tokens in total across 40 files | only a few load per step: **not** the problem |
| `mndx.js check` output | small | already one line per check and only the last 25 lines of a failure |

## What this does **not** do
- **No compressed or invented "low-token language".** Tokenizers are built for normal text: common English
  words are about one token each, and invented shorthand often splits into more tokens. It would also cost
  reasoning to decode and make reviews less reliable, which is MNDX's whole point. A website converter
  wouldn't affect plugin usage either.
- **No skipped gates.** Every approval still needs a review with no blocker or major findings. Verify still
  needs a green recorded `check`, a live run, and a code review for code changes.
- **No quieter `check` output.** It's already compact (see above).

## Proposals
Each item is independent and can ship alone.

### 1. Reviewers run on a cheaper model (PR #6, done)
`model: sonnet` in `spec-reviewer`, `code-reviewer` and `project-auditor`. They only read and report. One
code review on Sonnet during that run traced timing through the product code and found real minor issues.
Opus stays one line away (`model: opus` or `inherit`).

- **AC1.1** Every agent file declares `model:`, and a test fails if one doesn't.
- **AC1.2** `docs/CUSTOMIZING.md` explains how to override it.

### 2. Re-review is a delta check
Today, after fixing findings, Claude launches the reviewer again with the same instructions, and it re-reads
everything. Instead the re-review gets (a) the previous findings with their numbers and (b) the diff since the
last review, and returns one line per finding: `resolved`, `not resolved (why)` or `new problem (severity)`.

- **AC2.1** `agents/spec-reviewer.md` and `agents/code-reviewer.md` define a **delta mode**: when given
  previous findings and a diff, read only those and the touched files, and answer per finding. They report a
  new problem only if the diff introduced it.
- **AC2.2** `skills/spec`, `plan`, `fix`, `verify` and `autopilot` tell Claude to use delta mode for every
  re-review, passing the finding list and `git diff` (or the doc's before/after text for docs).
- **AC2.3** A first review is still full. A re-review is still required before approving when the first
  review had a blocker or major finding.
- **Expected saving:** 60–75% of each re-review.

### 3. Don't re-review for minor findings
The rule is already "approve when there are no blocker or major findings", but the skills don't say what to
do with minors. They should say: apply or reject each minor with a one-line reason, then approve. No re-review.

- **AC3.1** The skills state that minor-only findings never trigger a re-review.
- **AC3.2** A reviewer that returns `VERDICT: APPROVE` with minors is never re-run to confirm the minors.

### 4. Review what changed, not the world
Reviewers explored widely: they re-read PRODUCT, ARCHITECTURE and other docs in full each time.

- **AC4.1** The skills pass reviewers the file list and the spec's Concerns table. They no longer say
  "read everything".
- **AC4.2** The reviewer agents are told to read only what the findings need, to open a file in full only
  when its line numbers matter, and to put minor findings in one batch at the end.

### 5. A lighter path for small items
A one-line config change shouldn't cost a spec, a plan and two review rounds. Chores already skip the plan.
Fixes and test-only changes still get two reviews.

- **AC5.1** A fix whose diff touches only test files (or only docs) gets the `bug.md` review and **no**
  separate code review. It still runs the full recorded `check` and the live run.
- **AC5.2** `skills/verify` says how to decide: `git diff --name-only` has no files outside `tests/` and `docs/`,
  and the Concerns table has no security, payments, privacy or auth row.
- **AC5.3** Everything else (any product code, or any such concern) keeps the full path.
- **Out of scope for now:** a merged spec+plan for small features. That's a bigger change to the approval
  model, so it should be its own spec.

### 6. Shorter docs
Every reviewer re-reads the whole spec and plan, and in the run above plans reached 200 lines.

- **AC6.1** `templates/item/spec.md`, `plan.md` and `bug.md` carry a size note: small items fit on about a
  page, and a section with nothing to say is deleted, not filled with "n/a".
- **AC6.2** `agents/spec-reviewer.md` reports padding (restated requirements, boilerplate rows) as a **minor**
  finding.

### 7. Keep command output small
The biggest avoidable cost on Claude's side is reading full tool output. `check` is fine, but test runners and
installers aren't.

- **AC7.1** `skills/build` and `skills/verify` tell Claude to run noisy commands with filtered output (for
  example the last 15 lines, or only the failures), and to re-read a log only when something failed.

## Order and risk
1. Item 1 (done, PR #6) and items 2–4 together: skill and agent text only, no code. Release as **0.6.0**.
2. Items 5–7 next: item 5 changes what verify requires, so it needs its own review and a test that the full
   path still applies to product code.

| Risk | Mitigation |
|---|---|
| Delta mode misses a new problem | A first review is always full. A delta reviewer reports a new problem the diff introduced, and verify's code review is a fresh full review |
| A cheaper reviewer is less thorough | One-line override; compare on the next real item (below) |
| The light path skips a needed review | It only applies to diffs that are all tests or docs, with no sensitive concern; anything else keeps the full path |

## How we'll know it worked
On the next comparable item (a small feature with a spec, a plan and a verify):
- The agent tool's reported tokens per reviewer run, summed per item, drop by **at least 40%** against the
  ~770k baseline for four items (about 190k per item before).
- No finding a later reviewer or CI catches was missed by an earlier delta review (checked by hand).
- The gates are unchanged: the same approvals, the same recorded `check`, the same live run.

Open for the owner: whether items 5–7 should wait until 0.6.0 has been measured.
