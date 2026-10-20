# Performance & scale checklist

Load `performance-optimization`, plus `core-web-vitals` for web pages.

**Scale gate:** meet an item only when the spec's numbers call for it, and otherwise write `n/a: <reason>` in the
plan's Concern coverage. Measure first. Speculative caches, queues and sharding with no measurement behind them are
defects, not diligence.

- [ ] **Budgets first:** the target is in the spec (for example API p95 under 300 ms, LCP under 2.5 s, N concurrent
      users). Measure before optimizing, and record before/after numbers in verify.md.
- [ ] **Percentiles, not averages:** report p50, p95 and p99. **Tail latency** comes from slow queries, GC pauses,
      cold starts, retries and fan-out. Check p99 for any request that calls several things. Say whether latency or
      **throughput** is the goal.
- [ ] **Database and query optimization:** indexes cover every filter and sort (`EXPLAIN` shows no scan on big tables). **No N+1 queries**
      (batch, join or dataloader, with a test that counts queries per request). Select only needed columns,
      paginate, and log slow queries. **Connection pooling** is sized so instances can't exhaust the DB.
- [ ] **Caching** only for reads that are measured hot, expensive and slow-changing. Per cache, write down the key,
      TTL, **who invalidates it** (event, TTL, or versioned keys), stampede protection, and what happens when the
      cache is down (slower, never broken). **Cache invalidation** is a design item, not an afterthought.
- [ ] **CDN / edge:** fingerprinted static assets with long immutable caching. HTML and API caching is decided
      deliberately (`Cache-Control`, `stale-while-revalidate`, `Vary`). Personalized or authenticated responses are
      never cached at a shared edge.
- [ ] **Backpressure:** queues and concurrency are bounded. Under overload, shed load (`429` / `503` with
      `Retry-After`) instead of buffering until memory runs out.
- [ ] **Memory:** no unbounded in-memory caches or lists. Listeners, timers and streams are cleaned up. For
      long-running processes, watch heap growth (leaks) and **garbage-collection** pauses, and set memory limits so
      a leak causes a restart, not an outage.
- [ ] **Serverless:** **cold starts** are measured, the bundle is small, and heavy setup stays out of the handler.
      Know the limits (timeout, memory, payload, concurrency, DB connections). Long jobs go to a queue or worker.
- [ ] **Scaling:** app servers are stateless (state in the DB, cache or object storage) so horizontal scaling
      works. Scale vertically first (simplest), and horizontally when CPU or concurrency is the bottleneck.
      Autoscaling has min, max and a cost cap (see infra.md).
- [ ] **Load test** the critical path before launch if the spec has a throughput target. The result and the
      bottleneck found go in verify.md.
- [ ] **Web front end:** Core Web Vitals within budget (LCP, INP, CLS), images sized and lazy-loaded, a JS bundle budget.
