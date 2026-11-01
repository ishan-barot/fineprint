import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// fictional carriers only, no real brands in test data
const CARRIERS = ["Maplewave Mobile", "Northpeak Wireless", "Lakeshore Cellular", "Boreal Telecom"];
const PLANS = [
  { name: "Basic 10", price: 34, cap: 10 },
  { name: "Student 25", price: 39, cap: 25 },
  { name: "Plus 50", price: 55, cap: 50 },
  { name: "Max 100", price: 75, cap: 100 },
  { name: "Unlimited Edge", price: 85, cap: null as number | null },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// tiny seeded rng so the exact same 50 bills come out every run
let seed = 20261029;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const r2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
const money = (n: number) => (n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`);
const human = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };

mkdirSync(join(here, "bills"), { recursive: true });
mkdirSync(join(here, "truth"), { recursive: true });

for (let i = 1; i <= 50; i++) {
  const carrier = pick(CARRIERS);
  const plan = pick(PLANS);
  const used = r2(rand() * (plan.cap ?? 60) * 1.3);
  const overGB = plan.cap === null ? 0 : Math.max(0, used - plan.cap);
  const overage = r2(Math.ceil(overGB) * 10);
  const promo = rand() < 0.5 ? pick([5, 10, 15]) : null;
  const promoEnd = promo ? `2026-${pad(pick([11, 12]))}-${pad(1 + Math.floor(rand() * 28))}` : null;
  const fee = pick([0, 2.5, 4.99]);
  const addOn = rand() < 0.3 ? 5 : 0;
  const subtotal = plan.price + overage + fee + addOn - (promo ?? 0);
  const tax = r2(subtotal * 0.13);
  const total = r2(subtotal + tax);

  const lines: [string, number][] = [[`${plan.name} plan`, plan.price]];
  if (promo && promoEnd) lines.push([`Promo credit (ends ${human(promoEnd)})`, -promo]);
  if (fee) lines.push(["System access fee", fee]);
  if (addOn) lines.push(["Visual Voicemail add-on", addOn]);
  if (overage) lines.push([`Data overage ${Math.ceil(overGB)} GB`, overage]);
  lines.push(["HST 13%", tax]);

  // fake account + phone so the redaction path gets exercised too
  const acct = `${1000 + Math.floor(rand() * 8999)}-${1000 + Math.floor(rand() * 8999)}-${10 + Math.floor(rand() * 89)}`;
  const phone = `416-555-${pad(Math.floor(rand() * 99))}${pad(Math.floor(rand() * 99))}`;
  const cap = plan.cap === null ? "Unlimited" : `${plan.cap} GB`;

  const layouts = [
    [carrier.toUpperCase(), `Account number: ${acct}`, `Mobile: ${phone}`, "Billing period: Oct 1 - Oct 31, 2026", "",
      `YOUR PLAN: ${plan.name} (${cap} data)`, `Data used: ${used} GB`, "",
      ...lines.map(([d, a]) => `${d.padEnd(42, ".")} ${money(a)}`), "", `TOTAL DUE ${money(total)}`],
    [`${carrier} | Monthly Statement`, `Acct # ${acct}   Line ${phone}`, `Rate plan - ${plan.name}`, `Included data - ${cap}`,
      `Usage this period - ${used} GB`, "", "Description,Amount", ...lines.map(([d, a]) => `${d},${a.toFixed(2)}`), "",
      `Amount owing,${total.toFixed(2)}`],
    [`Hi there, here's your ${carrier} bill for October 2026.`, `Customer no. ${acct}. Your number: ${phone}.`,
      `You're on ${plan.name}, which includes ${cap} of data. You used ${used} GB.`, "",
      ...lines.map(([d, a]) => `- ${d}: ${money(a)}`), "", `Please pay ${money(total)} by Nov 20, 2026.`],
  ];
  const text = layouts[i % 3].join("\n");

  const truth = {
    carrier, planName: plan.name, monthlyPlanPrice: plan.price, dataCapGB: plan.cap, dataUsedGB: used,
    overageCharges: overage, promoDiscount: promo, promoEndDate: promoEnd, totalDue: total, lineItemCount: lines.length,
  };
  const id = `bill-${pad(i)}`;
  writeFileSync(join(here, "bills", `${id}.txt`), text);
  writeFileSync(join(here, "truth", `${id}.json`), JSON.stringify(truth, null, 2));
}

console.log("wrote 50 bills + 50 truth files");