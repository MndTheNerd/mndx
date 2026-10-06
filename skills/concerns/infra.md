# Infrastructure & hosting checklist

Prefer managed platforms for a solo developer (Vercel / Railway / Fly / Cloudflare / Supabase / Neon / Expo EAS)
over self-managed servers. Record the hosting choice and its monthly cost estimate in an ADR. ⚖ Anything that
costs money or needs an account is a user decision. Autopilot never creates paid resources.

- [ ] Every environment is reproducible from the repo: infrastructure-as-code (Terraform / Pulumi / platform config
      files such as `vercel.json`, `fly.toml`, `wrangler.toml`) or a written runbook in `docs/RUNBOOK.md`.
- [ ] Config via env vars, validated at boot. Secrets in the platform's secret store, rotated when people or keys change.
- [ ] Domains: HTTPS everywhere, automatic certificate renewal, DNS documented. `www`/apex redirect decided.
- [ ] Data: managed DB with automated **backups + point-in-time recovery**, retention set, and **a restore
      tested** (documented in the runbook). Object storage buckets private by default.
- [ ] Background work (emails, webhooks, reports) runs on a queue / scheduled jobs with retries, a dead-letter
      queue, and idempotent handlers. Cron jobs are monitored (alert if they don't run).
- [ ] Limits: request timeouts, body size limits, connection pooling for serverless + Postgres, and autoscaling
      bounds (so a traffic spike doesn't cause a surprise bill).
- [ ] Cost: a budget alert set on every paid provider. The expected cost at 10× usage is noted in the ADR.
- [ ] Observability: uptime check, error tracking, logs retained for a defined period (see observability skills).
- [ ] Data residency requirements checked (see privacy-compliance.md) before choosing a region ⚖.
- [ ] `docs/RUNBOOK.md`: how to deploy, roll back, restore a backup, rotate a secret, and who to contact
      (provider support links).
