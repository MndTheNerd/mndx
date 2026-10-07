---
name: concerns
description: MNDX production-concern checklists (testing, security, UX, accessibility, data, auth, privacy/compliance/legal, payments, i18n, messaging, AI, devops, infra, app-store). Load the matching checklist whenever a spec, plan, build or verify step touches that concern.
user-invocable: false
---

# Production concerns

Every MNDX item is routed to the concerns it touches (see the `route` skill). Each concern contributes three things:
- **Spec:** the requirements it adds, as acceptance criteria or non-functional requirements
- **Plan:** the design decisions and the tests that prove it
- **Verify:** the checklist below, ticked with evidence

| Concern | Checklist | Community skills to load |
|---|---|---|
| Testing | [testing.md](testing.md) | `tdd`, `property-based-testing`, `playwright-best-practices` |
| Security | [security.md](security.md) | `security-and-hardening`, `sharp-edges`, `semgrep`, `secret-serialization` |
| Product & UX | [ux.md](ux.md) | `frontend-design`, `web-design-guidelines`, `expo-design-system` |
| Accessibility | [accessibility.md](accessibility.md) | `accessibility`, `web-design-guidelines` |
| Data & database | [data.md](data.md) | `supabase-postgres-best-practices`, `domain-modeling` |
| Identity & access | [auth.md](auth.md) | `better-auth-best-practices`, `better-auth-security-best-practices` |
| Privacy, compliance & legal | [privacy-compliance.md](privacy-compliance.md) | none (no trustworthy community skill) |
| Payments & billing | [payments.md](payments.md) | `stripe-best-practices` |
| Dates, times & scheduling | [time.md](time.md) | `property-based-testing` |
| Internationalization | [i18n.md](i18n.md) | none |
| Email, SMS & notifications | [messaging.md](messaging.md) | none |
| AI / LLM features | [ai.md](ai.md) | `claude-api` |
| CI/CD & release | [devops.md](devops.md) | `ci-cd-and-automation`, `gha-security-review`, `shipping-and-launch` |
| Infrastructure & hosting | [infra.md](infra.md) | `shipping-and-launch` |
| App store release | [app-store.md](app-store.md) | `apple-appstore-reviewer`, `expo-overview` |
| Web frontend / Mobile / API / Performance / SEO / Observability | the community skills (see `config/concerns.json`) | |

## Precedence
MNDX rules override every community skill. If a skill says to push, deploy, commit, open a PR, change approvals,
or ask the user to confirm something the approved plan already settles, follow MNDX instead.

## Legal disclaimer
The compliance, payments and app-store checklists flag what commonly applies. They're **not legal advice**.
Anything marked ⚖ needs a human (and often a lawyer) to confirm for the specific product and country. Record it as
an open question for the user, or under autopilot as a "Please check" item in the report.
