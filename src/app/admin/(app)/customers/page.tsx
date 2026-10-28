import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { Card, PageHead, pageWrap } from "@/components/admin/parts";
import { Badge } from "@/components/ui";
import { fmtDate, formatMoney, initials } from "@/lib/format";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Customers" };
type Row = { id: string; name: string; email: string; orders: number; spent: number; last_order: string | null; first_order: string | null };

export default async function Customers() {
  const d = await db();
  const store = await getStore(d);
  const res = await d.execute(sql`
    select c.id, c.name, c.email,
      count(o.id) filter (where o.status <> 'cancelled')::int as orders,
      coalesce(sum(o.total_cents) filter (where o.status <> 'cancelled'), 0)::int as spent,
      max(o.created_at) as last_order, min(o.created_at) as first_order
    from customers c left join orders o on o.customer_id = c.id
    group by c.id having count(o.id) > 0 order by spent desc limit 200`);
  const rows = (res as unknown as { rows: Row[] }).rows;
  const fmt = (c: number) => formatMoney(c, store.currency, { compact: true });
  return (
    <div className={pageWrap}>
      <PageHead title="Customers" sub={`${rows.length} customers with orders · ranked by lifetime spend`} />
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-[.12em] text-muted">{["Customer", "Orders", "Spent", "Average", "Last order", ""].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((c, i) => (
              <tr key={c.id} className="border-b border-line/70 last:border-0 hover:bg-paper/60">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/[.06] text-xs font-semibold">{initials(c.name)}</span><div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="truncate text-xs text-muted">{c.email}</div></div></div></td>
                <td className="px-5 py-3 tnum">{c.orders}</td>
                <td className="px-5 py-3 tnum font-medium">{fmt(c.spent)}</td>
                <td className="px-5 py-3 tnum text-muted">{c.orders ? fmt(Math.round(c.spent / c.orders)) : "–"}</td>
                <td className="px-5 py-3 text-muted">{c.last_order ? fmtDate(new Date(c.last_order).getTime(), { month: "short", day: "numeric" }) : "–"}</td>
                <td className="px-5 py-3 text-right">{i < 5 ? <Badge tone="ink">VIP</Badge> : c.orders === 1 ? <Badge tone="neutral">New</Badge> : null}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
