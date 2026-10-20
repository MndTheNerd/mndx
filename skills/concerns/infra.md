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
- [ ] **Traffic path:** HTTPS ends at a CDN or a managed **load balancer** that health-checks at least two
      instances. A **reverse proxy** (Nginx, Caddy, or the platform router) handles TLS, compression, timeouts and
      body limits. An **API gateway** only when several services need shared auth, rate limiting or routing.
- [ ] **CDN and edge caching** for static assets and cacheable pages: fingerprinted assets with a long TTL, versioned
      URLs or a purge on deploy, and no personalized content cached at the edge (see performance.md).
- [ ] **Scaling:** instances are stateless so **horizontal scaling** works. **Vertical scaling** (a bigger instance)
      comes first because it's the simplest. **Autoscaling** runs on a real signal (CPU, concurrency, queue age)
      with min and max bounds, and a scale-in that doesn't drop requests.
- [ ] **Containers and orchestration:** Docker is enough for most products. **Kubernetes**, **Helm charts** and
      **service discovery** are only for several services with real scheduling or scale needs and someone to
      operate them. Otherwise use a managed platform (Fly, Railway, Cloud Run, ECS Fargate). ⚠ Adopting Kubernetes
      is a user decision, with an ADR for the cost and the operations burden.
- [ ] **Serverless:** know the **limits** (timeout, memory, payload size, concurrency, DB connections) and the
      **cold starts**. Keep bundles small, reuse connections, and push long work to a queue or container.
- [ ] **Multi-region** only when latency, an availability SLO or data residency demands it. It needs a data
      replication design (see reliability.md). The default is one region plus tested backups ⚖.
- [ ] **Cost optimization:** a budget alert set on every paid provider. The expected cost at 10× usage is noted in the ADR.
- [ ] Observability: uptime check, error tracking, logs retained for a defined period (see observability skills).
- [ ] Data residency requirements checked (see privacy-compliance.md) before choosing a region ⚖.
- [ ] `docs/RUNBOOK.md`: how to deploy, roll back, restore a backup, rotate a secret, and who to contact
      (provider support links).
