---
name: stack-web
description: MNDX playbook for web apps (default stack Next.js App Router with TypeScript, Tailwind, Drizzle, Zod, Vitest, Playwright). Load when choosing a stack for, planning, or building a web app.
user-invocable: false
---

# Web playbook

Opinionated defaults. Deviate when the project's needs say so, and record the reason in an ADR.
Before you scaffold or upgrade, **check the current docs and versions** of each tool rather than relying on memory.

## Default stack
| Concern | Default | Alternatives (when) |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript strict | Vite + React SPA (no SEO/SSR needed); Astro (content sites) |
| Styling | Tailwind CSS + a small component kit (shadcn/ui) | CSS Modules (no Tailwind wanted) |
| Data fetching | Server Components + Server Actions; TanStack Query for client-side live data | tRPC (lots of client calls) |
| Validation | Zod, shared between forms and server | Valibot (bundle size) |
| Forms | React Hook Form + Zod resolver | native forms + Server Actions for simple ones |
| DB | Postgres + Drizzle ORM | SQLite/libSQL (single-user, small); Prisma (team preference) |
| Auth | Better Auth (MNDX has its best-practice skills) | Auth.js; Clerk (paid, fastest); Supabase Auth (if already on Supabase) |
| Payments | Stripe Checkout / Payment Element | local gateway (e.g. Tap / MyFatoorah for KNET) where the market needs it |
| Tests | Vitest + Testing Library; Playwright for e2e | — |
| Package manager | pnpm | — |
| Hosting | Vercel | Railway / Fly / Docker (long-running jobs, websockets) |

## Structure
```
src/
  app/                 # routes only: page.tsx, layout.tsx, route.ts, loading/error.tsx
  features/<name>/     # components, actions, queries, schemas for one feature
  components/ui/       # shared, dumb UI primitives
  lib/                 # db client, auth, env (validated with Zod at startup), utils
  server/              # server-only modules (import 'server-only')
tests/e2e/             # Playwright
```
- Code is grouped by feature, not by type. Routes stay thin and call into `features/`.
- Environment variables are parsed once in `lib/env.ts`. The app fails fast at boot if any are missing.
- Secrets stay server-only and never go into client components.

## Rules
- Server Components by default. Add `'use client'` only for interactivity, and as low in the tree as possible.
- Every mutation validates its input with Zod on the server and checks authorization.
- Each route segment has `loading.tsx` / `error.tsx`. Unknown routes use `not-found.tsx`.
- Accessibility: semantic HTML, labelled inputs, focus states, `alt` text, and the keyboard paths checked in e2e.
- Performance: `next/image`, `next/font`, no client-side fetching of data the server could render.

## Community skills
`frontend-design` (visual direction), `frontend-ui-engineering`, `vercel-react-best-practices`,
`web-design-guidelines` + `accessibility` (verify), `core-web-vitals` / `seo` / `web-quality-audit` (public
pages), `playwright-best-practices` + `playwright-cli` (e2e and browser checks), `better-auth-best-practices`.

## Quality bar commands (pnpm)
`pnpm format:check` · `pnpm lint` · `pnpm typecheck` (`tsc --noEmit`) · `pnpm test` (vitest run) ·
`pnpm test:e2e` (playwright) · `pnpm build`. Add these as package.json scripts during setup.
