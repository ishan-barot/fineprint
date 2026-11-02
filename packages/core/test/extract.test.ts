import { describe, expect, it, vi } from "vitest";
import { extractBill, ExtractionError } from "../src/extract";
import { bill } from "./fixtures";

const reply = (input: unknown) => ({ content: [{ type: "tool_use", id: "t1", name: "save_bill", input }] });
const client = (create: ReturnType<typeof vi.fn>) => ({ messages: { create } }) as never;

describe("extractBill", () => {
  it("returns a validated bill", async () => {
    const create = vi.fn().mockResolvedValue(reply(bill()));
    expect((await extractBill("text", client(create))).planName).toBe("Plus 50");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries once with the validation error fed back", async () => {
    const create = vi.fn().mockResolvedValueOnce(reply({ nope: true })).mockResolvedValueOnce(reply(bill()));
    await extractBill("text", client(create));
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages[0].content).toContain("failed validation");
  });

  it("gives up after two bad answers", async () => {
    const create = vi.fn().mockResolvedValue(reply({ nope: true }));
    await expect(extractBill("text", client(create))).rejects.toBeInstanceOf(ExtractionError);
  });
});