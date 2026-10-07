# Community skills

MNDX brings in 45 skills from the open skills ecosystem ([skills.sh](https://skills.sh/)) so that each concern
gets real expertise: Stripe's own payment guidance, Expo's own mobile guidance, Trail of Bits' static analysis,
and so on. They're listed with reasons in [`config/skills.json`](../config/skills.json).

## Managing them

| Do | Command |
|---|---|
| See what's installed | `/mndx:skills list` |
| Install everything | `/mndx:skills install all` |
| Install some groups | `/mndx:skills install core security web` |
| Update all (same as `npx skills update -g`) | `/mndx:skills update` |

They install **globally** into `~/.claude/skills` with the open-source `npx skills` CLI. Its anonymous telemetry
is switched off (`DISABLE_TELEMETRY=1`). New skills load from the **next** Claude Code session.

## How they were chosen

1. **Fit:** the skill must serve a specific MNDX stage or production concern.
2. **Ranking:** install count on the skills.sh leaderboard.
3. **Trust:** official vendors (Vercel, Anthropic, Stripe, Expo, Supabase, Microsoft, Sentry, Trail of Bits,
   Better Auth, GitHub) or well-known authors (Matt Pocock, Addy Osmani, Matteo Collina).
4. **Read before inclusion:** each SKILL.md and its scripts were reviewed for anything that pushes, deploys,
   runs remote scripts or overrides instructions.
5. **No conflict with the pipeline:** skills that implement past the approval gate or need their own issue tracker
   were left out (for example `implement`, and mattpocock's `code-review`; MNDX has its own reviewer agents).

**MNDX always wins.** If a skill suggests pushing, deploying, committing, opening a PR, skipping a doc, or asking
you to confirm something the approved plan already settles, Claude follows MNDX instead.

## The list

| Group | Skill | Source | Used for |
|---|---|---|---|
| core | find-skills | vercel-labs/skills | finding a skill for an uncovered concern (recommend only) |
| core | grilling | mattpocock/skills | the requirements interview in init and spec |
| core | domain-modeling | mattpocock/skills | GLOSSARY.md + ADRs |
| core | codebase-design | mattpocock/skills | module / interface / seam design in plan |
| core | tdd | mattpocock/skills | test-first build |
| core | diagnosing-bugs | mattpocock/skills | /mndx:fix root-cause loop |
| core | improve-codebase-architecture | mattpocock/skills | manual audit of existing code |
| core | api-and-interface-design | addyosmani/agent-skills | API and interface contracts |
| core | performance-optimization | addyosmani/agent-skills | measure-first performance |
| core | property-based-testing | trailofbits/skills | money, parsers, invariants |
| security | security-and-hardening | addyosmani/agent-skills | OWASP hardening |
| security | sharp-edges | trailofbits/skills | footgun APIs and dangerous defaults |
| security | semgrep | trailofbits/skills | static analysis at verify |
| security | secret-serialization | getsentry/skills | secrets leaking into logs or telemetry |
| security | gha-security-review | getsentry/skills | GitHub Actions security |
| security | better-auth-best-practices | better-auth/skills | auth setup |
| security | better-auth-security-best-practices | better-auth/skills | auth hardening |
| payments | stripe-best-practices | stripe/ai | Stripe integrations |
| ops | ci-cd-and-automation | addyosmani/agent-skills | CI pipelines and quality gates |
| ops | observability-and-instrumentation | addyosmani/agent-skills | logs, metrics, traces, alerts |
| ops | shipping-and-launch | addyosmani/agent-skills | launch readiness and rollback |
| web | frontend-design | anthropics/skills | distinctive visual design |
| web | frontend-ui-engineering | addyosmani/agent-skills | production UI engineering |
| web | vercel-react-best-practices | vercel-labs/agent-skills | React / Next.js performance |
| web | web-design-guidelines | vercel-labs/agent-skills | UI review at verify |
| web | accessibility | addyosmani/web-quality-skills | WCAG 2.2 audit |
| web | core-web-vitals | addyosmani/web-quality-skills | LCP / INP / CLS |
| web | seo | addyosmani/web-quality-skills | technical SEO |
| web | web-quality-audit | addyosmani/web-quality-skills | pre-launch audit |
| web | playwright-cli | microsoft/playwright-cli | real-browser checks |
| web | playwright-best-practices | currents-dev/playwright-best-practices-skill | e2e tests |
| mobile | vercel-react-native-skills | vercel-labs/agent-skills | RN / Expo performance |
| mobile | expo-overview (+ project-structure, router, native-ui, ui, design-system, data-fetching, dev-client, upgrade) | expo/skills | official Expo guidance |
| mobile | apple-appstore-reviewer | github/awesome-copilot | App Store rejection audit |
| backend | supabase-postgres-best-practices | supabase/agent-skills | Postgres schema and queries |
| backend | fastify-best-practices | mcollina/skills | Fastify APIs |
| backend | node | mcollina/skills | Node.js + TypeScript |

## Adding a skill

1. Find candidates with `npx skills find <topic>`, or browse [skills.sh](https://skills.sh/).
2. Check installs and publisher, then **read its SKILL.md** (`npx skills add owner/repo --list` shows what's
   inside a repo).
3. Add it to `config/skills.json` with a group and a one-line `use`.
4. Attach it to a concern in `config/concerns.json`, or mention it in the stage table in
   `skills/workflow/SKILL.md`. (The tests fail if an installed skill is never used anywhere.)
5. `npm test` → `/mndx:skills install <group>` → new session.
