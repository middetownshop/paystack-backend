---
name: MiddletownShop Theme
description: CSS variable values and theming rules for MiddletownShop (West African fintech app)
---

# MiddletownShop Theme

**Why:** index.css was accidentally replaced with generic shadcn defaults (all-white light mode). The original design requires a dark navy sidebar, green primary, and cool-gray background.

## Key rules

- `--sidebar` must be dark navy `222 47% 14%` in BOTH `:root` AND `.dark` — the sidebar is always dark, never white.
- `--primary: 142 71% 35%` — MiddletownShop green (the brand colour).
- `--background: 220 16% 96%` — cool light gray, NOT pure white `0 0% 100%`.
- `--card: 0 0% 100%` — white cards stand out against the gray background.

## How to apply

- Never change `--sidebar` back to near-white in `:root`. The Login page left hero panel and DashboardLayout sidebar both use `bg-sidebar`.
- If any component uses `bg-white` or `text-black` hardcoded in classNames, replace with `bg-card`/`text-foreground` so dark mode works.
- DashboardLayout uses `bg-sidebar text-sidebar-foreground` on the `<aside>`. Active nav = `bg-sidebar-primary`. Hover = `bg-sidebar-accent`.
