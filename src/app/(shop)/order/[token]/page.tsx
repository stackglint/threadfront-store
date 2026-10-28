import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { btn } from "@/components/ui";
import { ICheck } from "@/components/icons";
import { STATUS_LABEL, TRACK_STEPS } from "@/domain/orders";
import { cx, fmtDate, formatMoney, img } from "@/lib/format";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";
import { getOrderByToken } from "@/server/services/orders";

export const metadata: Metadata = { title: "Your order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const d = await db();
  const [store, o] = await Promise.all([getStore(d), getOrderByToken(d, token).catch(() => null)]);
  if (!o) notFound();
  const fmt = (c: number) => formatMoney(c, store.currency);
  const reached = new Set(o.events.map(e => e.status));
  const stepIdx = o.status === "cancelled" ? -1 : Math.max(...TRACK_STEPS.map((s, i) => (reached.has(s) || (s === "placed") ? i : -1)));
  const at = (s: string) => o.events.find(e => e.status === s)?.at;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 sm:px-6">
      {sp.new && (
        <div className="text-center">
          <div className="pop mx-auto grid size-20 place-items-center rounded-full bg-ink text-white"><ICheck className="size-10" /></div>
          <h1 className="rise mt-6 font-serif text-5xl sm:text-6xl">Thank you, {o.customer.name.split(" ")[0]}</h1>
          <p className="rise mt-3 text-muted" style={{ animationDelay: ".08s" }}>Your order <b className="text-ink">{o.number}</b> is confirmed. Demo store: no email is sent and nothing ships.</p>
        </div>
      )}
      {!sp.new && <h1 className="font-serif text-5xl">Order {o.number}</h1>}

      <section className="rise mt-10 border border-line bg-white p-6" style={{ animationDelay: ".14s" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">Order status</h2><span className="text-sm text-muted">Placed {fmtDate(o.createdAt.getTime())}</span></div>
        {o.status === "cancelled" ? <p className="mt-4 font-semibold text-sale">This order was cancelled.</p> : (
          <ol className="mt-6 grid grid-cols-4">
            {TRACK_STEPS.map((s, i) => (
              <li key={s} className="relative text-center">
                {i > 0 && <span className={cx("absolute right-1/2 top-[13px] h-0.5 w-full", i <= stepIdx ? "bg-ink" : "bg-line")} aria-hidden="true" />}
                <span className={cx("relative mx-auto grid size-7 place-items-center rounded-full border-2 text-xs", i <= stepIdx ? "border-ink bg-ink text-white" : "border-line bg-white text-muted")}>{i <= stepIdx ? <ICheck className="size-4" /> : i + 1}</span>
                <span className={cx("mt-2 block text-xs font-semibold sm:text-sm", i > stepIdx && "text-muted")}>{STATUS_LABEL[s]}</span>
                {at(s) && <span className="block text-[11px] text-muted">{fmtDate(at(s)!.getTime(), { month: "short", day: "numeric" })}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-[1.4fr_1fr]">
        <div className="border border-line bg-white p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">Items</h2>
          <ul className="mt-3 divide-y divide-line">{o.items.map(i => (
            <li key={i.id} className="flex gap-3 py-3"><img src={img(i.image, 140, 186)} alt="" className="h-20 w-16 shrink-0 object-cover" /><div className="flex-1"><div className="text-sm font-medium">{i.name}</div><div className="text-xs text-muted">{i.color} · {i.size} · Qty {i.qty}</div></div><div className="tnum text-sm">{fmt(i.unitCents * i.qty)}</div></li>
          ))}</ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{fmt(o.subtotalCents)}</dd></div>
            {o.discountCents > 0 && <div className="flex justify-between text-good"><dt>Discount ({o.discountCode})</dt><dd className="tnum">−{fmt(o.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd className="tnum">{o.shippingCents ? fmt(o.shippingCents) : "Free"}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tnum">{fmt(o.totalCents)}</dd></div>
          </dl>
        </div>
        <div className="space-y-4 border border-line bg-white p-6 text-sm">
          <div><h3 className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">Delivery</h3><p className="mt-1.5">{o.delivery === "pickup" ? "Pick up in store" : o.delivery === "express" ? "Express delivery" : "Standard delivery"}</p>
            {o.address && <p className="mt-1 text-muted">{o.address.line1}{o.address.line2 && `, ${o.address.line2}`}<br />{o.address.city} {o.address.postcode}<br />{o.address.country}</p>}</div>
          <div><h3 className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">Payment</h3><p className="mt-1.5">{o.payment === "card" ? "Card (demo, not charged)" : "Cash on delivery"}</p></div>
          <div><h3 className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">Contact</h3><p className="mt-1.5">{o.customer.name}<br /><span className="text-muted">{o.customer.email}</span></p></div>
        </div>
      </section>
      <p className="mt-6 text-center text-sm text-muted">Bookmark this page to track your order.</p>
      <div className="mt-6 text-center"><Link href="/shop" className={btn.outline}>Continue shopping</Link></div>
    </div>
  );
}
