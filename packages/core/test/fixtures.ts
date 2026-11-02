import type { Bill } from "../src/schema";

// one realistic bill, tests override just the fields they care about
export const bill = (over: Partial<Bill> = {}): Bill => ({
  carrier: "Maplewave Mobile",
  planName: "Plus 50",
  monthlyPlanPrice: 55,
  dataCapGB: 50,
  dataUsedGB: 4,
  overageCharges: 0,
  promoDiscount: 15,
  promoEndDate: "2026-11-21",
  totalDue: 45.85,
  lineItems: [{ description: "Plus 50 plan", amount: 55, category: "plan", explanation: "Your base plan." }],
  ...over,
});