import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BillSchema, type Bill } from "./schema";

export const MODEL = process.env.FINEPRINT_MODEL ?? "claude-sonnet-5-5";

const SYSTEM = `You read redacted Canadian phone bills and return structured data with the save_bill tool.
- Amounts are CAD numbers with no $ sign. Credits and discounts are negative line items.
- monthlyPlanPrice is the base plan price before discounts and tax.
- dataCapGB is null for unlimited plans. dataUsedGB is null if the bill doesn't say.
- promoDiscount is the monthly promo credit as a positive number. promoEndDate is YYYY-MM-DD. Both null if there is no promo.
- Every line item gets one plain-English explanation for a university student, max 25 words.
- Never invent values. Missing fields are null (overageCharges is 0).`;

// zod 4 can emit json schema directly, the api just doesn't want the $schema key
const { $schema: _ignored, ...billJsonSchema } = z.toJSONSchema(BillSchema) as Record<string, unknown>;

export class ExtractionError extends Error {}

type Client = Pick<Anthropic, "messages">;

export async function extractBill(billText: string, client: Client = new Anthropic()): Promise<Bill> {
  let lastError = "";

  // one retry with the validation error fed back, then give up and let the ui show manual entry
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = attempt === 0 ? billText : `${billText}\n\nYour last answer failed validation: ${lastError}\nFix it.`;
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [{ name: "save_bill", description: "Save the parsed bill", input_schema: billJsonSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "save_bill" },
      messages: [{ role: "user", content }],
    });

    const block = res.content.find((b) => b.type === "tool_use");
    const parsed = BillSchema.safeParse(block && block.type === "tool_use" ? block.input : null);
    if (parsed.success) return parsed.data;
    lastError = parsed.error.message.slice(0, 800);
  }

  throw new ExtractionError("couldn't read this bill");
}