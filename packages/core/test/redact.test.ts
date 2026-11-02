import { describe, expect, it } from "vitest";
import { redact } from "../src/redact";

describe("redact", () => {
  it("masks labeled account numbers", () => {
    const out = redact("Account number: 8841-2290-17");
    expect(out).not.toMatch(/8841/);
    expect(out).toContain("[ACCOUNT]");
  });

  it("masks phone numbers in common formats", () => {
    for (const p of ["416-555-0142", "(416) 555-0142", "+1 416 555 0142"]) {
      expect(redact(`call ${p}`)).toBe("call [PHONE]");
    }
  });

  it("masks emails and postal codes", () => {
    expect(redact("me@example.com M5B 2K3")).toBe("[EMAIL] [POSTAL]");
  });

  it("leaves money and dates alone", () => {
    expect(redact("Total $45.20 due 2026-11-20")).toBe("Total $45.20 due 2026-11-20");
  });
});