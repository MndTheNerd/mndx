<!-- mndx:template -->
# {{ID}} — Release

> **Status:** DRAFT
> Version: x.y.z
> Kind: release · Created: {{DATE}}

## What's in it
<!-- The CHANGELOG [Unreleased] entries this release turns into [x.y.z], in plain words for users. -->

## Version reasoning
<!-- SemVer: breaking change → major; new behavior → minor; only fixes → patch. Name the entry that decided it. -->

## Readiness
<!-- From concerns/devops.md and the shipping-and-launch skill. Tick only what's true, with evidence. -->
- [ ] Every item since the last release is shipped (no active item, BACKLOG lines done)
- [ ] `mndx.js check` green on this exact code
- [ ] Migrations (if any) are backwards-compatible and ordered
- [ ] Config/secrets for the target environment exist (names only, never values)
- [ ] Error tracking / health check in place (or n/a with reason)

## Steps
- [ ] Version bumped in the project's manifest (package.json / pyproject.toml / app.config …)
- [ ] CHANGELOG: `[Unreleased]` → `[x.y.z] - YYYY-MM-DD`, with a fresh empty `[Unreleased]` above it
- [ ] Local git tag `vx.y.z` (created after `done`; **never pushed** unless the user asks)

## Deploy
<!-- Only if the user explicitly asked. Then: the exact command from docs/RUNBOOK.md, and the post-deploy smoke check.
     Otherwise write: "Not deployed. The user runs it when ready." -->

## Rollback
<!-- How to undo this release: previous tag/build, feature flag, down-migration. -->
