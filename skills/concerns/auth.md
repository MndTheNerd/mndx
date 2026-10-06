# Identity & access checklist

Prefer a maintained library (Better Auth, Auth.js, Supabase/Firebase/Clerk auth) over hand-rolled auth. Load
`better-auth-best-practices` and `better-auth-security-best-practices` when using Better Auth. The security
principles apply whatever the library.

- [ ] Sessions: secure `HttpOnly` cookies (web) or secure storage (mobile: expo-secure-store / Keychain). Never
      localStorage for tokens. Rotation on login and privilege change. Server-side revocation possible.
- [ ] Passwords (if any): at least 8 characters, checked against breached lists where possible, hashed by the
      library. No composition rules beyond that (NIST 800-63B).
- [ ] Login, signup, reset and OTP endpoints are rate-limited and don't reveal whether an account exists.
- [ ] Email verification before sensitive actions. Password reset tokens are single-use and short-lived.
- [ ] OAuth: state + PKCE, exact redirect URI matching, link accounts only on a verified email.
- [ ] MFA available for accounts that hold money or sensitive data (TOTP / passkeys).
- [ ] Authorization model written down (roles → permissions) in ARCHITECTURE.md and enforced server-side
      (see security.md).
- [ ] **Account deletion** flow exists. It's required by Apple and Google for apps with account creation and by
      privacy laws (see app-store.md, privacy-compliance.md).
- [ ] Sign in with Apple, or an equivalent privacy-focused login option, is offered when an iOS app offers
      third-party social login. ⚖ Check Apple's current guideline 4.8.
- [ ] Tests: unauthenticated → 401, wrong user → 403/404, expired session, a reset token used twice.
