---
name: MiddletownShop Auth Architecture
description: Two-hook auth system and how loading-hang was fixed
---

# MiddletownShop Auth Architecture

**Two auth hooks intentionally coexist — do NOT consolidate:**

- `@/hooks/useAuth` — standalone hook, uses `onSnapshot` for real-time profile, used by DashboardLayout and all dashboard pages.
- `@/contexts/useAuth` — re-exports `AuthContext` context hook with login/logout/register/refreshProfile, used by App.tsx ProtectedRoute, Login, Register, Deposit, Wallet, Withdraw.

## Loading-hang fix

**Why it hung:** `hooks/useAuth.ts` used `onSnapshot(ref, successCallback)` with no error callback. If Firestore returned a permission error or was offline, `setLoading(false)` was never called → infinite loading skeleton.

**Fix:** Add third argument `onSnapshot(ref, successCallback, errorCallback)` where error handler calls `setLoading(false)` and `setProfile(null)`.

**Also:** `AuthContext.tsx` has an 8-second safety timeout that force-clears `loading` in case of any unanticipated Firebase SDK error.

## Port issue (fixed)

`vite.config.ts` must use `parseInt(process.env.PORT || "5173")` — the artifact.toml sets `PORT=25797` and `localPort=25797`. Hardcoded `port: 5173` breaks the Replit proxy.
