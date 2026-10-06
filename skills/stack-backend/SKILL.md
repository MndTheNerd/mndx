---
name: stack-backend
description: MNDX playbook for backends, APIs, workers and CLIs in Python (FastAPI/uv), Node (TypeScript/Fastify) or Go. Load when choosing a stack for, planning, or building a backend service or command-line tool.
user-invocable: false
---

# Backend / API / CLI playbook

Pick the language by fit: **Python** for data/AI-heavy work and fast iteration; **Node/TS** when it shares types with
a TS frontend; **Go** for small, fast, single-binary services and CLIs. Record the choice in an ADR. **Check current
docs and versions** before scaffolding.

## Python
| Concern | Default |
|---|---|
| Env & packaging | `uv` (pyproject.toml, lockfile) |
| API | FastAPI + Pydantic v2 (settings via pydantic-settings) |
| DB | SQLAlchemy 2.x (typed) + Alembic migrations; Postgres (SQLite for local/simple) |
| CLI | Typer |
| Quality | `ruff format`, `ruff check`, `pyright`, `pytest` (+ `pytest-asyncio`, `httpx` test client) |

Layout: `src/<pkg>/{api,domain,services,db,cli}/`, `tests/{unit,integration}/`.

## Node / TypeScript
| Concern | Default |
|---|---|
| Runtime | Node LTS, ESM, TypeScript strict |
| API | Fastify (+ `@fastify/type-provider-zod`) or Hono (edge/serverless) |
| Validation | Zod |
| DB | Drizzle ORM + Postgres |
| CLI | Commander (or citty) |
| Quality | Prettier/ESLint (or Biome), `tsc --noEmit`, Vitest, Supertest/`app.inject` |

Layout: `src/{routes,services,db,lib}/`, `tests/`.

## Go
| Concern | Default |
|---|---|
| API | stdlib `net/http` (1.22+ routing) or chi |
| DB | pgx + sqlc (type-safe generated queries); goose migrations |
| CLI | Cobra (complex) or stdlib `flag` (simple) |
| Config | env vars parsed into a struct at startup |
| Quality | `gofmt`, `go vet`, `staticcheck`, `go test -race ./...` |

Layout: `cmd/<app>/main.go`, `internal/{http,service,store}/`.

## Community skills
`api-and-interface-design` (any language), `fastify-best-practices` + `node` (Node), and
`supabase-postgres-best-practices` (any Postgres). `observability-and-instrumentation` for logs, metrics and
traces, `ci-cd-and-automation` for pipelines, `security-and-hardening` always.

## Rules for any backend
- **Layering:** transport (HTTP/CLI) → service (business logic, no framework imports) → store (DB). Logic is
  tested without HTTP.
- **Contract first:** request/response schemas defined once and validated. OpenAPI is generated (FastAPI/Fastify)
  and kept in sync.
- **Errors:** one error shape for API responses (`{ error: { code, message } }`), the correct HTTP status codes,
  and internal details logged, not returned.
- **Config:** 12-factor env vars, validated at boot, `.env.example` committed, secrets never logged.
- **Data:** migrations for every schema change, reversible where possible. Transactions around multi-step writes.
  Pagination on list endpoints.
- **Observability:** structured logs (JSON in prod) with a request id, plus a health endpoint (`/healthz`).
- **CLIs:** `--help` on every command, a non-zero exit on failure, errors to stderr and data to stdout, a `--json`
  output for scripting where it's useful.
- **Tests:** integration tests against a real DB (a Docker/testcontainers or SQLite equivalent), not mocks of the ORM.
- **Docker:** a multi-stage Dockerfile with a non-root user, if it's deployed as a container.
