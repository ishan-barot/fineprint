import { z } from "zod";

export const CATEGORIES = ["plan", "fee", "overage", "add_on", "promo_credit", "tax", "device", "other"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");

export const LineItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().describe("CAD, negative for credits and discounts"),
  category: z.enum(CATEGORIES),
  explanation: z.string().min(1).max(200).describe("one plain-English sentence for a student"),
});

export const BillSchema = z.object({
  carrier: z.string().min(1),
  planName: z.string().min(1),
  monthlyPlanPrice: z.number().nonnegative().describe("base plan price before discounts and tax"),
  dataCapGB: z.number().nonnegative().nullable().describe("null if unlimited"),
  dataUsedGB: z.number().nonnegative().nullable().describe("null if the bill does not say"),
  overageCharges: z.number().nonnegative(),
  promoDiscount: z.number().nonnegative().nullable().describe("monthly promo credit as a positive number"),
  promoEndDate: isoDate.nullable(),
  totalDue: z.number(),
  lineItems: z.array(LineItemSchema).min(1),
});

export type Bill = z.infer<typeof BillSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;