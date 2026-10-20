# Backend & API checklist

Load `api-and-interface-design` while designing, and `fastify-best-practices` / `node` for Node backends. Input
validation, authorization and CORS rules are in security.md. Outbound-call resilience is in reliability.md.
For a CLI or library, keep the contract, error, versioning, docs and tests items and mark the HTTP-only ones `n/a`.

- [ ] **Contract first:** routes, request and response schemas, status codes and the error shape are written down
      (OpenAPI or typed schemas) before building, and validated at the boundary.
- [ ] **One error format** (stable machine code + human message + request id). No stack traces or internals in
      responses. 4xx means the caller's fault, 5xx means ours.
- [ ] **Rate limiting** per user or key and per IP on public, auth and expensive endpoints. Over-limit requests get
      `429` with `Retry-After`. Limits are documented. Behind a proxy, read the client IP only from a trusted header.
- [ ] **Idempotency:** retryable unsafe operations (payments, creates, webhook handlers) take an `Idempotency-Key`
      or are naturally idempotent (PUT, upsert), so a retry never repeats the effect.
- [ ] **Pagination** on every list (keyset for large ones), allow-listed filters and sorts, and a maximum page size.
- [ ] **Versioning:** a breaking change gets a new version (`/v2` or a header). Additive changes don't. Deprecations
      are announced with a sunset date. Published SDKs and clients follow semver.
- [ ] The API has its own **request timeout and body-size limit**.
- [ ] **Webhooks received:** verify the signature and a timestamp (replay window), answer `2xx` fast and process
      async, dedupe by event id, tolerate out-of-order delivery. **Webhooks sent:** signed, retried with backoff,
      a delivery log, and an endpoint disabled after repeated failures.
- [ ] **Realtime:** use the simplest transport that works: polling, then long polling, then Server-Sent Events
      (one-way push over plain HTTP), then WebSockets (two-way). WebSockets need auth at connect, per-message
      validation, heartbeats, client reconnect with backoff, per-connection limits, and a design that survives a
      load balancer (stateless or sticky).
- [ ] **Protocol:** REST + JSON by default. gRPC (HTTP/2, protobuf) only for internal service-to-service calls that
      need streaming or strict contracts, since browsers need a proxy. HTTP/2 and HTTP/3 come from the host or CDN,
      not app code. TCP unless you truly need UDP (live media, games).
- [ ] **Docs:** an example request and response per endpoint, how auth works, and an API changelog.
- [ ] **Tests:** each endpoint has a contract test with one error case, `401`/`403`, a `429`, an idempotent retry
      that returns the same result, and a webhook with a bad signature that is rejected.
