# CI/CD & release checklist

Load `ci-cd-and-automation`, plus `gha-security-review` when touching `.github/workflows`. MNDX never pushes,
deploys or publishes unless the user asks. This checklist prepares a release; the user runs it.

- [ ] CI runs the exact CLAUDE.md quality bar (format, lint, typecheck, test, build) on every PR/push, with
      dependency caching. A red CI blocks merging.
- [ ] Workflows: least-privilege `permissions:`, third-party actions pinned to a full commit SHA, no
      `pull_request_target` with checkout of PR code, no untrusted `${{ github.event.* }}` interpolated in `run:`.
- [ ] Environments: dev / preview (per PR, if the host supports it) / production, each with its own config and
      secrets in the host's or CI's secret store, never in the repo.
- [ ] Database migrations run as an explicit, ordered release step (not on app boot in multi-instance setups),
      backwards-compatible with the previous app version (expand → migrate → contract).
- [ ] Versioning: semver or date tags, with CHANGELOG.md (kept by /mndx:ship) as the release notes.
- [ ] Rollback plan written down per release: previous build redeploy, feature flag off, or a down-migration.
      Tested at least once.
- [ ] Health check endpoint + smoke test after deploy. Error tracking connected before launch (observability).
- [ ] Docker (if used): multi-stage build, a pinned base image, non-root user, `.dockerignore`, no secrets in layers.
- [ ] **Deploy strategy** fits the risk: rolling (the default on managed platforms), **blue-green** (two
      environments, switch traffic, instant rollback), or **canary** (a small percentage first, watch the metrics,
      then widen) for risky changes. Each has a health or readiness gate and a one-command rollback.
- [ ] **Feature flags** for risky or unfinished work: off by default, each with an owner and a removal date,
      evaluated server-side when they gate security, and both states tested. Remove a flag once it's fully rolled out.
- [ ] **Dependencies:** lockfile committed, versions pinned, and an automated update PR (Dependabot or Renovate)
      gated by CI. Conflicts are resolved, not silenced with forced overrides, and unused packages are removed
      (this is how you stay out of dependency hell).
- [ ] **Build caching:** CI caches dependencies and build outputs keyed by the lockfile hash, with a remote cache for
      monorepos (Turborepo, Nx) and Docker layers ordered so dependencies cache. A cache never holds secrets.
- [ ] **Production incidents:** `docs/RUNBOOK.md` says who is on call (solo: you, plus the alert channel), the severity
      levels, and the first steps (stop the bleeding by rolling back or turning a flag off, then communicate, then fix).
      After any incident, write a **blameless postmortem** in `docs/postmortems/` (timeline, impact, root cause,
      what worked, actions with owners and dates) and add the actions to BACKLOG.md.
- [ ] Mobile: EAS build profiles (development / preview / production), version and build numbers auto-incremented,
      OTA update channels separated (see app-store.md).
- [ ] Before launch, run through `shipping-and-launch`, skipping any step that pushes or deploys unless the user asked.
