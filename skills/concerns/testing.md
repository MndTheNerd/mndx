# Testing checklist (always applies)

- [ ] Every AC has an automated test that fails if the behavior breaks (unit → integration → e2e: the cheapest
      test type that really proves it).
- [ ] Tests sit at the seams named in the plan's test plan, and go through public interfaces, never internals.
- [ ] Error paths and edge cases from the spec are tested, not just the happy path.
- [ ] Logic with many input combinations (parsers, money, dates, permissions, serialization) has property-based
      tests (`property-based-testing`).
- [ ] Critical user journeys (signup, checkout, the core action) have e2e tests (`playwright-best-practices` for web,
      Maestro for mobile).
- [ ] Deterministic: no real network, time or randomness; no sleeps; no dependence on test order.
      External services are faked at the adapter boundary.
- [ ] Integration tests use a real database (container/SQLite equivalent), not ORM mocks.
- [ ] The whole suite runs with the single command in CLAUDE.md and passes locally.
