import { redact } from "@fineprint/core";
import type { Result } from "./storage";

// .env is gitignored so cloud builds won't see it, the public url is the fallback
const API = process.env.EXPO_PUBLIC_API_URL ?? "https://fineprint-flame.vercel.app";

export async function parseBill(text: string): Promise<Result> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/parse`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: redact(text), source: "mobile" }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  if (res.status === 422) throw new Error("We couldn't read that bill. Try a clearer, flatter photo.");
  // status code on screen makes server problems easy to debug
  if (!res.ok) throw new Error(`Server error (${res.status}). Try again in a bit.`);
  return res.json();
}