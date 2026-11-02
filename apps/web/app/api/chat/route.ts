import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { BillSchema } from "@fineprint/core";
import { MODEL } from "@fineprint/core/extract";

const client = new Anthropic();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const bill = BillSchema.safeParse(body?.bill);
  const question = typeof body?.question === "string" ? body.question.slice(0, 500) : "";
  if (!bill.success || !question) return NextResponse.json({ error: "bad input" }, { status: 400 });

  // flags and plan matches give it enough context to answer "should i switch"
  const context = { bill: bill.data, flags: body?.flags ?? [], cheaperPlans: body?.matches ?? [] };

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You answer questions about one phone bill and the cheaper plans we found for it, given as JSON below. Use only that JSON.
If the question isn't about this bill, its charges, or these cheaper plans, reply exactly: "I can only answer questions about this bill."
Write plain text only: no markdown, no asterisks, no headings. Use short sentences a student understands. Under 120 words.
When comparing plans, only compare the plans listed in cheaperPlans, and remind them prices were checked on the date shown.

<context>${JSON.stringify(context)}</context>`,
      messages: [{ role: "user", content: question }],
    });
    const answer = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return NextResponse.json({ answer });
  } catch (e) {
    // log the real reason in the terminal, show a friendly one in the ui
    console.error("chat failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "chat failed" }, { status: 502 });
  }
}