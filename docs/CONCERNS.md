# Production concerns & the router

A task written in plain language rarely mentions what a production product actually needs. "Let users upload a
profile photo" says nothing about file-type validation, storage cost, alt text or personal data, but all of those
matter. The router makes sure they're never silently skipped.

## How routing works

```
"Let users pay for a premium plan with Stripe"
        │
        ▼  1. keyword pass (config/concerns.json, whole-word matching)
   payments (mentions: pay, stripe)
        │
        ▼  2. implied concerns
   + security, privacy, messaging (implied by payments)
   + testing, security (always)
        │
        ▼  3. Claude's judgment pass (the route skill)
   + app-store (the product has an iOS app → in-app purchase rules)
   − drops any false positive, with a reason
        │
        ▼  4. recorded in spec.md → Concerns table (approved with the spec)
   plan: a design decision + proof per concern
   verify: each concern's checklist ticked with evidence
   reviewers: a missing security/privacy/payments concern is a blocker
```

Try it any time:

```
/mndx:route add a team invite flow with email
```
or from a terminal:
```bash
node scripts/mndx.js route "add a team invite flow with email" --json
```

## The 20 concerns

| Concern | Applies when | MNDX checklist | Community skills |
|---|---|---|---|
| Testing | **always** | [testing.md](../skills/concerns/testing.md) | tdd, property-based-testing, playwright-best-practices |
| Security | **always** | [security.md](../skills/concerns/security.md) | security-and-hardening, sharp-edges, semgrep, secret-serialization |
| Product & UX | anything with a UI | [ux.md](../skills/concerns/ux.md) | frontend-design, web-design-guidelines, expo-design-system |
| Accessibility | anything with a UI | [accessibility.md](../skills/concerns/accessibility.md) | accessibility, web-design-guidelines |
| Web frontend | web, react, page, form… | stack-web playbook | frontend-ui-engineering, vercel-react-best-practices, playwright-cli |
| Mobile app | ios, android, expo… | stack-mobile playbook | expo-overview (+ expo-*), vercel-react-native-skills |
| Backend & API | api, endpoint, webhook, cli… | stack-backend playbook | api-and-interface-design, fastify-best-practices, node |
| Data & database | database, migration, import… | [data.md](../skills/concerns/data.md) | supabase-postgres-best-practices, domain-modeling |
| Identity & access | login, signup, roles, invite… | [auth.md](../skills/concerns/auth.md) | better-auth-best-practices, better-auth-security-best-practices |
| Privacy, compliance & legal | personal data, cookies, GDPR, kids, health, UGC… | [privacy-compliance.md](../skills/concerns/privacy-compliance.md) | none (MNDX checklist) |
| Payments & billing | pay, checkout, subscription, stripe, knet… | [payments.md](../skills/concerns/payments.md) | stripe-best-practices |
| Performance & scale | slow, cache, scale, realtime… | none | performance-optimization, core-web-vitals |
| SEO | landing page, blog, sitemap… | none | seo, web-quality-audit |
| Internationalization | language, arabic, rtl, currency, timezone… | [i18n.md](../skills/concerns/i18n.md) | none |
| Email, SMS & notifications | email, sms, otp, push… | [messaging.md](../skills/concerns/messaging.md) | none |
| AI / LLM features | ai, llm, chatbot, claude, rag… | [ai.md](../skills/concerns/ai.md) | claude-api |
| Observability | logging, monitoring, alerts… | none | observability-and-instrumentation |
| CI/CD & release | ci, deploy, release, docker… | [devops.md](../skills/concerns/devops.md) | ci-cd-and-automation, gha-security-review, shipping-and-launch |
| Infrastructure & hosting | hosting, aws, backup, queue, storage, photo… | [infra.md](../skills/concerns/infra.md) | shipping-and-launch |
| App store release | app store, play store, testflight, iap… | [app-store.md](../skills/concerns/app-store.md) | apple-appstore-reviewer, expo-overview |

**Implied links:** auth → privacy + security · payments → security + privacy + messaging · messaging → privacy ·
ai → privacy + security · app-store → privacy + mobile · web/mobile → UX + accessibility · data/devops/infra →
security.

## ⚖ Legal & compliance

The privacy, payments, accessibility and app-store checklists cover the rules that commonly apply: GDPR / UK
GDPR, ePrivacy cookies, the EU Accessibility Act, CCPA/CPRA, COPPA, CAN-SPAM, TCPA, ADA, HIPAA, PCI DSS, the
Kuwait (CITRA), Saudi and UAE data-protection laws, and the Apple / Google store policies.

**This is not legal advice.** Items marked ⚖ are flagged so a human decides them. In the manual flow they become
questions for you. Under autopilot, Claude picks the safest default and lists them under "Please check".

## Extending the taxonomy

Everything lives in [`config/concerns.json`](../config/concerns.json):

```json
{ "id": "payments", "title": "Payments & billing",
  "triggers": ["pay", "checkout", "subscription", "stripe", "knet"],
  "implies": ["security", "privacy", "messaging"],
  "checklist": "payments.md",
  "skills": ["stripe-best-practices", "property-based-testing"] }
```

- **Add a trigger word:** append it (lowercase, matched as a whole word or phrase). Avoid generic words like
  "plan", "store" or "save", which match almost every task.
- **Add a concern:** add an entry, and (optionally) a checklist file in `skills/concerns/`.
- **Attach a skill:** it has to be in `config/skills.json` (see [SKILLS.md](SKILLS.md)) or be a Claude Code built-in
  listed in `builtinSkills`.

Then run `npm test`. The tests check that every checklist exists, every skill is known, every `implies` target
is real, and that sample tasks still route correctly.
