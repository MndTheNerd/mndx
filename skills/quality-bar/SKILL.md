---
name: quality-bar
description: The MNDX product-level quality checklist and per-language tooling. Load before building, verifying or reviewing code in an MNDX project.
user-invocable: false
---

# Quality bar

The project's exact commands live in its `CLAUDE.md`. This file defines what "good" means.

## Correctness
- Every acceptance criterion is proven by an automated test that would fail if the behavior broke.
- Bug fixes come with a regression test that failed before the fix.
- Inputs are validated at trust boundaries (HTTP handlers, forms, CLI args, env, files, third-party responses),
  with a schema (Zod / Pydantic / struct tags), not ad-hoc checks.
- Errors are handled on purpose: never swallowed, never shown raw to users, never `catch {}` that hides a failure.
  The user-facing message and the logged detail are separate.
- No race conditions in async code: awaited promises, cancellation and cleanup in effects, idempotent handlers.

## Types & static checks
- TypeScript `strict: true`. No `any`, no unexplained `as` casts, no non-null `!` without a reason.
- Python: type hints everywhere, with pyright or mypy in strict mode for new code.
- Go: `go vet` clean, `staticcheck` if available. Errors are wrapped with context (`fmt.Errorf("…: %w", err)`).
- Lint and format are clean, with zero warnings left behind.

## Design & readability
- Simple over clever. No abstraction until a second real use exists. Small functions with one job.
- Names say what things are. Booleans read as questions (`isLoading`, `hasAccess`).
- Match the existing code's patterns. Reuse existing helpers instead of writing near-duplicates.
- No dead code, commented-out code, stray `console.log`/`print`, or TODOs without an item reference.
- Comments explain *why*, not *what*.

## Security
- No secrets in code or in git. Config comes from env, with a committed `.env.example`.
- Parameterized queries only. Escape/encode output. Validate redirects and uploaded file types and sizes.
- Authorization is checked on the server for every protected action, not just hidden in the UI.
- Dependencies are well-maintained and pinned with a lockfile. No unnecessary new dependencies.

## Performance (proportionate)
- No N+1 queries, no unbounded lists (paginate), no work repeated per render or per request that could be done once.
- Indexes for the columns queries filter or sort on.
- Web/mobile: images sized and lazy-loaded, lists virtualized when long, bundles not bloated by one-off libraries.

## UX (for user-facing work)
- Every async view has loading, empty, error and success states.
- Accessible: semantic elements, labels, keyboard and screen-reader reachable, sufficient contrast.
- Responsive down to phone width (web). Safe areas and touch targets of at least 44pt (mobile).

## Tests
- Fast unit tests for logic, integration tests at the boundaries (DB, HTTP), and a few e2e tests for critical flows.
- Tests are deterministic: no real network, no sleeps, no order dependence. Time and randomness are injected.
- Test names describe behavior: `rejects expired tokens`, not `test2`.

## Docs
- Living docs (ARCHITECTURE, PRODUCT scope, CHANGELOG, CLAUDE.md conventions) are updated in the same change.
- Public functions and modules get a doc comment if their contract isn't obvious from the signature.

## Default tooling by language
| | Format | Lint | Types | Test |
|---|---|---|---|---|
| TypeScript | Prettier (or Biome) | ESLint (or Biome) | `tsc --noEmit` | Vitest / Jest; Playwright (web e2e); Maestro (mobile e2e) |
| Python | `ruff format` | `ruff check` | `pyright` | `pytest` |
| Go | `gofmt` | `go vet`, `staticcheck` | (compiler) | `go test ./...` |

Always use the package manager the project already uses (pnpm / npm / yarn / bun; uv / poetry).
