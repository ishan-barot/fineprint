import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Bill, PlanMatch, WasteFlag } from "@fineprint/core";

export type Result = { bill: Bill; flags: WasteFlag[]; matches: PlanMatch[] };
export type SavedBill = Result & { id: string; savedAt: string };

const ONBOARDED = "fineprint:onboarded";
const HISTORY = "fineprint:history";

// past bills live only on this phone, nothing is stored on our server
export async function isOnboarded() {
  return (await AsyncStorage.getItem(ONBOARDED)) === "1";
}

export async function setOnboarded() {
  await AsyncStorage.setItem(ONBOARDED, "1");
}

export async function listBills(): Promise<SavedBill[]> {
  const raw = await AsyncStorage.getItem(HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBill(result: Result): Promise<SavedBill> {
  const saved = { ...result, id: Date.now().toString(), savedAt: new Date().toISOString() };
  // keep the last 20 so storage never grows forever
  const all = [saved, ...(await listBills())].slice(0, 20);
  await AsyncStorage.setItem(HISTORY, JSON.stringify(all));
  return saved;
}

export async function getBill(id: string) {
  return (await listBills()).find((b) => b.id === id) ?? null;
}