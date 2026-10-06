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
- [ ] Mobile: EAS build profiles (development / preview / production), version and build numbers auto-incremented,
      OTA update channels separated (see app-store.md).
- [ ] Before launch, run through `shipping-and-launch`, skipping any step that pushes or deploys unless the user asked.
