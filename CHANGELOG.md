# Changelog

All notable changes to MNDX. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions:
[SemVer](https://semver.org/).

## [0.2.0] - 2026-10-07

### Added
- **Existing-project adoption.** `/mndx:init` on existing code (and the new `/mndx:assess`) learns the whole
  project, runs its real tests and build, documents what exists, audits it, and asks you to **rebuild it the right
  way**, **fix what needs fixing**, or **keep it as-is and continue**. See [docs/EXISTING-PROJECTS.md](docs/EXISTING-PROJECTS.md).
- `project-auditor` agent: a 15-area 0–3 scorecard, severity-ranked findings with file:line, what to keep, and
  rebuild vs fix effort.
- `docs/BACKLOG.md` as the ordered work queue, suggested by `/mndx:status`, `/mndx:ship` and the session hook.
  Templates: ASSESSMENT.md, BACKLOG.md.
- SessionStart hook: MNDX projects open with the active item, gate and next backlog item; un-adopted codebases
  get a one-time `/mndx:init` hint (`.mndxignore` turns it off).

## [0.1.1] - 2026-10-07

### Added
- Full documentation set in `docs/`: getting started, user guide, autopilot, production concerns, community
  skills, customizing, how it works, troubleshooting.
- MIT `LICENSE`, this changelog, and a GitHub Actions workflow running the tests on Ubuntu and Windows (Node 20/24),
  with actions pinned to commit SHAs.

### Fixed
- **Gate:** shell commands that `cd` into an MNDX project from a session started elsewhere could touch `.mndx/`.
  Any shell command naming `.mndx/` is now blocked wherever it runs. Found by a live test.
- **Gate:** `git add .mndx/state.json` (used by `/mndx:ship`) was blocked by the shell rule. Read-only and
  commit-related git commands are now allowed.
- Docs said a locally installed plugin loads "in place". It's actually a cached copy, so updates need a version
  bump plus `claude plugin update`.

## [0.1.0] - 2026-10-07

### Added
- Pipeline: `/mndx:init`, `spec`, `plan`, `build`, `verify`, `ship`, `fix`, `chore`, `status`, `abandon`.
- Hard gate (PreToolUse hook): non-doc edits need the active item's docs approved, with content-hash drift detection.
- User-only approvals (`/mndx:approve` via a UserPromptExpansion hook); `.mndx/` protected from tools and the shell.
- `/mndx:autopilot`: user-granted unattended runs, reviewer agents as approvers, local commits only, stop rules, report.
- Concern router (`/mndx:route`, `config/concerns.json`): 20 production concerns with implied links, plus MNDX
  checklists for security, testing, UX, accessibility, data, auth, privacy/compliance/legal, payments, i18n,
  messaging, AI, devops, infra and app-store.
- 45 curated community skills from skills.sh (`/mndx:skills`), installed globally via `npx skills`.
- `spec-reviewer` and `code-reviewer` agents; stack playbooks for web, mobile and backend; quality bar.
- `.scratch/` sandbox for bug repros before approval.
