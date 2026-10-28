"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDiscountAction, toggleDiscountAction } from "@/server/actions/admin";
import { cx, formatMoney } from "@/lib/format";
import { field } from "../ui";

type Row = { id: string; code: string; kind: "percent" | "fixed"; value: number; minSpendCents: number; usageLimit: number | null; used: number; active: boolean };

export function Discounts({ rows, currency }: { rows: Row[]; currency: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ code: "", kind: "percent" as "percent" | "fixed", value: "15", min: "0", limit: "" });
  const [err, setErr] = useState<string | null>(null);
  const fmt = (c: number) => formatMoney(c, currency, { compact: true });
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createDiscountAction({ code: f.code, kind: f.kind, value: f.kind === "percent" ? parseInt(f.value) : Math.round(parseFloat(f.value) * 100), minSpendCents: Math.round((parseFloat(f.min) || 0) * 100), usageLimit: f.limit ? parseInt(f.limit) : null });
      if (r.ok) { setErr(null); setF({ ...f, code: "" }); router.refresh(); } else setErr(r.error);
    });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-2">
        {rows.map(d => (
          <div key={d.id} className={cx("rise flex flex-wrap items-center gap-4 border border-line bg-white p-4", !d.active && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-lg font-semibold tracking-wider">{d.code}</div>
              <div className="text-sm text-muted">{d.kind === "percent" ? `${d.value}% off` : `${fmt(d.value)} off`}{d.minSpendCents ? ` · min spend ${fmt(d.minSpendCents)}` : ""}</div>
            </div>
            <div className="text-right text-sm"><div className="tnum font-medium">{d.used}{d.usageLimit ? ` / ${d.usageLimit}` : ""}</div><div className="text-xs text-muted">uses</div></div>
            {d.usageLimit && <div className="hidden h-1.5 w-24 bg-ink/10 sm:block"><div className="h-full bg-clay" style={{ width: `${Math.min(100, (d.used / d.usageLimit) * 100)}%` }} /></div>}
            <button type="button" disabled={pending} onClick={() => start(async () => { await toggleDiscountAction(d.id, !d.active); router.refresh(); })}
              className={cx("h-9 px-3 text-xs font-semibold uppercase tracking-[.12em]", d.active ? "bg-good/10 text-good" : "bg-ink/[.06] text-muted")}>{d.active ? "Active" : "Paused"}</button>
          </div>
        ))}
      </div>
      <form onSubmit={create} className="h-fit space-y-3 border border-line bg-white p-5">
        <h2 className="font-semibold">New code</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">Code</span><input required value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="AUTUMN15" className={field + " font-mono uppercase"} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="mb-1 block text-sm font-medium">Type</span><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as "percent" | "fixed" })} className={field}><option value="percent">Percent</option><option value="fixed">Amount</option></select></label>
          <label><span className="mb-1 block text-sm font-medium">{f.kind === "percent" ? "Percent" : "Amount"}</span><input required inputMode="decimal" value={f.value} onChange={e => setF({ ...f, value: e.target.value.replace(/[^0-9.]/g, "") })} className={field} /></label>
          <label><span className="mb-1 block text-sm font-medium">Min spend</span><input inputMode="decimal" value={f.min} onChange={e => setF({ ...f, min: e.target.value.replace(/[^0-9.]/g, "") })} className={field} /></label>
          <label><span className="mb-1 block text-sm font-medium">Usage limit</span><input inputMode="numeric" placeholder="None" value={f.limit} onChange={e => setF({ ...f, limit: e.target.value.replace(/\D/g, "") })} className={field} /></label>
        </div>
        {err && <p role="alert" className="text-sm font-medium text-sale">{err}</p>}
        <button disabled={pending} className="h-11 w-full bg-ink text-[13px] font-semibold uppercase tracking-[.12em] text-white hover:bg-clay disabled:opacity-50">Create code</button>
      </form>
    </div>
  );
}
