import type { Bill } from "./schema";

export type Plan = {
  id: number;
  carrier: string;
  name: string;
  monthlyPrice: number;
  dataGB: number | null; // null means unlimited
  network: string;
  url: string;
  lastVerified: string;
};

export type PlanMatch = Plan & { savingsPerYear: number };

// deterministic on purpose, ranking plans is math and not a job for an llm
export function matchPlans(bill: Bill, plans: Plan[], limit = 5): PlanMatch[] {
  const used = bill.dataUsedGB ?? bill.dataCapGB ?? 10;
  const needGB = Math.max(1, used * 1.2); // 20% headroom so they don't blow past the cap next month
  const current = bill.monthlyPlanPrice + bill.overageCharges; // pre-tax, same basis as listed plan prices

  return plans
    .filter((p) => p.dataGB === null || p.dataGB >= needGB)
    .map((p) => ({ ...p, savingsPerYear: Math.round((current - p.monthlyPrice) * 12 * 100) / 100 }))
    .filter((p) => p.savingsPerYear > 0)
    .sort((a, b) => b.savingsPerYear - a.savingsPerYear || (b.dataGB ?? 1e9) - (a.dataGB ?? 1e9))
    .slice(0, limit);
}