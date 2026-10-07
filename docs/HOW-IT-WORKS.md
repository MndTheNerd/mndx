# How it works

The internals: hooks, state, the approval hash, the CLI. For the design rationale see [DESIGN.md](DESIGN.md).

## Pieces

```
┌─────────────────────────── Claude Code session ───────────────────────────┐
│                                                                           │
│  you type /mndx:approve ──► UserPromptExpansion hook ──► scripts/approve.js│
│                                                           records approval │
│                                                                ▼           │
│  Claude: Edit / Write ──► PreToolUse hook ──► scripts/gate.js ◄─ .mndx/state.json
│  Claude: Bash / PowerShell ─┘                   allow / deny + reason      │
│  Claude: Skill(mndx:approve) ┘                                             │
│                                                                           │
│  Claude runs: node scripts/mndx.js new|status|stage|done|route|skills …    │
│  Skills (skills/*/SKILL.md) tell Claude what to do at each step            │
│  Agents (agents/*.md) review docs, code and whole projects, fresh context   │
│  Session start ──► SessionStart hook ──► scripts/session.js ──► context    │
└───────────────────────────────────────────────────────────────────────────┘
```

| File | Role |
|---|---|
| `hooks/hooks.json` | Registers the three hooks with Claude Code |
| `scripts/session.js` | **SessionStart:** tells Claude the active item, gate and next backlog item; hints `/mndx:init` in un-adopted codebases (silenced by `.mndxignore`) |
| `scripts/gate.js` | **PreToolUse:** decides whether an edit or shell command may run |
| `scripts/approve.js` | **UserPromptExpansion:** the only writer of approvals and autopilot grants |
| `scripts/lib.js` | State, hashing, approval and item logic shared by everything |
| `scripts/mndx.js` | The CLI Claude uses (new item, stage, check, done, route, skills…) |
| `scripts/check.js` | `mndx.js check` + the ship rules: real quality-bar runs, code fingerprint, verify.md PASS + live run |
| `scripts/watch.js` | **Pre/PostToolUse (Bash, PowerShell):** the shell watchdog, which flags code changed through the shell while the gate is closed |
| `scripts/route.js` | The concern router's deterministic pass |
| `scripts/skills.js` | Community skills install/update via `npx skills` |

No dependencies: plain Node 18+.

## State: `.mndx/state.json`

```json
{
  "version": 1,
  "counter": 3,
  "active": {
    "id": "003-team-invites", "kind": "feature", "title": "Team invites",
    "dir": "docs/features/003-team-invites", "stage": "build",
    "approvals": {
      "spec": { "sha": "9f2c…", "by": "you", "at": "2026-10-07T12:00:00.000Z" },
      "plan": { "sha": "41ab…", "by": "you", "at": "2026-10-07T12:30:00.000Z" }
    },
    "autopilot": false
  },
  "autopilot": null,
  "history": [ { "id": "002-…", "outcome": "shipped", "at": "…" } ]
}
```

Kinds and the docs each needs approved: **feature** → spec, plan · **fix** → bug · **chore** → chore.
Stages: the doc being written (`spec`/`plan`/`bug`/`chore`), then `build` → `verify` → `ship`.

## The gate's rules (`gate.js`)

For **Edit / Write / MultiEdit / NotebookEdit**:
1. Is the file inside an MNDX project (a `.mndx/state.json` in it or a parent folder)? If not, allow. Other
   projects aren't affected.
2. Is it under `.mndx/`? **Deny, always.**
3. Is it a `.md` file? Allow, since docs are always writable.
4. Is it under `.scratch/`? Allow (the sandbox, never shipped).
5. Otherwise, allow only if there's an active item **and** each required doc exists, isn't an unfilled template,
   is approved, **and still hashes to the approved value**.

For **Bash / PowerShell**: any command naming `.mndx/` is denied, wherever it runs, except the MNDX CLI and
`git add/commit/status/diff/log/show`.

For **Skill**: Claude calling `mndx:approve` or `mndx:autopilot` is denied. Those two are also marked
`disable-model-invocation`, so Claude doesn't even see them as invocable.

A broken state file **fails closed**: edits are denied with an explanation, and the gate never silently opens.

## The approval hash

An approval stores a SHA-256 of the doc's content, normalized so harmless changes don't invalidate it:
- line endings unified (CRLF/LF)
- trailing whitespace ignored
- the `> **Status:**` line ignored (approval rewrites it to `APPROVED by you · date`)
- checkbox state ignored (`- [x]` = `- [ ]`), so build can tick tasks off

Any other change, such as a new AC, a changed task or a rephrased requirement, changes the hash, and the gate
closes until you re-approve.

## Why only you can approve

- **UserPromptExpansion fires only for slash commands a human types**, never for Claude's Skill-tool calls.
  `approve.js` is the only code that writes an approval with `by: "you"`.
- Claude can't edit `.mndx/` (the gate) and can't invoke the approve command (gate + `disable-model-invocation`).
- The CLI's `approve` refuses unless an **autopilot grant** exists, and a grant can only be created by
  `approve.js` when you type `/mndx:autopilot`.
- Typing any other `/mndx:` command ends an active grant.

## The shell watchdog (`watch.js`)

The edit gate can't see files written by shell commands. So while the gate is **closed**, every Bash/PowerShell
command is wrapped: before it runs, the dirty files in git are hashed; afterwards they're hashed again. Any code
file (not `.md`, `.scratch/`, `.mndx/` or a lockfile) that changed is reported back to Claude with an instruction
to revert it, and logged to `.mndx/violations.log`. `mndx.js status` shows the count. With the gate open, or outside
git, it does nothing.

**Remaining limit:** the watchdog detects and reports, it doesn't undo. A change made and then reverted within the
same command, or code written outside the repo, isn't seen.

## Ship rules (`check.js`)

`mndx.js check` runs every command in CLAUDE.md's **Quality bar** table (except install/run rows and placeholders)
and writes `.mndx/checks.json`: each command's exit code, duration and output tail, plus a **fingerprint** (a hash of
all code files: git-tracked + untracked, excluding docs, `.mndx/`, `.scratch/`, build output and lockfiles).

`stage ship` and `done` refuse unless:
1. a check record exists, every command passed, and one of them is a Test command
2. the record is newer than the item's last approval
3. the fingerprint still matches the code (any change after `check` means running it again)
4. for features and fixes: `verify.md` is filled in, its `## Verdict` says PASS (not FAIL), and its `## Live run`
   section has real content

## The CLI

```
node scripts/mndx.js help
```

| Command | Notes |
|---|---|
| `init` | create `.mndx/state.json` |
| `status [--json]` | everything, including the gate decision and doc states |
| `new <feature\|fix\|chore> <title>` | allocate `NNN-slug`, copy templates, make it active |
| `stage <build\|verify\|ship>` | only once docs are approved; `ship` also needs the ship rules |
| `check` | run the quality bar for real and record it |
| `done [note]` | close as shipped (stage must be `ship`) |
| `abandon [reason]` | close without shipping |
| `approve [doc]` | **autopilot only** |
| `autopilot-end <completed\|stopped> [note]` | end the grant |
| `route "<task>" [--ui] [--json]` | first-pass concern routing |
| `skills [list\|install [groups]\|update]` | community skills |

## Tests

```bash
npm test
```

They drive the hooks exactly as Claude Code does (JSON on stdin, a decision on stdout) in temporary projects:
blocked and allowed paths, the full approval flow, hash drift and checkbox ticking, self-approval attempts,
autopilot grants and their end, the shell rules, failing closed on corrupt state, and the router and skill
manifest integrity. CI runs them on Ubuntu and Windows with Node 20 and 24 on every push.
