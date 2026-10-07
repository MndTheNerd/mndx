# Getting started

This page takes you from nothing to a first shipped item. It takes about 15 minutes.

## 1. Prerequisites

| Tool | Why | Check |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) (CLI or the desktop app's Code tab), signed in with your Claude subscription | runs everything | `claude --version` |
| [Node.js](https://nodejs.org) 18 or newer, on your PATH | MNDX's hooks and CLI are Node scripts | `node --version` |
| [Git](https://git-scm.com) | MNDX commits each shipped item locally | `git --version` |

On Windows, the quickest way to get the last two:

```bash
winget install --id OpenJS.NodeJS.LTS -e
```
```bash
winget install --id Git.Git -e
```

Open a new terminal afterwards so they're on your PATH. The MNDX repo is public, so you don't need to sign in
to GitHub to install it.

## 2. Set your Git identity

Once per PC (MNDX's `/mndx:ship` commits with it):

```bash
git config --global user.name "mndthenerd"
```
```bash
git config --global user.email "mndthenerd@gmail.com"
```

## 3. Install the plugin

**From GitHub** (any PC):
```bash
claude plugin marketplace add MndTheNerd/mndx
```
```bash
claude plugin install mndx@mndx
```

**From a local folder** (the PC where you develop MNDX):
```bash
claude plugin marketplace add D:\localAi\MNDX
```
```bash
claude plugin install mndx@mndx
```

Check it:
```bash
claude plugin list
```
You should see `mndx@mndx … Status: enabled`.

## 4. Install the community skills

Start a Claude Code session (any folder) and type:

```
/mndx:skills install all
```

This installs 45 curated skills from [skills.sh](https://skills.sh/) into `~/.claude/skills`. See [SKILLS.md](SKILLS.md).
**Start a new session afterwards** so Claude Code loads them (and the plugin, if you just installed it).

## 5. Your first project

Make an empty folder, open Claude Code in it, and type:

```
/mndx:init a tiny habit tracker web app
```

Claude routes the idea to its production concerns, interviews you in a few rounds (each question comes with a
recommended answer, and you can reply "go with your recommendations"), proposes a stack, and writes:

```
docs/PRODUCT.md  docs/ARCHITECTURE.md  docs/adr/0001-stack.md  CLAUDE.md  CHANGELOG.md
docs/chores/001-project-setup/chore.md     ← the scaffolding plan, waiting for you
```

Read `chore.md`. If it looks right:

```
/mndx:approve
/mndx:build
/mndx:ship
```

You now have a scaffolded app with a green quality bar and a first commit.

## 6. Your first feature

```
/mndx:spec users can mark a habit done for today
```
Read `docs/features/002-…/spec.md` → `/mndx:approve`
```
/mndx:plan
```
Read `plan.md` → `/mndx:approve`
```
/mndx:build
/mndx:verify
/mndx:ship
```

That's the whole loop. [GUIDE.md](GUIDE.md) explains every step in depth.

## 7. Check that the gate works (optional, 1 minute)

In an MNDX project with no approved item, ask Claude: *"create src/test.ts with `export const x = 1`"*.
It should be blocked with a message like:

```
MNDX gate: cannot edit src/test.ts. No active MNDX work item. Start one with /mndx:spec …
```

If it isn't blocked, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#the-gate-doesnt-block-anything).

## 8. Keeping MNDX updated

On the PC where you change MNDX: raise `"version"` in `.claude-plugin/plugin.json`, commit, push.
On every PC (including that one: the installed plugin is a **copy**, not a live link to the folder):

```bash
claude plugin marketplace update mndx
```
```bash
claude plugin update mndx@mndx
```

Then start a new session. For the community skills: `/mndx:skills update`.
