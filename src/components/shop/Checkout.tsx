"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrderAction } from "@/server/actions/shop";
import { cx, formatMoney, img } from "@/lib/format";
import { useBag, useQuote } from "./Bag";
import { btn, field } from "../ui";
import { ICheck, IShield } from "../icons";

type Delivery = "standard" | "express" | "pickup";

function Label({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
}

export function Checkout({ currency, shipping, express, freeOver }: { currency: string; shipping: number; express: number; freeOver: number }) {
  const { lines, clear, ready } = useBag();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [payment, setPayment] = useState<"card" | "cod">("card");
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", line2: "", city: "", postcode: "", country: "United States" });
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", exp: "12/30", cvc: "123" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { data, loading } = useQuote(lines, delivery, code);
  const fmt = (c: number) => formatMoney(c, currency);
  const q = data?.quote;
  const items = data?.items ?? [];
  const blocked = items.some(i => !i.available);

  if (ready && lines.length === 0) return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-5xl">Your bag is empty</h1><Link href="/shop" className={btn.primary + " mt-8"}>Continue shopping</Link></div>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q) return;
    setError(null);
    start(async () => {
      const r = await placeOrderAction({
        lines, delivery, payment, discountCode: code, name: form.name, email: form.email, phone: form.phone,
        address: delivery === "pickup" ? null : { line1: form.line1, line2: form.line2, city: form.city, postcode: form.postcode, country: form.country },
        expectedTotalCents: q.totalCents,
      });
      if (r.ok) { clear(); router.push(`/order/${r.data.token}?new=1`); }
      else { setError(r.error); scrollTo({ top: 0, behavior: "smooth" }); }
    });
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const opt = (on: boolean) => cx("flex cursor-pointer items-center gap-4 border bg-white p-4 transition", on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40");

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <h1 className="font-serif text-5xl sm:text-6xl">Checkout</h1>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted"><IShield className="size-4" />Demo store: no payment is taken and nothing is shipped.</p>
      {error && <div role="alert" className="pop mt-6 border border-sale/30 bg-sale/5 px-4 py-3 text-sm font-medium text-sale">{error}</div>}
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">1 · Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label t="Full name"><input required minLength={2} autoComplete="name" className={field} value={form.name} onChange={set("name")} placeholder="Alex Morgan" /></Label></div>
              <Label t="Email"><input required type="email" autoComplete="email" className={field} value={form.email} onChange={set("email")} placeholder="you@example.com" /></Label>
              <Label t="Phone (optional)"><input type="tel" autoComplete="tel" className={field} value={form.phone} onChange={set("phone")} /></Label>
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">2 · Delivery</h2>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Delivery method">
              {([["standard", "Standard delivery", "3–5 working days", q && delivery === "standard" ? q.shippingCents : shipping, `Free over ${formatMoney(freeOver, currency, { compact: true })}`], ["express", "Express delivery", "Next working day", express, ""], ["pickup", "Pick up in store", "Ready in 2 hours", 0, ""]] as const).map(([k, t, s, cost, note]) => (
                <label key={k} className={opt(delivery === k)}>
                  <input type="radio" name="delivery" className="size-4 accent-ink" checked={delivery === k} onChange={() => setDelivery(k)} />
                  <span className="flex-1"><span className="block font-medium">{t}</span><span className="text-sm text-muted">{s}{note && ` · ${note}`}</span></span>
                  <span className="tnum text-sm font-semibold">{cost === 0 ? "Free" : fmt(cost)}</span>
                </label>
              ))}
            </div>
            {delivery !== "pickup" && (
              <div className="fade mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label t="Address"><input required autoComplete="address-line1" className={field} value={form.line1} onChange={set("line1")} placeholder="Street and number" /></Label></div>
                <div className="sm:col-span-2"><Label t="Apartment, suite (optional)"><input autoComplete="address-line2" className={field} value={form.line2} onChange={set("line2")} /></Label></div>
                <Label t="City"><input required autoComplete="address-level2" className={field} value={form.city} onChange={set("city")} /></Label>
                <Label t="Postcode / ZIP"><input required autoComplete="postal-code" className={field} value={form.postcode} onChange={set("postcode")} /></Label>
                <div className="sm:col-span-2"><Label t="Country"><input required autoComplete="country-name" className={field} value={form.country} onChange={set("country")} /></Label></div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">3 · Payment</h2>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Payment method">
              <label className={opt(payment === "card")}><input type="radio" name="pay" className="size-4 accent-ink" checked={payment === "card"} onChange={() => setPayment("card")} /><span className="flex-1"><span className="block font-medium">Card</span><span className="text-sm text-muted">Demo: test details, nothing is charged</span></span><span className="flex gap-1">{["VISA", "MC", "AMEX"].map(b => <span key={b} className="border border-line px-1.5 py-0.5 text-[10px] font-bold text-muted">{b}</span>)}</span></label>
              {payment === "card" && (
                <div className="fade grid grid-cols-[1fr_90px_80px] gap-2 border-x border-b border-line bg-white p-4">
                  <Label t="Card number"><input className={field} value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} inputMode="numeric" aria-describedby="card-note" /></Label>
                  <Label t="Expiry"><input className={field} value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} /></Label>
                  <Label t="CVC"><input className={field} value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} /></Label>
                  <p id="card-note" className="col-span-3 text-xs text-muted">Card details stay in your browser and are never sent. A live store connects a payment provider such as Stripe here.</p>
                </div>
              )}
              <label className={opt(payment === "cod")}><input type="radio" name="pay" className="size-4 accent-ink" checked={payment === "cod"} onChange={() => setPayment("cod")} /><span className="flex-1"><span className="block font-medium">Cash on delivery</span><span className="text-sm text-muted">Pay when your order arrives</span></span></label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line bg-white p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">Order summary</h2>
            <ul className="mt-4 divide-y divide-line">
              {loading && !items.length ? lines.map(l => <li key={l.variantId} className="flex gap-3 py-3"><div className="skeleton h-20 w-16" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/3" /></div></li>) : items.map(i => (
                <li key={i.variantId} className="flex gap-3 py-3">
                  <div className="relative h-20 w-16 shrink-0 bg-line"><img src={img(i.image, 140, 186)} alt="" className="size-full object-cover" /><span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white">{i.qty}</span></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{i.name}</div><div className="text-xs text-muted">{i.color} · {i.size}</div>{!i.available && <div className="text-xs font-semibold text-sale">{i.stock === 0 ? "Sold out" : `Only ${i.stock} left`}</div>}</div>
                  <div className="tnum text-sm">{fmt(i.unitCents * i.qty)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <label htmlFor="code" className="sr-only">Discount code</label>
              <input id="code" value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="Discount code" className={field + " h-11 uppercase"} />
              <button type="button" onClick={() => setCode(codeInput.trim() || null)} className="h-11 shrink-0 border border-ink px-4 text-xs font-semibold uppercase tracking-[.12em] hover:bg-ink hover:text-white">Apply</button>
            </div>
            {code && q?.discountError && <p className="mt-2 text-xs font-medium text-sale">{q.discountError}</p>}
            {code && q?.discountCode && <p className="pop mt-2 inline-flex items-center gap-1 text-xs font-semibold text-good"><ICheck className="size-3.5" />{q.discountCode} applied</p>}
            {!code && <p className="mt-2 text-xs text-muted">Try <button type="button" className="font-semibold underline" onClick={() => { setCodeInput("WELCOME10"); setCode("WELCOME10"); }}>WELCOME10</button> for 10% off.</p>}
            <dl className={cx("mt-5 space-y-2 border-t border-line pt-4 text-sm transition-opacity", loading && "opacity-50")}>
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tnum">{q ? fmt(q.subtotalCents) : "…"}</dd></div>
              {q && q.discountCents > 0 && <div className="flex justify-between text-good"><dt>Discount</dt><dd className="tnum">−{fmt(q.discountCents)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd className="tnum">{q ? (q.shippingCents ? fmt(q.shippingCents) : "Free") : "…"}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd className="tnum">{q ? fmt(q.totalCents) : "…"}</dd></div>
            </dl>
            <button disabled={!q || pending || blocked} className={btn.primary + " mt-5 h-14 w-full"}>
              {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : q ? `Place order · ${fmt(q.totalCents)}` : "Loading…"}
            </button>
            {blocked && <p className="mt-2 text-xs text-sale">Some items are no longer available. Update your bag to continue.</p>}
          </div>
        </aside>
      </form>
    </div>
  );
}
