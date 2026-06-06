import type { UserProfile } from "@/hooks/useAuth";

/**
 * Returns the price an agent should pay for a bundle.
 *
 * Priority (bundle-level fields only — no global fallback):
 *  1. bundle.agentPrice  > 0  →  use it directly (custom fixed price)
 *  2. bundle.agentDiscount > 0  →  apply % off the normal price
 *  3. otherwise            →  agent pays normal price
 *
 * Non-agents always pay the normal price.
 * There is NO automatic default discount anywhere in this function.
 */
export function getBundlePrice(
  bundle: any,
  profile: UserProfile | null | undefined
): number {
  const normalPrice = Number(bundle?.price || 0);

  if (!bundle || profile?.role !== "agent") return normalPrice;

  const agentPrice = Number(bundle.agentPrice);
  if (!isNaN(agentPrice) && agentPrice > 0) return agentPrice;

  const agentDiscount = Number(bundle.agentDiscount);
  if (!isNaN(agentDiscount) && agentDiscount > 0) {
    return Math.max(0, normalPrice * (1 - agentDiscount / 100));
  }

  return normalPrice;
}

/**
 * Returns true only when the agent will actually pay less than the normal price.
 * Used to decide whether to show the strikethrough / "Agent price" badge.
 */
export function hasAgentPricing(
  bundle: any,
  profile: UserProfile | null | undefined
): boolean {
  if (!bundle || profile?.role !== "agent") return false;
  const normal = Number(bundle?.price || 0);
  const final = getBundlePrice(bundle, profile);
  return final < normal;
}

/** Safe GHS formatter — never crashes on undefined / NaN. */
export function formatGHS(value: unknown): string {
  return Number(value || 0).toFixed(2);
}
