---
name: Nested pnpm-workspace.yaml
description: A stray pnpm-workspace.yaml inside an artifact directory silently breaks workspace member discovery in this monorepo.
---

## Rule
Never allow a `pnpm-workspace.yaml` file to exist inside any `artifacts/*` or `lib/*` directory. Only the root `pnpm-workspace.yaml` is valid.

**Why:** pnpm treats any directory containing `pnpm-workspace.yaml` as a workspace root. A nested one causes pnpm to treat that artifact as an independent workspace, so it is no longer discovered as a member of the root workspace. `pnpm ls -r` shows only the root package and the filter `--filter @workspace/<name>` fails with "No projects matched".

**How to apply:** After any restructure or copy of files, run `find . -name "pnpm-workspace.yaml" -not -path "*/node_modules/*"` and delete anything not at the repo root. The root `pnpm-workspace.yaml` packages glob is `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`.
