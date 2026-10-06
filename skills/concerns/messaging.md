# Email, SMS & notifications checklist

- [ ] Send through a provider (Resend, Postmark, SES, Twilio, Expo Push / FCM / APNs), never raw SMTP from the
      app server. Provider keys are server-only.
- [ ] Email deliverability: a sending domain with **SPF, DKIM and DMARC** set up. A separate subdomain or stream
      for marketing vs transactional mail.
- [ ] Transactional vs marketing are separated. Marketing needs consent where the law requires it, plus a
      **one-click unsubscribe** (also required by Gmail/Yahoo bulk-sender rules) and the sender's physical
      address (CAN-SPAM) ⚖.
- [ ] SMS: explicit opt-in, STOP/HELP handling, quiet hours. ⚖ US TCPA / 10DLC registration, and local sender-ID rules.
- [ ] OTP / magic links: short expiry, single use, rate-limited per user and per IP, and no account-existence leak.
- [ ] Sending is async (a queue/job) with retries and backoff. Idempotent, so a retry never double-sends.
- [ ] Templates are localized (i18n.md), have a plain-text part, and are tested with a snapshot or preview.
- [ ] Push: permission asked in context (not at launch), tokens refreshed and pruned on invalid-token errors,
      per-category preferences.
- [ ] User notification preferences exist and are respected for every non-essential message.
- [ ] Tests use a fake transport (no real sends). One manual send to a test inbox is recorded in verify.md.
