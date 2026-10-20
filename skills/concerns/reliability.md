# Reliability & resilience checklist

For anything that calls other systems, runs background work, has concurrent writers, or has an uptime target.

**Scale gate:** most v1 products don't need distributed-systems machinery. Meet each item or write `n/a: <reason>`
in the plan's Concern coverage. A pattern is in scope only when the spec's numbers or failure modes call for it.
Never add a broker, sharding, Kubernetes or multi-region just to look production-ready.

## Calls between components
- [ ] Every outbound call (HTTP, DB, queue, third party) has an explicit **timeout**, shorter than its caller's.
- [ ] **Retries** only for idempotent (or idempotency-keyed) calls and transient errors (network, `429`, `5xx`):
      capped attempts, **exponential backoff with jitter**, and a total deadline. Never retry `4xx` or blind writes.
- [ ] **Circuit breaker** (or fail-fast) around a slow or flaky dependency, with the fallback defined.
- [ ] **Graceful degradation:** the core action works when a nice-to-have (email, analytics) is down.
- [ ] Operations are **idempotent**: the dedupe key is stored with the effect, in the same transaction.

## Async work & events
- [ ] A **message queue** is for slow, independently failing or restart-surviving work. **Pub/sub** is for fan-out to
      independent consumers. A DB-backed job table is fine at small scale.
- [ ] Consumers are idempotent (delivery is at-least-once), retry with backoff, and send poison messages to a
      **dead-letter queue** with an alert and a replay procedure.
- [ ] **Event-driven:** events are immutable, versioned, with an id and timestamp. Consumers tolerate duplicates and
      reordering. Don't use events where the caller needs an answer now.
- [ ] Multi-step work across services: prefer one DB transaction. Avoid **distributed transactions** (2PC). Use a
      **saga** (persisted state, idempotent steps, a compensating action each) plus an outbox so the write and the
      event can't diverge.
- [ ] Scheduled jobs (**cron**) are idempotent, overlap-safe, record their last success, and alert when they don't run.

## Concurrency & consistency
- [ ] **Race conditions:** every read-modify-write on shared data uses a transaction, an atomic update, a unique
      constraint or a lock, with a concurrent test.
- [ ] **Locking:** optimistic when conflicts are rare, pessimistic when common or costly. Keep locks short, take them
      in a consistent order (**deadlocks**), and set lock timeouts.
- [ ] **Distributed locks** only for real cross-process exclusion, with an expiry and a fencing token. Prefer a
      unique constraint or a queue.
- [ ] **Thread safety** (Go, JVM, Rust, Python threads): shared data guarded or immutable, race detector in tests. In
      Node.js an `await` between a check and a write still races.
- [ ] **Consistency** stated per feature (**CAP theorem**: in a partition, give up consistency or availability).
      Default to one strongly consistent primary. Where **eventual consistency** is accepted (replicas, caches,
      events), say which screens may be stale and give users read-your-writes.
- [ ] **Leader election** only if exactly one instance must act. Use the platform (managed queue, advisory lock,
      Kubernetes lease), never hand-rolled consensus.
- [ ] **Clock skew:** never order events or check expiry across machines without leeway. Use server time, monotonic
      clocks for durations, and DB sequences for ordering.
- [ ] **Network partitions** and partial failure are assumed: a call can time out after succeeding. Design for the
      unknown outcome (idempotent retry or reconcile).

## Failure & recovery
- [ ] **Backups with a tested restore**, a stated recovery point and time objective, and the **disaster-recovery**
      steps in `docs/RUNBOOK.md` (see infra.md).
- [ ] **Failover:** managed DB with automatic failover and at least two app instances behind a load balancer for
      anything that must stay up. Test it once. **Multi-region** only when the SLO or a regulation demands it ⚖.
- [ ] **Failure drills (chaos engineering, scaled down):** before launch, break a dependency in staging and confirm
      it degrades as designed. One game day is enough for a solo product.
- [ ] Deploys and migrations are backwards-compatible, so a rollback or mixed-version rollout works (devops.md).

**Verify evidence:** for each item in scope, the test or drill that proves it (a concurrent-write test, a killed
dependency, a replayed dead-letter message), in verify.md.
