---
name: skills
description: Install, update or list the community skills MNDX uses (from skills.sh via npx skills), for design, frontend, mobile, backend, security, payments, devops and quality.
argument-hint: "[list | install [core|security|payments|ops|web|mobile|backend|all] | update | rollback [snapshot] [skills]]"
---

# /mndx:skills

Request: **$ARGUMENTS** (default: `list`)

MNDX's recommended community skills are listed in `${CLAUDE_PLUGIN_ROOT}/config/skills.json`, grouped by concern
area and reviewed before inclusion. They install **globally** for Claude Code (`~/.claude/skills`) with the
open-source `npx skills` CLI (telemetry disabled), so `npx skills update` keeps them current.

- `list`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" skills list`. Show it as-is.
- `install [groups]`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" skills install <groups>` (default: all).
  This downloads skills from GitHub and adds them to the user's global Claude Code skills. If the user didn't
  type this command themselves, ask before running it.
- `update`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" skills update`. This snapshots every recommended skill,
  runs `npx skills update -g -y`, then reports which skills changed and **flags risky new lines**: push/deploy,
  `curl | sh`, instruction overrides, exfiltration, destructive commands, permission changes, new scripts. Show the
  report as-is. For each ⚠ skill, read the flagged lines and tell the user plainly whether they look benign (for
  example a security skill quoting an attack) or not.
- `rollback [snapshot] [skills…]`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" skills rollback …` restores from a
  snapshot (default: the latest). Offer it for any update the user doesn't want, and run it if they agree.

Then report what's installed and what's missing, and remind the user that **new skills load in the next session**
(or after `/reload-plugins` / a restart).

To suggest a skill that isn't on the list, use `find-skills`, check the install count and publisher on
skills.sh, read its SKILL.md, and propose adding it to `config/skills.json` with the concern it serves.
