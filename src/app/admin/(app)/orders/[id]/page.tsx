import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, pageWrap, statusTone } from "@/components/admin/parts";
import { OrderActions } from "@/components/admin/OrderActions";
import { Badge } from "@/components/ui";
import { IArrowL } from "@/components/icons";
import { nextSteps, STATUS_LABEL } from "@/domain/orders";
import { fmtDate, formatMoney, img } from "@/lib/format";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";
import { getOrder } from "@/server/services/orders";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await db();
  const [store, o] = await Promise.all([getStore(d), /^[0-9a-f-]{36}$/.test(id) ? getOrder(d, id).catch(() => null) : null]);
  if (!o) notFound();
  const fmt = (c: number) => formatMoney(c, store.currency);
  return (
    <div className={pageWrap}>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><IArrowL className="size-4" />Orders</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-5xl leading-none">{o.number}</h1><p className="mt-2 text-sm text-muted">{fmtDate(o.createdAt.getTime(), { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p></div>
        <Badge tone={statusTone[o.status]}>{STATUS_LABEL[o.status]}</Badge>
      </div>
      <OrderActions id={o.id} status={o.status} next={nextSteps(o.status)} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-line">{o.items.map(i => (
            <li key={i.id} className="flex items-center gap-3 py-3"><img src={img(i.image, 120, 150)} alt="" className="h-16 w-12 object-cover" />
              <div className="min-w-0 flex-1"><div className="font-medium">{i.name}</div><div className="text-sm text-muted">{i.color} · {i.size} · {fmt(i.unitCents)} × {i.qty}</div></div>
              <span className="tnum">{fmt(i.unitCents * i.qty)}</span></li>))}</ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{fmt(o.subtotalCents)}</dd></div>
            {o.discountCents > 0 && <div className="flex justify-between text-good"><dt>Discount ({o.discountCode})</dt><dd className="tnum">−{fmt(o.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping ({o.delivery})</dt><dd className="tnum">{o.shippingCents ? fmt(o.shippingCents) : "Free"}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tnum">{fmt(o.totalCents)}</dd></div>
          </dl>
        </Card>
        <div className="space-y-4">
          <Card><h2 className="font-semibold">Customer</h2><p className="mt-2">{o.customer.name}</p><a href={`mailto:${o.customer.email}`} className="text-sm text-muted underline underline-offset-4">{o.customer.email}</a>{o.customer.phone && <p className="text-sm text-muted">{o.customer.phone}</p>}
            <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{o.delivery === "pickup" ? "Pickup" : "Ship to"}</h3>
            {o.address ? <p className="mt-1 text-sm">{o.address.line1}{o.address.line2 && `, ${o.address.line2}`}<br />{o.address.city} {o.address.postcode}<br />{o.address.country}</p> : <p className="mt-1 text-sm">Customer collects in store</p>}
            <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Payment</h3><p className="mt-1 text-sm">{o.payment === "card" ? "Card (demo)" : "Cash on delivery"}</p></Card>
          <Card><h2 className="font-semibold">Timeline</h2>
            <ol className="mt-3 space-y-3 border-l border-line pl-4">{o.events.map(e => (
              <li key={e.id} className="relative"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-ink" />
                <div className="text-sm font-medium">{STATUS_LABEL[e.status]}</div><div className="text-xs text-muted">{fmtDate(e.at.getTime(), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{e.note && ` · ${e.note}`}</div></li>))}</ol>
            <Link href={`/order/${o.token}`} target="_blank" className="mt-4 inline-block text-sm underline underline-offset-4">Customer tracking page ↗</Link></Card>
        </div>
      </div>
    </div>
  );
}
