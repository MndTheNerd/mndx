# Security checklist (always applies)

Based on the OWASP Top 10 and ASVS level 1. Load `security-and-hardening` while building and `semgrep` at verify.

## Input & output
- [ ] Every external input is validated with a schema at the boundary: body, query, params, headers, files,
      webhooks, env, third-party responses.
- [ ] Only parameterized queries / ORM. No string-built SQL, shell commands or HTML.
- [ ] Output encoded for its context. No `dangerouslySetInnerHTML` / `v-html` with user data; rich text sanitized.
- [ ] Uploads: type and size checked server-side, stored outside the web root or in object storage with random
      names, served with the right `Content-Type` + `Content-Disposition`, never executed. Images re-encoded if shown.
- [ ] Redirect targets and URLs the server fetches are allow-listed (open redirect / SSRF).

## Access control
- [ ] Every protected action checks authorization **on the server**, per object (no IDOR: user A can't read or
      change B's record by changing an id).
- [ ] Deny by default. Admin routes are separately protected. Role checks live in one place.
- [ ] Rate limits on auth, OTP, password reset, expensive and public endpoints.

## Secrets & config
- [ ] No secrets in code, git, client bundles, logs or error messages (`secret-serialization`). `.env` is
      git-ignored and `.env.example` committed.
- [ ] Least-privilege keys (restricted API keys, scoped DB users). Test keys in dev, live keys only in production.

## Transport & headers (web)
- [ ] HTTPS only (HSTS). Cookies `Secure`, `HttpOnly`, `SameSite=Lax` or stricter.
- [ ] CSRF protection on cookie-authenticated mutations. CORS restricted to known origins.
- [ ] Security headers: CSP (at least a basic one), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
      `frame-ancestors`.

## Dependencies & supply chain
- [ ] Lockfile committed. `npm audit` / `pnpm audit` / `pip-audit` / `govulncheck` has no high or critical issues.
- [ ] New dependencies are maintained, popular and necessary. GitHub Actions pinned (`gha-security-review`).

## Data protection
- [ ] Passwords hashed with argon2id/bcrypt (or delegated to the auth library). Sensitive fields encrypted at rest
      where the threat model needs it.
- [ ] Errors shown to users are generic. Details are logged server-side without secrets or PII.

## Verify evidence
`semgrep` scan clean (or each finding triaged), dependency audit output, and a test for at least one
authorization-denied case per protected resource.
