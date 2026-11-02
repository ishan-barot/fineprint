"use client";

import { useState } from "react";
import type { Bill, PlanMatch, WasteFlag } from "@fineprint/core";
import { readBillText } from "@/lib/readBill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Result = { bill: Bill; flags: WasteFlag[]; matches: PlanMatch[] };
type Manual = { monthlyPlanPrice: number; dataCapGB: number | null; dataUsedGB: number | null };
type State =
  | { step: "idle" }
  | { step: "reading" }
  | { step: "parsing" }
  | { step: "done"; result: Result }
  | { step: "manual"; reason: string }
  | { step: "error"; message: string };

const TAG: Record<string, string> = { plan: "plan", fee: "fee", overage: "overage", add_on: "add-on", promo_credit: "promo", tax: "tax", device: "device", other: "other" };
const cad = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

export default function Home() {
  const [state, setState] = useState<State>({ step: "idle" });

  async function send(payload: object) {
    setState({ step: "parsing" });
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, source: "web" }),
    });
    if (res.status === 422) return setState({ step: "manual", reason: "We couldn't read that bill. Enter the basics instead." });
    if (!res.ok) return setState({ step: "error", message: "Something broke on our end. Try again." });
    setState({ step: "done", result: await res.json() });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState({ step: "reading" });
    try {
      const text = await readBillText(file);
      if (text.trim().length < 40) return setState({ step: "manual", reason: "That file didn't have readable text." });
      await send({ text });
    } catch {
      setState({ step: "manual", reason: "We couldn't open that file. Enter the basics instead." });
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Fineprint</h1>
        <p className="text-muted-foreground">Upload a phone bill. See every charge in plain English and find a cheaper plan.</p>
      </header>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <label htmlFor="bill" className="block font-medium">Your bill (PDF, screenshot or .txt)</label>
          <input
            id="bill"
            type="file"
            accept="application/pdf,image/*,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
          />
          <p className="text-xs text-muted-foreground">Read on your device. Account and phone numbers are masked before anything is sent. Nothing is stored.</p>
        </CardContent>
      </Card>

      {state.step === "idle" && <p className="text-center text-muted-foreground">No bill yet. Drop one in above.</p>}
      {state.step === "reading" && <p role="status">Reading your bill on this device...</p>}
      {state.step === "parsing" && <p role="status">Decoding charges...</p>}
      {state.step === "error" && <p role="alert" className="text-destructive">{state.message}</p>}
      {state.step === "manual" && <ManualForm reason={state.reason} onSubmit={(manual) => send({ manual })} />}
      {state.step === "done" && <Results result={state.result} />}
    </main>
  );
}

function Results({ result }: { result: Result }) {
  const { bill, flags, matches } = result;
  return (
    <div className="space-y-6">
      {flags.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Heads up</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {flags.map((f) => (
                <li key={f.kind} className="flex items-start gap-2"><Badge variant="destructive">!</Badge><span>{f.message}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{bill.carrier} · {bill.planName}</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y">
            {bill.lineItems.map((li, i) => (
              <li key={i} className="py-3">
                <div className="flex justify-between gap-4"><span className="font-medium">{li.description}</span><span className="tabular-nums">{cad(li.amount)}</span></div>
                <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><Badge variant="secondary">{TAG[li.category]}</Badge><span>{li.explanation}</span></div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between font-bold"><span>Total</span><span>{cad(bill.totalDue)}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cheaper plans that fit your usage</CardTitle></CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-muted-foreground">You&apos;re already on a good deal. Nothing cheaper fits your usage.</p>
          ) : (
            <ul className="space-y-3">
              {matches.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4">
                  <div>
                    <a href={p.url} target="_blank" rel="noreferrer" className="font-medium underline">{p.carrier} {p.name}</a>
                    <p className="text-sm text-muted-foreground">{cad(p.monthlyPrice)}/mo · {p.dataGB === null ? "Unlimited" : `${p.dataGB} GB`} · checked {p.lastVerified}</p>
                  </div>
                  <Badge>Save {cad(p.savingsPerYear)}/yr</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ManualForm({ reason, onSubmit }: { reason: string; onSubmit: (m: Manual) => void }) {
  const [price, setPrice] = useState("");
  const [cap, setCap] = useState("");
  const [used, setUsed] = useState("");
  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  return (
    <Card>
      <CardHeader><CardTitle>Enter the basics</CardTitle></CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{reason}</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ monthlyPlanPrice: Number(price), dataCapGB: num(cap), dataUsedGB: num(used) });
          }}
        >
          <label className="block text-sm">Monthly plan price ($)<Input required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
          <label className="block text-sm">Data cap in GB (blank = unlimited)<Input inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} /></label>
          <label className="block text-sm">Data used last month in GB<Input inputMode="decimal" value={used} onChange={(e) => setUsed(e.target.value)} /></label>
          <Button type="submit">Find cheaper plans</Button>
        </form>
      </CardContent>
    </Card>
  );
}