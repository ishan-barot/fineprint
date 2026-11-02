import { describe, expect, it } from "vitest";
import { matchPlans, type Plan } from "../src/matcher";
import { bill } from "./fixtures";

const base = { network: "5G", url: "https://example.com", lastVerified: "2026-11-01" };
const plans: Plan[] = [
  { ...base, id: 1, carrier: "A", name: "Cheap 10", monthlyPrice: 25, dataGB: 10 },
  { ...base, id: 2, carrier: "B", name: "Mid 20", monthlyPrice: 34, dataGB: 20 },
  { ...base, id: 3, carrier: "C", name: "Unlimited", monthlyPrice: 60, dataGB: null },
];

describe("matchPlans", () => {
  it("only suggests plans with enough data plus headroom", () => {
    expect(matchPlans(bill({ dataUsedGB: 15 }), plans).map((p) => p.id)).toEqual([2]);
  });

  it("ranks by yearly savings", () => {
    const m = matchPlans(bill(), plans);
    expect(m.map((p) => p.id)).toEqual([1, 2]);
    expect(m[0].savingsPerYear).toBe(360);
  });

  it("returns nothing when you're already on the cheapest fit", () => {
    expect(matchPlans(bill({ monthlyPlanPrice: 20 }), plans)).toEqual([]);
  });
});