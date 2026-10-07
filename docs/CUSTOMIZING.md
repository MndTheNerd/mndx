# Customizing MNDX

MNDX is opinionated so you don't start from zero, but the opinions are plain Markdown and JSON files you own.

## What to change, where

| You want to… | Edit |
|---|---|
| Change the default stack for web / mobile / backend | `skills/stack-web/SKILL.md`, `stack-mobile`, `stack-backend` |
| Raise or relax the definition of "good code" | `skills/quality-bar/SKILL.md` |
| Change a production checklist (security, payments, privacy…) | `skills/concerns/<concern>.md` |
| Make the router catch more (or fewer) tasks | `config/concerns.json` (see [CONCERNS.md](CONCERNS.md)) |
| Add or remove community skills | `config/skills.json` (see [SKILLS.md](SKILLS.md)) |
| Change what a spec / plan / verify doc contains | `templates/item/*.md` |
| Change the project docs `/mndx:init` writes | `templates/project/*.md` |
| Change how a step behaves | `skills/<step>/SKILL.md` |
| Make a reviewer stricter or softer | `agents/spec-reviewer.md`, `agents/code-reviewer.md` |
| Change the model the reviewers run on (cost vs depth) | the `model:` line in `agents/spec-reviewer.md`, `code-reviewer.md`, `project-auditor.md`: `sonnet` (default), `opus`, `haiku` or `inherit` |
| Change the pipeline's hard rules | `skills/workflow/SKILL.md` |
| Change what the gate enforces | `scripts/gate.js` + `scripts/lib.js`, **and add a test** |

**Per-project rules** don't belong in MNDX. Put them in that project's `CLAUDE.md` under *Conventions*. Claude
reads it every session, and `/mndx:ship` adds conventions to it as they're decided.

## Rules for templates

- Keep the `<!-- mndx:template -->` marker on the first line of item templates. A doc that still has it can't be
  approved, which is what stops an unfilled template from getting through.
- Keep the `> **Status:** DRAFT` line in docs that need approval (spec, plan, bug, chore). Approval rewrites it.
- `{{ID}}`, `{{TITLE}}`, `{{DATE}}`, `{{KIND}}` are filled in when an item is created.

## Releasing your change

1. `npm test` (and `claude plugin validate .` if you have the CLI).
2. Raise `"version"` in `.claude-plugin/plugin.json` and `package.json` (e.g. 0.1.1 → 0.1.2), and add a
   [CHANGELOG](../CHANGELOG.md) entry.
3. Commit and push.
4. On each PC, **including this one** (installed plugins are copies):
   ```bash
   claude plugin marketplace update mndx
   ```
   ```bash
   claude plugin update mndx@mndx
   ```
5. Start a new Claude Code session.

To try a change before releasing it, start a session with the folder loaded directly:
```bash
claude --plugin-dir D:\localAi\MNDX
```
