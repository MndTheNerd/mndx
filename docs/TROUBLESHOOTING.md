# Troubleshooting

Start with `/mndx:status`. It shows the active item, each doc's state, and **why the gate is open or closed**.

## The gate blocks an edit I expected to work

The block message says why. Common cases:

| Message | Meaning | Fix |
|---|---|---|
| `No active MNDX work item` | nothing has been started | `/mndx:spec`, `/mndx:fix` or `/mndx:chore` |
| `… is still an unfilled template` | the doc still has `<!-- mndx:template -->` | let Claude finish the doc |
| `… has not been approved` | waiting for you | read it, then `/mndx:approve` |
| `… changed after it was approved` | the doc was edited after approval | review the change, then `/mndx:approve <doc>` |
| `.mndx/ is managed by MNDX` | something tried to edit the state | expected. State changes go through the CLI and your commands |
| `do not touch .mndx/ from the shell` | a shell command named `.mndx/` | expected. Use `mndx.js status --json` to read it |

## `stage ship` / `done` refuses

The message names the exact rule:
| Message | Fix |
|---|---|
| `No quality-bar run recorded` | run `mndx.js check` (via `/mndx:verify`) |
| `Quality bar failed: …` | fix it, then run `check` again. The output tail shows why |
| `Code changed since the last mndx.js check` | run `check` again. Any code edit after a check invalidates it |
| `…older than this item's approval` | run `check` again |
| `no Test command` | add a `Test` row to CLAUDE.md's Quality bar table |
| `verify.md … not PASS` / `no "## Live run" evidence` | finish `/mndx:verify`, including running the app |

## "MNDX watchdog: that shell command changed code while the gate is CLOSED"

A shell command (a redirect, a script, a generator) changed code files without approval. Claude should revert them
unless they're generated artifacts the approved docs expect. Each event is logged in `.mndx/violations.log`, and
`/mndx:status` shows the count.

## The gate doesn't block anything

1. Is the plugin installed and enabled? `claude plugin list` should show `mndx@mndx … enabled`.
2. Did you start a **new session** after installing or updating? Hooks load at session start.
3. Is this an MNDX project? There must be a `.mndx/state.json` in the folder (or a parent). Projects without one
   are deliberately not gated.
4. Is `node` on the PATH that Claude Code sees? Run `node --version` in a terminal. If Node was just installed,
   restart Claude Code.
5. Is the active item's plan already approved? Then edits are *supposed* to be allowed.

## `/mndx:approve` says nothing happened, or is blocked

- `Approve spec before plan`: approvals go in order.
- `Everything for … is already approved`: nothing is waiting. To re-approve a changed doc, name it:
  `/mndx:approve plan`.
- `this is not an MNDX project yet`: run `/mndx:init` first.
- Approvals only count when **you type** the command. Asking Claude to "approve it" won't work, by design.

## Autopilot stopped or seems stuck

- Check `docs/autopilot/` for the report. It says why it stopped.
- Waiting for permission? Autopilot can't answer permission prompts. See
  [AUTOPILOT.md](AUTOPILOT.md#running-it-truly-unattended).
- To end it: `/mndx:autopilot stop`.

## I changed MNDX but nothing changed

The installed plugin is a **copy** in `~/.claude/plugins/cache/mndx/`, not the folder itself. Raise `"version"` in
`.claude-plugin/plugin.json`, then:
```bash
claude plugin marketplace update mndx
```
```bash
claude plugin update mndx@mndx
```
and start a new session. To test changes before releasing them: `claude --plugin-dir D:\localAi\MNDX`.

## Community skills are missing

`/mndx:skills list` shows what's installed. Install with `/mndx:skills install all`, then start a new session.
If `npx` fails, check `node --version` and your network. The CLI downloads from GitHub.

## "State file is not valid JSON"

`.mndx/state.json` got corrupted (a merge conflict, or a manual edit). The gate fails closed until it's fixed.
Restore it from git (`git checkout HEAD -- .mndx/state.json`, run it yourself in a terminal, since Claude is
blocked from touching it) or fix the JSON by hand.

## Installing from GitHub fails on another PC

- `claude plugin marketplace add MndTheNerd/mndx` needs Git on the PATH (`git --version`). The repo is public,
  so no GitHub sign-in is needed.
- If it still fails, check that you can reach github.com (a proxy or firewall is the usual cause).

## Reset a project's MNDX state completely

Delete `.mndx/` yourself (it's your file), then run `/mndx:init`. Your `docs/` stay. Claude will see the existing
PRODUCT.md and won't overwrite it.
