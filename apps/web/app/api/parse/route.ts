import { NextResponse } from "next/server";
import { BillSchema, matchPlans, redact, wasteFlags, type Bill } from "@fineprint/core";
import { extractBill } from "@fineprint/core/extract";
import { getPlans, logParse } from "@/lib/db";

export const maxDuration = 60;

const Manual = BillSchema.pick({ monthlyPlanPrice: true, dataCapGB: true, dataUsedGB: true });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const source = body?.source === "mobile" ? "mobile" : "web";
  let bill: Bill;

  if (typeof body?.text === "string") {
    if (body.text.length > 20_000) return NextResponse.json({ error: "too long" }, { status: 413 });
    try {
      // redact again on the server, never trust that the client did it
      bill = await extractBill(redact(body.text));
    } catch {
      return NextResponse.json({ error: "manual" }, { status: 422 });
    }
  } else {
    const m = Manual.safeParse(body?.manual);
    if (!m.success) return NextResponse.json({ error: "bad input" }, { status: 400 });
    bill = {
      carrier: "Your carrier",
      planName: "Your plan",
      ...m.data,
      overageCharges: 0,
      promoDiscount: null,
      promoEndDate: null,
      totalDue: m.data.monthlyPlanPrice,
      lineItems: [{ description: "Plan", amount: m.data.monthlyPlanPrice, category: "plan", explanation: "What you told us you pay each month." }],
    };
  }

  const flags = wasteFlags(bill);
  const matches = matchPlans(bill, await getPlans());

  // stats are nice to have, never block the user on them
  await logParse(source, matches[0]?.savingsPerYear ?? null, flags.length).catch(() => {});

  return NextResponse.json({ bill, flags, matches });
}