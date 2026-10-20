# {{NAME}} — Assessment

> Assessed: {{DATE}} by /mndx:assess · Re-run any time with `/mndx:assess`
> Decision: **KEEP / FIX / REBUILD**, recorded in [adr/NNNN-adoption.md](adr/)

## Summary
<!-- 3 sentences: what this is, overall health, the single biggest risk. -->

## Questions
<!-- Written first, closed last. Status: answered / partial / unresolved. Evidence: what you read or ran. -->
| Question | Status | Evidence |
|---|---|---|
| What is it and who uses it? | | |
| How does it run and deploy? | | |
| What are the main flows, data and boundaries? | | |
| What touches auth, money or personal data? | | |

## What was checked
<!-- Commands actually run and their real results, and what was read or sampled. -->
| Check | Command | Result |
|---|---|---|
| Install | `…` | |
| Tests | `…` | e.g. 31 passed, 2 failed, ~20% of modules covered |
| Lint | `…` | |
| Typecheck | `…` | |
| Build | `…` | |
| Dependency audit | `…` | e.g. 2 high, 5 moderate |

## Scorecard
0 = missing/dangerous · 1 = weak · 2 = solid with gaps · 3 = production-grade

| Area | Score | Why |
|---|---|---|
| Architecture & structure | | |
| Code quality | | |
| Types & static checks | | |
| Tests | | |
| Security | | |
| Data & migrations | | |
| Auth & access | | |
| Privacy & compliance | | |
| Payments | | |
| UX & accessibility | | |
| Performance | | |
| Observability | | |
| CI/CD & release | | |
| Dependencies | | |
| Docs & onboarding | | |

## Findings
<!-- Evidence: observed (read or ran it) or inferred. For a "not found" claim, say what was searched. -->
| # | Severity | Area | Where | Problem → impact | Fix | Effort | Evidence |
|---|---|---|---|---|---|---|---|

## Not examined
<!-- What was skipped or couldn't be run, and why, so the audit's limits are visible. -->

## Worth keeping
<!-- What's genuinely good. Any fix or rebuild must preserve it. -->

## Options
| Option | What it means | Effort | Risk accepted |
|---|---|---|---|
| Keep as-is | adopt, continue with new work | none | … |
| Fix | backlog of fixes, highest risk first | … | … |
| Rebuild | new foundation, parity with current behavior | … | … |

**Recommendation:** …
