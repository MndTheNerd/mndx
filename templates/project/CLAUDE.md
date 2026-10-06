# {{NAME}}

This project uses **MNDX**. Every change goes through Spec → Plan → Build → Verify → Ship.
Code files can only be edited while the active work item is approved (the gate hook enforces it).
Run `/mndx:status` to see where things stand.

## Read first
- [docs/PRODUCT.md](docs/PRODUCT.md): what we're building and why
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how it's built
- [docs/adr/](docs/adr/): decisions and their reasons

## Quality bar
These exact commands must pass before anything ships:

| Check | Command |
|---|---|
| Install | `…` |
| Format | `…` |
| Lint | `…` |
| Typecheck | `…` |
| Test | `…` |
| Build | `…` |
| Run (dev) | `…` |

## Conventions
<!-- Project-specific rules Claude must follow, discovered or decided over time. -->
- …

## Never
- Write files through shell redirects or scripts to get around the MNDX gate.
- Commit secrets, `.env` files, or credentials.
- Push to a remote, deploy, or run destructive migrations without the user asking.
