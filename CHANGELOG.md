# Changelog

All notable changes to MNDX. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions:
[SemVer](https://semver.org/).

## [Unreleased]

## [0.5.1] - 2026-10-07

### Changed
- **`/mndx:build` now ends each task with a bounded refactor** (red → green → refactor). After the tests pass,
  Claude makes one pass over just the code it wrote for that task (duplication, names, convoluted logic), then
  re-runs the same tests and typecheck. No new behavior, no new tests, nothing outside the task's files, and a
  refactor that turns a test red is undone. The `tdd` skill leaves refactoring to review, so cleanup used to
  wait for a reviewer to flag it.

### Fixed
- **Docs no longer say the repo is private.** It's public, so installing needs no GitHub sign-in. The README
  note, the GitHub CLI prerequisite and sign-in step in Getting Started, and the `gh auth` advice in
  Troubleshooting are removed.

### Added
- [Token savings](docs/TOKEN-SAVINGS.md): a proposal for cutting an MNDX run's token use without weakening a
  gate, based on where one real run's tokens went.

## [0.5.0] - 2026-10-07

### Changed
- **Reviewer agents run on Sonnet by default** (`model: sonnet` in `spec-reviewer`, `code-reviewer` and
  `project-auditor`). They used to inherit the session's model, so every review ran on the most expensive one.
  Reviews are the largest token cost of a run: a full feature used about 15 reviewer passes of 25k–95k tokens
  each. They only read and report, so a cheaper model does the job. Set `model: opus` (or `inherit`) in an
  agent file to restore the old behavior, for example for a security-critical codebase. See
  [CUSTOMIZING.md](docs/CUSTOMIZING.md).

## [0.4.2] - 2026-10-07

### Fixed
- **`/mndx:autopilot <goal>` still lost its goal in the Claude desktop app after 0.4.1.** 0.4.1 handled an
  empty `args` array, but the app's `UserPromptExpansion` input has no `args` or `original_prompt` at all. It
  carries `command_args` (a string) and `prompt` (the typed text), so the goal was still read as empty: the
  command was blocked with "tell autopilot what to build", or, with an active item, silently became
  "finish <item>". The hook now reads either shape. The same fix applies to `/mndx:approve <doc>`. The
  regression test uses the input captured from the desktop app.

## [0.4.1] - 2026-10-07

### Fixed
- **`/mndx:autopilot <goal>` lost its goal when the host sent an empty `args` array.** The hook now falls back
  to the typed prompt when `args` is empty. (Incomplete for the desktop app: see 0.4.2.)

## [0.4.0] - 2026-10-07

### Added
- **`/mndx:release`:** releases are a new gated item kind (`release.md`: version, notes, readiness, rollback). After
  approval, Claude bumps the version, finalizes CHANGELOG, runs the check and tags locally. `stage ship` refuses unless
  the version agrees in release.md, CHANGELOG (with a fresh `[Unreleased]`) and package.json. Deploys happen only when
  the user asks, using the runbook command plus a smoke check. Nothing is ever pushed automatically.
- **Reviewed skill updates:** `mndx.js skills update` snapshots the recommended skills, updates, then reports
  changed skills and flags risky lines the update introduced (push/deploy, `curl | sh`, instruction overrides,
  exfiltration, destructive commands, permission changes, new scripts). `mndx.js skills rollback [snapshot] [skills]`
  restores them.
- **Plan-scope warnings:** a PostToolUse hook warns Claude (never blocks) when an approved feature's edit lands
  outside plan.md's `## Files` table, and logs it to `.mndx/scope.log`. `mndx.js scope` and `/mndx:status` list such
  files; verify must explain each under "Deviations from the plan", and the code reviewer treats unexplained ones as major.

## [0.3.0] - 2026-10-07

### Added
- **Enforced verification:** `mndx.js check` runs CLAUDE.md's quality-bar commands for real and records exit codes
  plus a code fingerprint in `.mndx/checks.json`. `stage ship` and `done` refuse unless the record is green,
  includes a Test command, is newer than the approval, still matches the code, and (features/fixes) `verify.md` ends
  in PASS with live-run evidence.
- **Shell watchdog** (Pre/PostToolUse on Bash/PowerShell): snapshots dirty git files around each shell command while
  the gate is closed, flags code changed through the shell, and logs it to `.mndx/violations.log`. Shown in
  `mndx.js status`.
- **Live run in verify:** every AC's flow is exercised in the running app (browser / real requests / real CLI calls),
  recorded in verify.md's new "Live run" section.
- New concern **Dates, times & scheduling** (`time.md` checklist), plus persistence trigger words for the data concern.
- `mndx.js skills list` reports command-line tools that skills need but that aren't installed (semgrep,
  playwright-cli). Verify records those checks as open, never as passed.

### Fixed (found by dogfooding: MNDX built a real app end to end under autopilot)
- Hooks crashed on a UTF-8 BOM in their stdin (Windows PowerShell pipes add one). All hooks now share a tolerant reader.
- The router missed date logic ("today", "streak") and local persistence ("saved").
- Item slugs were cut mid-word. They now stop at a word boundary.
- Gate messages showed Windows backslashes. Paths are always shown with `/`.
- `/mndx:ship` committed before closing the item, so the commit held a stale state. It now runs `done` first.
- The setup chore now adds `.gitattributes` (LF everywhere) and scaffolds generators into `.scratch/` first.

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
