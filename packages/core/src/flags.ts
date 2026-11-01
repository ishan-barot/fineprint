import type { Bill } from "./schema";

export type WasteFlag = {
  kind: "promo_ending" | "low_usage" | "overage" | "repeat_overage";
  message: string;
  extraPerYear: number | null;
};

const DAY = 86_400_000;

export function wasteFlags(bill: Bill, today = new Date(), previous?: Bill): WasteFlag[] {
  const flags: WasteFlag[] = [];

  if (bill.promoEndDate && bill.promoDiscount) {
    const days = Math.ceil((Date.parse(bill.promoEndDate) - today.getTime()) / DAY);
    if (days >= 0 && days <= 60) {
      flags.push({
        kind: "promo_ending",
        message: `Promo ends in ${days} days → bill jumps $${bill.promoDiscount.toFixed(2)}`,
        extraPerYear: bill.promoDiscount * 12,
      });
    }
  }

  if (bill.dataCapGB && bill.dataUsedGB !== null && bill.dataUsedGB / bill.dataCapGB < 0.25) {
    flags.push({
      kind: "low_usage",
      message: `You used ${bill.dataUsedGB} GB of a ${bill.dataCapGB} GB plan`,
      extraPerYear: null,
    });
  }

  if (bill.overageCharges > 0) {
    const repeat = (previous?.overageCharges ?? 0) > 0;
    flags.push({
      kind: repeat ? "repeat_overage" : "overage",
      message: repeat ? "Overage charges 2 months in a row" : `$${bill.overageCharges.toFixed(2)} in overage charges this month`,
      extraPerYear: bill.overageCharges * 12,
    });
  }

  return flags;
}