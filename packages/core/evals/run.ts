import { appendFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { redact } from "../src/redact";
import { extractBill, MODEL } from "../src/extract";
import type { Bill } from "../src/schema";

const here = dirname(fileURLToPath(import.meta.url));
const FIELDS = ["carrier", "planName", "monthlyPlanPrice", "dataCapGB", "dataUsedGB", "overageCharges",
  "promoDiscount", "promoEndDate", "totalDue", "lineItemCount"];
const MIN_ACCURACY = Number(process.env.EVAL_MIN ?? 0.9);
const LIMIT = Number(process.env.EVAL_LIMIT ?? 50);

const norm = (v: unknown) => (typeof v === "string" ? v.toLowerCase().replace(/[^a-z0-9]/g, "") : v);

// numbers match within 2 cents, strings match after lowercasing and stripping punctuation
function same(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 0.02;
  const x = norm(a), y = norm(b);
  if (typeof x === "string" && typeof y === "string") return x === y || x.includes(y) || y.includes(x);
  return x === y;
}

const ids = readdirSync(join(here, "bills")).filter((f) => f.endsWith(".txt")).sort().slice(0, LIMIT).map((f) => f.replace(".txt", ""));
const hits: Record<string, number> = Object.fromEntries(FIELDS.map((f) => [f, 0]));
const failures: { id: string; field: string; expected: unknown; got: unknown }[] = [];
let crashed = 0;

async function runOne(id: string) {
  const text = redact(readFileSync(join(here, "bills", `${id}.txt`), "utf8"));
  const truth = JSON.parse(readFileSync(join(here, "truth", `${id}.json`), "utf8"));
  let bill: Bill;
  try {
    bill = await extractBill(text);
  } catch (e) {
    crashed++;
    // print the real reason so failures aren't a mystery
    console.error(id, e instanceof Error ? e.message : e);
    return;
  }
  const got: Record<string, unknown> = { ...bill, lineItemCount: bill.lineItems.length };
  for (const f of FIELDS) {
    if (same(got[f], truth[f])) hits[f]++;
    else failures.push({ id, field: f, expected: truth[f], got: got[f] });
  }
}

// 5 at a time so we stay under rate limits
for (let i = 0; i < ids.length; i += 5) await Promise.all(ids.slice(i, i + 5).map(runOne));

const total = ids.length * FIELDS.length;
const correct = Object.values(hits).reduce((a, b) => a + b, 0);
const accuracy = correct / total;
const perField = Object.fromEntries(FIELDS.map((f) => [f, Number((hits[f] / ids.length).toFixed(3))]));
const report = { model: MODEL, bills: ids.length, crashed, accuracy: Number(accuracy.toFixed(4)), perField, failures, ranAt: new Date().toISOString() };

mkdirSync(join(here, "results"), { recursive: true });
writeFileSync(join(here, "results", "latest.json"), JSON.stringify(report, null, 2));

console.table(perField);
const line = `model ${MODEL}: ${(accuracy * 100).toFixed(1)}% field accuracy (${correct}/${total}), ${crashed} crashed`;
console.log(line);

// shows up on the github actions run page
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Eval\n${line}\n`);

if (accuracy < MIN_ACCURACY) {
  console.error(`below the ${MIN_ACCURACY * 100}% gate`);
  process.exit(1);
}