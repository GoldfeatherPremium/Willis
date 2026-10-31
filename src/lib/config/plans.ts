/**
 * Subscription plan definitions. These are the source of truth for quotas and
 * pricing in this codebase. Price overrides can be supplied via env vars
 * (STRIPE_PRICE_*) for billing adapters.
 */

export type PlanId = "explorer" | "personal" | "family" | "collector";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in USD cents per month. 0 = free. */
  priceCents: number;
  /** Max number of homes. */
  maxHomes: number;
  /** Max number of rooms per home (capturable). */
  maxRoomsPerHome: number;
  /** Room captures (scan jobs) included per month. */
  monthlyCaptureAllowance: number;
  /** Max family members (including owner). */
  maxFamilyMembers: number;
  advancedInventory: boolean;
  /** Feature flags shown in pricing UI. */
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  explorer: {
    id: "explorer",
    name: "Explorer",
    tagline: "Start your first room",
    priceCents: 0,
    maxHomes: 1,
    maxRoomsPerHome: 1,
    monthlyCaptureAllowance: 2,
    maxFamilyMembers: 1,
    advancedInventory: false,
    features: [
      "1 home, 1 room",
      "2 room captures / month",
      "3D room view (web)",
      "Basic object inventory",
      "Search your belongings"
    ]
  },
  personal: {
    id: "personal",
    name: "Personal",
    tagline: "For one home, fully remembered",
    priceCents: 599,
    maxHomes: 1,
    maxRoomsPerHome: 12,
    monthlyCaptureAllowance: 10,
    maxFamilyMembers: 2,
    advancedInventory: true,
    features: [
      "1 home, up to 12 rooms",
      "10 room captures / month",
      "AI assistant + natural-language search",
      "Spatial memory & movement history",
      "Receipts, manuals & warranties",
      "Insurance & moving reports"
    ]
  },
  family: {
    id: "family",
    name: "Family",
    tagline: "The whole household, together",
    priceCents: 1199,
    maxHomes: 3,
    maxRoomsPerHome: 20,
    monthlyCaptureAllowance: 30,
    maxFamilyMembers: 5,
    advancedInventory: true,
    features: [
      "Up to 3 homes",
      "Up to 5 family members",
      "30 room captures / month",
      "Shared home access & permissions",
      "Everything in Personal"
    ]
  },
  collector: {
    id: "collector",
    name: "Collector",
    tagline: "For serious collections",
    priceCents: 1999,
    maxHomes: 10,
    maxRoomsPerHome: 50,
    monthlyCaptureAllowance: 100,
    maxFamilyMembers: 10,
    advancedInventory: true,
    features: [
      "Unlimited homes",
      "100 room captures / month",
      "Advanced collectible inventory",
      "Serial-number tracking",
      "Everything in Family"
    ]
  }
};

export const PLAN_ORDER: PlanId[] = ["explorer", "personal", "family", "collector"];

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

export function getPlanByIdOrThrow(id: string): PlanDefinition {
  const plan = PLANS[id as PlanId];
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export interface UsageLimits {
  plan: PlanDefinition;
  exceeded: {
    homes: boolean;
    rooms: boolean;
    captures: boolean;
    familyMembers: boolean;
  };
}

/**
 * Compares current usage counters against a plan's limits.
 * All billing restrictions must be enforced on the backend; this helper is the
 * shared authority used by API routes and server actions.
 */
export function evaluateUsage(plan: PlanDefinition, usage: {
  homeCount: number;
  roomCount: number;
  capturesThisMonth: number;
  familyMemberCount: number;
}): UsageLimits {
  return {
    plan,
    exceeded: {
      homes: usage.homeCount >= plan.maxHomes,
      rooms: usage.roomCount >= plan.maxRoomsPerHome,
      captures: usage.capturesThisMonth >= plan.monthlyCaptureAllowance,
      familyMembers: usage.familyMemberCount >= plan.maxFamilyMembers
    }
  };
}
