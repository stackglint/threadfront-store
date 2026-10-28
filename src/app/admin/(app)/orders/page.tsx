import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHead, pageWrap, statusTone } from "@/components/admin/parts";
import { Badge, field } from "@/components/ui";
import { ISearch } from "@/components/icons";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/domain/orders";
import { cx, fmtDate, formatMoney } from "@/lib/format";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";
import { listOrders } from "@/server/services/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = sp.status === "open" ? "open" : (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as OrderStatus) : "all";
  const q = (sp.q ?? "").slice(0, 60);
  const d = await db();
  const [store, rows] = await Promise.all([getStore(d), listOrders(d, { status, q })]);
  const fmt = (c: number) => formatMoney(c, store.currency);
  const tabs: [string, string][] = [["all", "All"], ["open", "To fulfil"], ...ORDER_STATUSES.map(s => [s, STATUS_LABEL[s]] as [string, string])];
  return (
    <div className={pageWrap}>
      <PageHead title="Orders" sub={`${rows.length}${rows.length === 150 ? "+" : ""} shown`} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto">
          {tabs.map(([k, l]) => <Link key={k} href={`?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cx("h-9 shrink-0 px-3.5 text-sm font-medium leading-9 transition", status === k ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>{l}</Link>)}
        </div>
        <form className="relative ml-auto w-full sm:w-72"><input type="hidden" name="status" value={status} /><label htmlFor="oq" className="sr-only">Search orders</label>
          <ISearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><input id="oq" name="q" defaultValue={q} placeholder="Order no., name, email, product" className={field + " h-10 pl-10 text-sm"} /></form>
      </div>
      <Card className="!p-0 overflow-hidden">
        {!rows.length ? <p className="p-8 text-center text-sm text-muted">No orders match.</p> : (<>
          <table className="hidden w-full text-sm md:table">
            <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-[.12em] text-muted">{["Order", "Date", "Customer", "Items", "Delivery", "Total", "Status"].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map(o => (
              <tr key={o.id} className="border-b border-line/70 last:border-0 hover:bg-paper/60">
                <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-clay">{o.number}</Link></td>
                <td className="px-5 py-3 text-muted">{fmtDate(o.createdAt.getTime(), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                <td className="px-5 py-3"><div className="font-medium">{o.customer.name}</div><div className="text-xs text-muted">{o.customer.email}</div></td>
                <td className="px-5 py-3 tnum">{o.items.reduce((a, i) => a + i.qty, 0)}</td>
                <td className="px-5 py-3 capitalize">{o.delivery} · {o.payment === "cod" ? "COD" : "Card"}</td>
                <td className="px-5 py-3 tnum font-medium">{fmt(o.totalCents)}</td>
                <td className="px-5 py-3"><Badge tone={statusTone[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
              </tr>))}</tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">{rows.map(o => (
            <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0"><div className="font-semibold">{o.number}</div><div className="truncate text-sm text-muted">{o.customer.name} · {fmt(o.totalCents)}</div></div>
              <Badge tone={statusTone[o.status]}>{STATUS_LABEL[o.status]}</Badge></Link></li>))}</ul>
        </>)}
      </Card>
    </div>
  );
}
