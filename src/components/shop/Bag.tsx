"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { quoteAction } from "@/server/actions/shop";
import { cx, formatMoney, img } from "@/lib/format";
import { MAX_QTY } from "@/domain/pricing";
import { btn } from "../ui";
import { IClose, IMinus, IPlus, ITruck } from "../icons";

export type Line = { variantId: string; qty: number };
type QuoteData = NonNullable<Extract<Awaited<ReturnType<typeof quoteAction>>, { ok: true }>["data"]>;

type Ctx = {
  lines: Line[]; count: number; open: boolean; setOpen: (b: boolean) => void;
  add: (variantId: string, qty?: number) => void; setQty: (variantId: string, qty: number) => void; clear: () => void;
  wish: string[]; toggleWish: (slug: string) => void; bumpKey: number; ready: boolean;
};
const BagCtx = createContext<Ctx | null>(null);
export const useBag = () => { const c = useContext(BagCtx); if (!c) throw new Error("BagProvider missing"); return c; };

const KEY = "threadfront-bag-v1", WKEY = "threadfront-wish-v1";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function BagProvider({ children, currency, freeOver }: { children: React.ReactNode; currency: string; freeOver: number }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [bumpKey, setBump] = useState(0);

  // Browser storage is only readable after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLines(read<Line[]>(KEY, [])); setWish(read<string[]>(WKEY, [])); setReady(true); }, []);
  useEffect(() => { if (ready) write(KEY, lines); }, [lines, ready]);
  useEffect(() => { if (ready) write(WKEY, wish); }, [wish, ready]);

  const add = useCallback((variantId: string, qty = 1) => {
    setLines(ls => { const f = ls.find(l => l.variantId === variantId); return f ? ls.map(l => l === f ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l) : [...ls, { variantId, qty }]; });
    setBump(b => b + 1); setOpen(true);
  }, []);
  const setQty = useCallback((variantId: string, qty: number) => setLines(ls => qty <= 0 ? ls.filter(l => l.variantId !== variantId) : ls.map(l => l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)), []);
  const clear = useCallback(() => setLines([]), []);
  const toggleWish = useCallback((slug: string) => setWish(w => w.includes(slug) ? w.filter(s => s !== slug) : [...w, slug]), []);
  const count = lines.reduce((a, l) => a + l.qty, 0);

  const value = useMemo(() => ({ lines, count, open, setOpen, add, setQty, clear, wish, toggleWish, bumpKey, ready }), [lines, count, open, add, setQty, clear, wish, toggleWish, bumpKey, ready]);
  return <BagCtx.Provider value={value}>{children}<BagDrawer currency={currency} freeOver={freeOver} /></BagCtx.Provider>;
}

/** Server-priced view of the bag. Keyed by content, so re-renders with an equal bag don't refetch. */
export function useQuote(lines: Line[], delivery: "standard" | "express" | "pickup" = "standard", code: string | null = null) {
  const [res, setRes] = useState<{ key: string; data: QuoteData | null; error?: string } | null>(null);
  const key = JSON.stringify([lines, delivery, code]);
  useEffect(() => {
    const [l, dl, c] = JSON.parse(key) as [Line[], typeof delivery, string | null];
    if (!l.length) return;
    let alive = true;
    quoteAction(l, dl, c).then(r => { if (alive) setRes(r.ok ? { key, data: r.data } : { key, data: null, error: r.error }); });
    return () => { alive = false; };
  }, [key]);
  if (!lines.length) return { data: null, loading: false, error: undefined };
  return { data: res?.key === key ? res.data : res?.data ?? null, loading: res?.key !== key, error: res?.key === key ? res.error : undefined };
}

function BagDrawer({ currency, freeOver }: { currency: string; freeOver: number }) {
  const { lines, open, setOpen, setQty, count } = useBag();
  const { data, loading } = useQuote(open ? lines : [], "standard");
  const fmt = (c: number) => formatMoney(c, currency);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, setOpen]);
  if (!open) return null;
  const items = data?.items ?? [];
  const q = data?.quote;
  const remaining = q ? q.freeShippingRemainingCents : freeOver;
  const progress = q ? Math.min(1, (freeOver - remaining) / freeOver) : 0;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="fade absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <div className="slide-in absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[.16em]">Your bag <span className="text-muted">({count})</span></h2>
          <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center hover:bg-ink/5" aria-label="Close bag"><IClose className="size-5" /></button>
        </div>
        {count > 0 && (
          <div className="border-b border-line px-6 py-4">
            <div className="flex items-center gap-2 text-sm"><ITruck className="size-4" />{remaining > 0 ? <span>You&apos;re <b className="tnum">{fmt(remaining)}</b> away from free shipping</span> : <span className="font-semibold text-good">You&apos;ve unlocked free shipping</span>}</div>
            <div className="mt-2.5 h-1 overflow-hidden bg-ink/10"><div className="h-full bg-ink transition-all duration-700" style={{ width: `${progress * 100}%` }} /></div>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {count === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div><p className="font-serif text-3xl">Your bag is empty</p><p className="mt-2 text-sm text-muted">Find something you&apos;ll wear on repeat.</p>
                <Link href="/shop" onClick={() => setOpen(false)} className={btn.primary + " mt-6"}>Shop new in</Link></div>
            </div>
          ) : loading && !items.length ? (
            <div className="space-y-4 py-5">{lines.map(l => <div key={l.variantId} className="flex gap-4"><div className="skeleton h-28 w-22 shrink-0" /><div className="flex-1 space-y-2 pt-1"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/3" /></div></div>)}</div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map(i => (
                <li key={i.variantId} className="flex gap-4 py-5">
                  <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="block h-28 w-[84px] shrink-0 overflow-hidden bg-line"><img src={img(i.image, 200, 266)} alt="" className="size-full object-cover" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3"><Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="font-medium hover:underline">{i.name}</Link><span className="tnum text-sm">{fmt(i.unitCents * i.qty)}</span></div>
                    <div className="mt-0.5 text-sm text-muted">{i.color} · {i.size}</div>
                    {!i.available && <div className="mt-1 text-xs font-semibold text-sale">{i.stock === 0 ? "Sold out. Remove to continue." : `Only ${i.stock} left. Lower the quantity.`}</div>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button type="button" onClick={() => setQty(i.variantId, i.qty - 1)} className="grid size-9 place-items-center hover:bg-ink/5" aria-label={`Decrease ${i.name}`}><IMinus className="size-3.5" /></button>
                        <span className="w-8 text-center text-sm tnum">{i.qty}</span>
                        <button type="button" disabled={i.qty >= Math.min(MAX_QTY, i.stock)} onClick={() => setQty(i.variantId, i.qty + 1)} className="grid size-9 place-items-center hover:bg-ink/5 disabled:opacity-30" aria-label={`Increase ${i.name}`}><IPlus className="size-3.5" /></button>
                      </div>
                      <button type="button" onClick={() => setQty(i.variantId, 0)} className="text-xs text-muted underline underline-offset-4 hover:text-ink">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {count > 0 && (
          <div className="border-t border-line bg-white px-6 py-5">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className={cx("tnum font-semibold", loading && "opacity-50")}>{q ? fmt(q.subtotalCents) : "…"}</span></div>
            <p className="mt-1 text-xs text-muted">Shipping and discount codes at checkout.</p>
            <Link href="/checkout" onClick={() => setOpen(false)} className={cx(btn.primary, "mt-4 w-full", items.some(i => !i.available) && "pointer-events-none opacity-40")}>Checkout</Link>
          </div>
        )}
      </div>
    </div>
  );
}
