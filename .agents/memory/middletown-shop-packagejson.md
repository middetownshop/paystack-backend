---
name: MiddletownShop package.json
description: The middletown-shop frontend package.json was corrupted with api-server content; documents correct structure
---

# MiddletownShop package.json

**Why:** The `artifacts/middletown-shop/package.json` was found with `"name": "@workspace/api-server"` and Express build scripts (`node ./build.mjs`) instead of Vite frontend scripts. This caused the pnpm workflow filter `--filter @workspace/middletown-shop` to find no matching package, crashing the dev server.

## Correct structure

- **name**: `@workspace/middletown-shop`
- **scripts.dev**: `vite`
- **scripts.build**: `tsc -p tsconfig.json --noEmit && vite build`
- **scripts.typecheck**: `tsc -p tsconfig.json --noEmit`
- All dependencies are frontend packages (firebase, wouter, react, tanstack-query, radix-ui, etc.)
- No Express, pino, drizzle, or esbuild in this package

## How to apply

If the middletown-shop workflow fails with "No projects matched the filters", check that `package.json` has `"name": "@workspace/middletown-shop"` and Vite scripts — not api-server content.

## Root cause (known)

The package.json corruption likely occurred during an earlier agent session that incorrectly overwrote it with the api-server template.
