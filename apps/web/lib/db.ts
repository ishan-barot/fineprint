import { neon } from "@neondatabase/serverless";
import type { Plan } from "@fineprint/core";

// created per call so the build doesn't crash when the env var isn't there yet
const db = () => neon(process.env.DATABASE_URL!);

export async function getPlans(): Promise<Plan[]> {
  const rows = await db()`select id, carrier, name, monthly_price, data_gb, network, url, last_verified from plans`;
  return rows.map((r) => ({
    id: r.id,
    carrier: r.carrier,
    name: r.name,
    monthlyPrice: Number(r.monthly_price),
    dataGB: r.data_gb === null ? null : Number(r.data_gb),
    network: r.network,
    url: r.url,
    lastVerified: new Date(r.last_verified).toISOString().slice(0, 10),
  }));
}

export async function logParse(source: string, savingsPerYear: number | null, flagCount: number) {
  await db()`insert into parse_events (source, savings_per_year, flag_count) values (${source}, ${savingsPerYear}, ${flagCount})`;
}