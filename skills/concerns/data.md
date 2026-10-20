# Data & database checklist

Load `supabase-postgres-best-practices` for Postgres and `domain-modeling` for naming.

- [ ] Entities and terms match GLOSSARY.md. Types are precise (money as integer minor units or `numeric`, never
      float; `timestamptz` in UTC; enums or check constraints for states).
- [ ] Constraints enforce integrity in the DB: `NOT NULL`, `UNIQUE`, foreign keys with deliberate `ON DELETE`,
      `CHECK`s. The app doesn't rely on application code alone.
- [ ] Every schema change is a versioned migration that's reviewed, reversible where possible, and **safe on a
      live table** (no long locks: add a nullable column, backfill in batches, then add the constraint).
- [ ] Indexes for every column queries filter, join or sort on. Unbounded lists are paginated (keyset for large ones).
- [ ] Multi-step writes run in a transaction. Idempotency keys for retried operations.
- [ ] Concurrent writers to the same row are handled with **optimistic locking** (a version or `updated_at` check,
      retry on conflict) or **pessimistic locking** (`SELECT … FOR UPDATE`: short, consistent order, with a lock
      timeout). Never read-modify-write without one (see reliability.md for deadlocks and distributed locks).
- [ ] **Schema versioning:** the schema version is recorded (the migration table). Stored JSON or events carry a
      `version` field and an upgrade path. The old and new app versions both work during a rollout (expand →
      migrate → contract).
- [ ] **Scaling the database is a last resort and needs a measured limit.** In order: indexes and query fixes,
      connection pooling, caching, **read replicas** (reads only: accept replication lag, keep read-your-writes on
      the primary), **partitioning** (split a big table by time or key inside one database), then **sharding**
      (split across databases: costly cross-shard queries, only when one primary can't hold the writes or the
      data). **Replication** (primary plus standby) is for availability and backups, not for write scaling.
- [ ] Multi-tenant or per-user data: every query is scoped (or RLS policies with tests proving cross-tenant reads fail).
- [ ] Personal data is identified (see privacy-compliance.md): minimized, deletable, exportable.
- [ ] Backups: automated, retention defined, **restore tested once** (see infra.md).
- [ ] Seed / fixture data for dev and tests. No production data in dev.
- [ ] ⚠ Destructive migrations (drop, rename, type change on data) are **always** a user decision, even under autopilot.
