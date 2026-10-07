---
name: release
description: Cut a release of an MNDX project. Bump the version (SemVer from the changelog), finalize CHANGELOG, run the quality bar, tag locally, and deploy only when the user explicitly asks, with the runbook command and a post-deploy smoke check. A release is a gated item, so the user approves release.md first.
argument-hint: "[version | major | minor | patch] [deploy]"
---

# /mndx:release

Request: **$ARGUMENTS** (empty means: propose the version from the changelog)

Read `${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md` first if you haven't loaded the MNDX workflow rules yet.
Load `${CLAUDE_PLUGIN_ROOT}/skills/concerns/devops.md` and the `shipping-and-launch` skill (MNDX rules override its
push/deploy steps).

## 1. Check state
`node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" status`. Nothing may be active: ship or abandon it first.
Read `CHANGELOG.md`. An empty `[Unreleased]` means there's nothing to release, so say so and stop.

## 2. Write release.md (gate closed: docs only)
`node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" new release "v<version>"`, then fill in `release.md`:
- **Version:** from `$ARGUMENTS` if given. Otherwise SemVer from `[Unreleased]`: a breaking change (Removed, or
  "BREAKING") → major; Added/Changed → minor; only Fixed/Security → patch. Pre-1.0 projects may treat breaking
  changes as minor. Say which. Set the `> Version:` line to exactly that.
- **What's in it**, **Readiness** (tick only what's true), **Steps**, **Rollback**.
- **Deploy:** only if the user asked for a deploy in this request ("deploy" in `$ARGUMENTS` or their message). Use the
  exact command from `docs/RUNBOOK.md`. If there's no runbook, write that a deploy can't be done safely yet and stop
  at the local release.

Hand off: "Review `release.md`, then type `/mndx:approve`."

## 3. After approval (gate open)
1. Bump the version in the project manifest(s) (`package.json` `version`, `pyproject.toml`, `app.config.*`, …).
2. CHANGELOG: rename `## [Unreleased]` to `## [<version>] - <today>`, and add a new empty `## [Unreleased]` above it.
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/mndx.js" check`, then `stage ship`. `stage ship` refuses unless the
   version matches in release.md, CHANGELOG and package.json, and the check is green and current.
4. `mndx.js done`, then commit (`chore(release): v<version>`), then `git tag -a v<version> -m "v<version>"`.
   **Never push** the commit or the tag unless the user asks.
5. **Deploy** only if step 2 recorded that the user asked: run the runbook command, then the smoke check (health
   endpoint / key page / CLI `--version`). Record the result in release.md. If the smoke check fails, follow the
   Rollback section and tell the user immediately.

Report: the version, the tag, what's in it, whether it was deployed, and the push command for them to run
(`git push && git push --tags`) if they want to publish it.

## Autopilot
Autopilot may prepare and tag a release, but **never deploys and never pushes**. A deploy is always a user action.
