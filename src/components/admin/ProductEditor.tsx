"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProductAction } from "@/server/actions/admin";
import { cx, formatMoney, img } from "@/lib/format";
import { ICheck } from "../icons";

type P = { id: string; slug: string; name: string; category: string; collection: string; priceCents: number; compareAtCents: number | null; active: boolean;
  colors: { id: string; name: string; hex: string; image: string }[]; variants: { id: string; colorId: string; size: string; stock: number }[] };

const dollars = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));

export function ProductEditor({ p, currency, lowAt, delay }: { p: P; currency: string; lowAt: number; delay: number }) {
  const router = useRouter();
  const init = { price: dollars(p.priceCents), was: dollars(p.compareAtCents), active: p.active, stock: Object.fromEntries(p.variants.map(v => [v.id, String(v.stock)])) };
  const [v, setV] = useState(init);
  const [state, setState] = useState<"idle" | "saved" | string>("idle");
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(init);
  const total = p.variants.reduce((a, x) => a + (parseInt(v.stock[x.id]) || 0), 0);

  const save = () => start(async () => {
    const r = await updateProductAction({
      id: p.id, priceCents: Math.round(parseFloat(v.price) * 100), compareAtCents: v.was ? Math.round(parseFloat(v.was) * 100) : null, active: v.active,
      stock: p.variants.map(x => ({ variantId: x.id, stock: parseInt(v.stock[x.id]) || 0 })),
    });
    if (r.ok) { setState("saved"); router.refresh(); setTimeout(() => setState("idle"), 1800); } else setState(r.error);
  });
  const num = "h-10 w-full border border-line bg-paper px-2.5 text-sm tnum outline-none focus:border-ink focus:bg-white";

  return (
    <div className={cx("rise border border-line bg-white p-4 transition sm:p-5", !v.active && "opacity-60")} style={{ animationDelay: `${Math.min(delay, 400)}ms` }}>
      <div className="flex flex-wrap items-start gap-4">
        <img src={img(p.colors[0].image, 120, 150)} alt="" className="h-20 w-16 shrink-0 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><a href={`/product/${p.slug}`} target="_blank" className="font-medium hover:underline">{p.name}</a><span className="text-xs text-muted">{p.collection} · {p.category}</span></div>
          <div className="mt-1 text-sm text-muted">{formatMoney(p.priceCents, currency, { compact: true })}{p.compareAtCents ? ` (was ${formatMoney(p.compareAtCents, currency, { compact: true })})` : ""} · <span className={cx(total === 0 && "font-semibold text-sale")}>{total} in stock</span></div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <span className="text-muted">{v.active ? "Live" : "Hidden"}</span>
          <span className="relative inline-flex items-center">
            <input type="checkbox" className="peer sr-only" checked={v.active} onChange={e => setV({ ...v, active: e.target.checked })} aria-label={`${p.name} visible in store`} />
            <span className="h-6 w-11 rounded-full bg-ink/15 transition peer-checked:bg-good peer-focus-visible:ring-2 peer-focus-visible:ring-ink" />
            <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <div className="grid grid-cols-2 gap-2">
          <label><span className="mb-1 block text-[11px] font-medium text-muted">Price</span><input inputMode="decimal" className={num} value={v.price} onChange={e => setV({ ...v, price: e.target.value.replace(/[^0-9.]/g, "") })} /></label>
          <label><span className="mb-1 block text-[11px] font-medium text-muted">Was (sale)</span><input inputMode="decimal" placeholder="—" className={num} value={v.was} onChange={e => setV({ ...v, was: e.target.value.replace(/[^0-9.]/g, "") })} /></label>
        </div>
        <div className="space-y-2">
          {p.colors.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-xs text-muted" title={c.name}><span className="mr-1.5 inline-block size-2.5 rounded-full align-middle ring-1 ring-ink/15" style={{ background: c.hex }} />{c.name}</span>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {p.variants.filter(x => x.colorId === c.id).map(x => {
                  const n = parseInt(v.stock[x.id]) || 0;
                  return (
                    <label key={x.id} className="w-14 shrink-0 text-center">
                      <span className="mb-0.5 block text-[10px] font-semibold text-muted">{x.size}</span>
                      <input inputMode="numeric" aria-label={`${p.name} ${c.name} ${x.size} stock`} value={v.stock[x.id]} onChange={e => setV({ ...v, stock: { ...v.stock, [x.id]: e.target.value.replace(/\D/g, "") } })}
                        className={cx("h-9 w-full border text-center text-sm tnum outline-none focus:border-ink", n === 0 ? "border-sale/40 bg-sale/5 text-sale" : n <= lowAt ? "border-warn/40 bg-warn/5" : "border-line bg-paper")} />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-10 items-center justify-end">
          {state === "saved" ? <span className="pop inline-flex items-center gap-1 text-sm font-semibold text-good"><ICheck className="size-4" />Saved</span>
            : state !== "idle" ? <span className="max-w-[220px] text-xs font-medium text-sale">{state}</span>
            : <button type="button" disabled={!dirty || pending} onClick={save} className="h-10 bg-ink px-5 text-[13px] font-semibold uppercase tracking-[.12em] text-white transition hover:bg-clay disabled:opacity-25">Save</button>}
        </div>
      </div>
    </div>
  );
}
