import { describe, expect, it } from "vitest";
import { wasteFlags } from "../src/flags";
import { bill } from "./fixtures";

const today = new Date("2026-10-29T12:00:00Z");
const kinds = (b = bill(), prev?: ReturnType<typeof bill>) => wasteFlags(b, today, prev).map((f) => f.kind);

describe("wasteFlags", () => {
  it("flags a promo ending soon with the day count", () => {
    const f = wasteFlags(bill(), today).find((x) => x.kind === "promo_ending");
    expect(f?.message).toContain("23 days");
  });

  it("ignores promos that end far away", () => {
    expect(kinds(bill({ promoEndDate: "2027-06-01" }))).not.toContain("promo_ending");
  });

  it("flags low data usage", () => {
    expect(kinds()).toContain("low_usage");
    expect(kinds(bill({ dataUsedGB: 40 }))).not.toContain("low_usage");
  });

  it("tells one-off overage apart from repeat overage", () => {
    expect(kinds(bill({ overageCharges: 20 }))).toContain("overage");
    expect(kinds(bill({ overageCharges: 20 }), bill({ overageCharges: 10 }))).toContain("repeat_overage");
  });
});