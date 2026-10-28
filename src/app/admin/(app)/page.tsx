import type { Metadata } from "next";
import Link from "next/link";
import { Card, Delta, PageHead, pageWrap, statusTone } from "@/components/admin/parts";
import { Badge } from "@/components/ui";
import { STATUS_LABEL } from "@/domain/orders";
import { fmtDate, formatMoney, img } from "@/lib/format";
import { db } from "@/server/db/client";
import { nowMs } from "@/server/clock";
import { dashboard } from "@/server/services/stats";

export const metadata: Metadata = { title: "Overview" };

export default async function Overview() {
  const s = await dashboard(await db(), nowMs());
  const cur = s.store.currency, fmt = (c: number) => formatMoney(c, cur, { compact: true });
  const max = Math.max(1, ...s.days.map(d => d.revenue));
  return (
    <div className={pageWrap}>
      <PageHead title="Overview" sub="Last 30 days compared with the 30 days before">
        <Link href="/admin/orders?status=open" className="inline-flex h-10 items-center bg-ink px-4 text-[13px] font-semibold uppercase tracking-[.12em] text-white hover:bg-clay">{s.toFulfil} to fulfil</Link>
      </PageHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Revenue", fmt(s.revenue), <Delta key="r" v={s.revenueChange} label=" vs prior 30" />],
          ["Orders", String(s.orders), <Delta key="o" v={s.ordersChange} label=" vs prior 30" />],
          ["Average order", fmt(s.aov), <Delta key="a" v={s.aovPrev ? (s.aov - s.aovPrev) / s.aovPrev : null} label=" vs prior 30" />],
          ["Today", fmt(s.todayRevenue), <span key="t" className="text-xs text-muted">{s.todayOrders} orders · {s.units} units in 30 days</span>],
        ].map(([l, v, d], i) => (
          <Card key={i} className="rise"><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{l as string}</div><div className="mt-2 font-serif text-4xl tnum">{v as string}</div><div className="mt-1.5">{d}</div></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card className="rise">
          <div className="flex items-baseline justify-between"><h2 className="font-semibold">Revenue · last 14 days</h2><span className="text-sm text-muted">{fmt(s.days.reduce((a, d) => a + d.revenue, 0))}</span></div>
          <div className="mt-6 flex h-[220px] items-end gap-1.5 sm:gap-2" role="img" aria-label="Daily revenue for the last 14 days">
            {s.days.map((d, i) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="grow-y w-full bg-ink transition group-hover:bg-clay" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%`, animationDelay: `${i * 35}ms`, opacity: i === 13 ? 1 : 0.8 }} />
                <div className="mt-2 text-center text-[10px] text-muted">{fmtDate(d.day, { day: "numeric" })}</div>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap bg-ink px-2.5 py-1.5 text-xs text-white group-hover:block">{fmtDate(d.day, { weekday: "short", month: "short", day: "numeric" })}: {fmt(d.revenue)} · {d.orders} orders</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rise">
          <div className="flex items-baseline justify-between"><h2 className="font-semibold">Low stock</h2><Link href="/admin/products" className="text-sm underline underline-offset-4">Restock</Link></div>
          <p className="text-sm text-muted">{s.store.lowStockAt} or fewer left</p>
          <ul className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {s.lowStock.slice(0, 12).map(v => (
              <li key={v.variantId} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{v.product} <span className="text-muted">· {v.color} · {v.size}</span></span>
                <Badge tone={v.stock === 0 ? "sale" : "warn"}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="rise">
          <h2 className="font-semibold">Best sellers · 30 days</h2>
          <ul className="mt-4 space-y-3">
            {s.top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={img(p.image, 80, 100)} alt="" className="h-12 w-10 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{p.name}</span><span className="tnum">{fmt(p.revenue)}</span></div>
                  <div className="mt-1.5 flex items-center gap-2"><div className="h-1 flex-1 bg-ink/10"><div className="grow-x h-full bg-clay" style={{ width: `${(p.revenue / (s.top[0]?.revenue || 1)) * 100}%`, animationDelay: `${i * 60}ms` }} /></div><span className="w-14 text-right text-xs text-muted">{p.units} sold</span></div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="rise !p-0">
          <div className="flex items-baseline justify-between p-5 pb-2 sm:p-6 sm:pb-2"><h2 className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-sm underline underline-offset-4">All orders</Link></div>
          <ul className="divide-y divide-line">
            {s.recent.map(o => (
              <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-paper sm:px-6">
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">{o.number} · {o.customer.name}</div><div className="text-xs text-muted">{fmtDate(o.createdAt.getTime(), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {o.items.reduce((a, i) => a + i.qty, 0)} items</div></div>
                <Badge tone={statusTone[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                <span className="w-20 text-right text-sm tnum">{fmt(o.totalCents)}</span>
              </Link></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
