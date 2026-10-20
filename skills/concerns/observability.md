# Observability checklist

Load `observability-and-instrumentation`, plus `secret-serialization` when adding logs or telemetry. For a small
product, logs, error tracking and an uptime check come first. The SLO and tracing items apply once there are paying
users or more than one service. Otherwise write `n/a: <reason>`.

- [ ] **Logging:** structured (JSON), levels used properly, a request or correlation id on every line, written to
      stdout for the platform to collect, a retention period set. No secrets or personal data in logs.
- [ ] **Error tracking** (Sentry or similar) in production with the release version and source maps. A new or
      spiking error alerts someone. User-facing errors show a reference id.
- [ ] **Metrics:** the four golden signals (latency, traffic, errors, saturation) per service, plus a business
      metric for the core action (signups, payments, jobs done). Label values are bounded, with no user ids as labels.
- [ ] **Health checks:** `/health` says the process is up. With an orchestrator, separate **liveness** (restart me)
      and **readiness** (send me traffic: dependencies are reachable) probes. Both are cheap and leak nothing.
- [ ] **Uptime:** an external check on the user-facing URL and the critical flow.
- [ ] **Alerts** only for what users feel (error rate, latency, failed or stuck jobs, queue age, certificate
      expiry). Each alert links a runbook line, and one has been test-fired. No alert without an action.
- [ ] **SLIs / SLOs / error budget:** pick 1–3 SLIs (availability, latency p95/p99, job success), set SLOs, and write
      the error-budget policy (budget burned → pause features and fix reliability). Skip with `n/a` before launch,
      but keep recording the signals.
- [ ] **Tracing:** distributed tracing (OpenTelemetry) once a request crosses two or more services or queues, with
      the trace id propagated and present in logs. One service: logs plus a correlation id are enough.
- [ ] **Observability, not just monitoring:** a new failure can be investigated from the telemetry alone (filter by
      user, request, release), without shipping new code. One dashboard per service shows deploy markers.
- [ ] **Audit log** for admin and security-relevant actions (who, what, when, from where), append-only, no secrets.
- [ ] **Cost:** log volume and metric cardinality are budgeted. Debug logs and traces are sampled.
- [ ] **Verify evidence:** one failing request shown end to end in verify.md: its log line with the correlation id,
      the tracked error, and the incremented metric.
