# Autopilot

Leave a goal, come back to it built, tested, verified and committed, with a report of everything decided
without you.

```
/mndx:autopilot build v1 of the habit tracker from docs/PRODUCT.md
```

## What happens

1. **The grant.** Typing the command is your up-front approval **for that goal**. A hook records it. Claude
   can't create a grant itself.
2. **Init if needed.** In an empty folder, autopilot runs `/mndx:init` without the interview, records every
   inference under *Assumptions* in PRODUCT.md, and picks the stack playbook defaults.
3. **Breakdown.** The goal is split into items (setup chore, then features and fixes), each small enough to do in
   one pass, and added to PRODUCT.md's v1 scope.
4. **Every item goes through the full pipeline.** Route → spec → plan → build → verify → ship. Every doc is still
   written in full, and every concern checklist still applies.
5. **The reviewers approve, not Claude.** A doc is approved only when the `spec-reviewer` agent returns no blocker
   or major findings. The code has to pass the `code-reviewer` and the whole quality bar.
6. **Local commits only.** Each item ships as a local commit. Nothing is pushed or deployed.
7. **The report.** `docs/autopilot/<date>-<goal>.md` covers what was built, the real test and build results,
   **decisions made without you**, assumptions, shortcuts, and **what to check first**.

## When it stops (instead of guessing)

- the same failure survives **3** real fix attempts
- a decision only you can make, with no safe default: spending money, real credentials, live payments,
  destructive data changes, deleting your files
- a permission prompt or a missing tool blocks it
- the goal is much bigger than it looked (more than ~8 items). It ships a meaningful first slice and proposes the rest.

When it stops, the active item is left as it is (not abandoned), nothing broken is committed, and the report says
exactly why it stopped and what it needs from you.

## ⚖ legal and compliance items

Autopilot never decides legal questions. It builds the **safest conservative default** (opt-in consent, test-mode
payments, no tracking, account deletion included) and lists each item under *Please check* in the report.

## Running it truly unattended

Claude Code asks for permission before edits and many commands. If you walk away, autopilot waits at the first
prompt. Before starting:

- **Desktop app:** set the session's permission mode to **Accept edits** (or a more permissive mode you're
  comfortable with) in the mode picker next to the prompt box.
- **CLI:** start with `claude --permission-mode acceptEdits`, and allow your test and build commands in the
  project's `.claude/settings.json`, for example:

```json
{
  "permissions": {
    "allow": ["Bash(pnpm *)", "Bash(npm *)", "Bash(npx *)", "Bash(git add *)", "Bash(git commit *)", "Bash(node *)"]
  }
}
```

The MNDX gate still applies in every permission mode. Permission modes decide whether Claude *asks*; the gate
decides whether code may be written *at all*.

## Stopping it

- `/mndx:autopilot stop` ends the grant immediately.
- Typing **any other `/mndx:` command** (except `/mndx:status`) also ends it. You're back in control, and
  approvals are yours again.
- `/mndx:status` shows whether autopilot is on, and for which goal.

## Good goals

| Good | Why |
|---|---|
| "Scaffold the project and ship the setup chore" | well defined, low risk |
| "Build the 3 v1 features in PRODUCT.md" | scope is already written down |
| "Implement 004 from its approved spec" | the spec already has your approval |
| ~~"Make it better"~~ | no definition of done |
| ~~"Go live with payments"~~ | needs live keys and money decisions, so it will stop |
