---
name: Tailwind v4 PostCSS setup
description: How to use Tailwind v4 via PostCSS (no @tailwindcss/vite plugin) in the middletown-shop Vite app.
---

## Rule
Use `@tailwindcss/postcss` not `@tailwindcss/vite` for Tailwind v4 integration in middletown-shop.

**Why:** @tailwindcss/vite is an optional faster integration but caused version conflicts in this project. The PostCSS approach is more portable and equally stable.

**How to apply:**
- `devDependencies`: `tailwindcss: ^4.3.0`, `@tailwindcss/postcss: ^4.3.0`, `postcss: ^8.5.4`
- `vite.config.ts`: `plugins: [react()]` — do NOT import or add tailwindcss plugin
- `postcss.config.mjs`: `export default { plugins: { "@tailwindcss/postcss": {} } }`
- `src/index.css`: keep `@import "tailwindcss"` — this syntax is identical for both integrations
- `@theme inline {}` and `@custom-variant` CSS syntax all remain unchanged
