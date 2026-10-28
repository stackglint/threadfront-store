"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatusAction } from "@/server/actions/admin";
import { STATUS_LABEL, type OrderStatus } from "@/domain/orders";
import { cx } from "@/lib/format";

const VERB: Partial<Record<OrderStatus, string>> = { paid: "Mark paid", packed: "Mark packed", shipped: "Mark shipped", delivered: "Mark delivered", cancelled: "Cancel order" };

export function OrderActions({ id, status, next }: { id: string; status: OrderStatus; next: OrderStatus[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!next.length) return <p className="text-sm text-muted">This order is {STATUS_LABEL[status].toLowerCase()}. No further steps.</p>;
  const go = (to: OrderStatus) => {
    if (to === "cancelled" && !confirm) { setConfirm(true); return; }
    setConfirm(false);
    start(async () => { const r = await setOrderStatusAction(id, to); if (r.ok) { setErr(null); router.refresh(); } else setErr(r.error); });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {next.map(to => (
        <button key={to} type="button" disabled={pending} onClick={() => go(to)}
          className={cx("h-11 px-5 text-[13px] font-semibold uppercase tracking-[.12em] transition disabled:opacity-50", to === "cancelled" ? (confirm ? "bg-sale text-white" : "border border-sale/40 text-sale hover:bg-sale/5") : "bg-ink text-white hover:bg-clay")}>
          {to === "cancelled" && confirm ? "Confirm cancel (restocks items)" : VERB[to]}
        </button>
      ))}
      {err && <span role="alert" className="text-sm font-medium text-sale">{err}</span>}
    </div>
  );
}
