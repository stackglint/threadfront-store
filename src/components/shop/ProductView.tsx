"use client";

import { useEffect, useState } from "react";
import { cx, formatMoney, img } from "@/lib/format";
import { stockLevel } from "@/domain/catalog";
import { useBag } from "./Bag";
import { Badge, btn, Price } from "../ui";
import { IBox, IClose, IHeart, IReturn, IRuler, ITruck } from "../icons";

type P = {
  slug: string; name: string; collection: string; category: string; description: string; fabric: string; fit: string;
  priceCents: number; compareAtCents: number | null;
  colors: { id: string; name: string; hex: string; images: string[] }[];
  variants: { id: string; colorId: string; size: string; stock: number; sku: string }[];
};

const GUIDE = {
  letters: { head: ["Size", "Chest (in)", "Waist (in)", "Hip (in)"], rows: [["XS", "32–34", "25–27", "34–36"], ["S", "35–37", "28–30", "37–39"], ["M", "38–40", "31–33", "40–42"], ["L", "41–43", "34–36", "43–45"], ["XL", "44–46", "37–39", "46–48"], ["XXL", "47–49", "40–42", "49–51"]] },
  waist: { head: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)"], rows: [["28", "28", "36", "32"], ["30", "30", "38", "32"], ["32", "32", "40", "32"], ["34", "34", "42", "32"], ["36", "36", "44", "32"]] },
};

export function ProductView({ p, currency, lowAt, freeOver }: { p: P; currency: string; lowAt: number; freeOver: number }) {
  const { add, wish, toggleWish } = useBag();
  const [colorId, setColorId] = useState(p.colors[0].id);
  const [size, setSize] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [guide, setGuide] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [open, setOpen] = useState<string | null>("details");
  const fmt = (c: number) => formatMoney(c, currency, { compact: true });
  const color = p.colors.find(c => c.id === colorId)!;
  const vs = p.variants.filter(v => v.colorId === colorId);
  const sel = vs.find(v => v.size === size) ?? null;
  const saved = wish.includes(p.slug);
  const images = color.images;
  const off = p.compareAtCents ? Math.round((1 - p.priceCents / p.compareAtCents) * 100) : 0;
  const isWaist = /^\d+$/.test(vs[0]?.size ?? "");

  useEffect(() => { if (!guide) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setGuide(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [guide]);

  const onAdd = () => {
    if (!sel) { setNudge(true); setTimeout(() => setNudge(false), 700); return; }
    add(sel.id);
  };

  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      {/* Gallery */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex gap-3">
          {images.length > 1 && (
            <div className="hidden w-20 shrink-0 flex-col gap-3 sm:flex">
              {images.map((src, i) => (
                <button key={src} type="button" onClick={() => setImgIdx(i)} aria-label={`Image ${i + 1}`} aria-pressed={imgIdx === i} className={cx("aspect-[3/4] overflow-hidden bg-line ring-offset-2 ring-offset-paper transition", imgIdx === i ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100")}>
                  <img src={img(src, 160, 214)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-line">
            {images.map((src, i) => (
              <img key={src} src={img(src, 1200, 1600)} alt={i === 0 ? `${p.name} in ${color.name}` : ""} className={cx("absolute inset-0 size-full object-cover transition duration-700", i === Math.min(imgIdx, images.length - 1) ? "scale-100 opacity-100" : "scale-[1.03] opacity-0")} />
            ))}
            <div className="absolute left-4 top-4 flex gap-1.5">{off > 0 && <Badge tone="sale">−{off}%</Badge>}</div>
            {images.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden">{images.map((_, i) => <button key={i} type="button" onClick={() => setImgIdx(i)} aria-label={`Image ${i + 1}`} className={cx("h-1.5 rounded-full transition-all", i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/60")} />)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="lg:py-2">
        <p className="rise text-[11px] font-semibold uppercase tracking-[.2em] text-muted">{p.collection} · {p.category}</p>
        <h1 className="rise mt-3 font-serif text-[44px] leading-[1.02] sm:text-[56px]" style={{ animationDelay: ".05s" }}>{p.name}</h1>
        <div className="rise mt-4 text-xl" style={{ animationDelay: ".1s" }}><Price cents={p.priceCents} compareAt={p.compareAtCents} fmt={fmt} /></div>
        <p className="rise mt-5 max-w-lg leading-relaxed text-muted" style={{ animationDelay: ".14s" }}>{p.description}</p>

        <div className="rise mt-8" style={{ animationDelay: ".18s" }}>
          <div className="text-sm"><span className="font-semibold">Colour:</span> {color.name}</div>
          <div className="mt-3 flex gap-2.5">
            {p.colors.map(c => (
              <button key={c.id} type="button" onClick={() => { setColorId(c.id); setImgIdx(0); setSize(null); }} aria-pressed={c.id === colorId} aria-label={c.name} title={c.name}
                className={cx("grid size-10 place-items-center rounded-full transition", c.id === colorId ? "ring-1 ring-ink ring-offset-2 ring-offset-paper" : "ring-1 ring-ink/15 hover:ring-ink/50")}>
                <span className="size-8 rounded-full" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>

        <div className="rise mt-7" style={{ animationDelay: ".22s" }}>
          <div className="flex items-center justify-between text-sm"><span><span className="font-semibold">Size:</span> {size ?? <span className="text-muted">Select a size</span>}</span>
            <button type="button" onClick={() => setGuide(true)} className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-clay"><IRuler className="size-4" />Size guide</button></div>
          <div className={cx("mt-3 grid grid-cols-5 gap-2", nudge && "[animation:bump_.5s]")} role="radiogroup" aria-label="Size">
            {vs.map(v => {
              const lvl = stockLevel(v.stock, lowAt);
              return (
                <button key={v.id} type="button" role="radio" aria-checked={size === v.size} disabled={lvl === "out"} onClick={() => setSize(v.size)}
                  className={cx("relative h-12 border text-sm font-medium transition", size === v.size ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink", lvl === "out" && "cursor-not-allowed text-muted/50 line-through hover:border-line")}>
                  {v.size}{lvl === "low" && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-warn" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 h-5 text-sm" aria-live="polite">
            {sel ? (sel.stock <= lowAt ? <span className="font-semibold text-warn">Only {sel.stock} left in {sel.size}</span> : <span className="text-good">In stock, ready to ship</span>)
              : nudge ? <span className="font-semibold text-sale">Please choose a size</span> : vs.some(v => v.stock > 0 && v.stock <= lowAt) ? <span className="text-muted"><span className="mr-1 inline-block size-1.5 rounded-full bg-warn align-middle" />Low stock in some sizes</span> : null}
          </div>
        </div>

        <div className="rise mt-4 flex gap-2" style={{ animationDelay: ".26s" }}>
          <button type="button" onClick={onAdd} disabled={vs.every(v => v.stock === 0)} className={btn.primary + " h-14 flex-1"}>{vs.every(v => v.stock === 0) ? "Sold out" : sel ? `Add to bag · ${fmt(p.priceCents)}` : "Add to bag"}</button>
          <button type="button" onClick={() => toggleWish(p.slug)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} className={cx("grid h-14 w-14 place-items-center border transition", saved ? "border-clay text-clay" : "border-line bg-white hover:border-ink")}>
            <IHeart className={cx("size-5", saved && "fill-current")} />
          </button>
        </div>

        <ul className="rise mt-6 grid gap-3 border-y border-line py-5 text-sm sm:grid-cols-3" style={{ animationDelay: ".3s" }}>
          <li className="flex items-center gap-2"><ITruck className="size-5 text-clay" />Free over {fmt(freeOver)}</li>
          <li className="flex items-center gap-2"><IReturn className="size-5 text-clay" />30-day returns</li>
          <li className="flex items-center gap-2"><IBox className="size-5 text-clay" />Ships in 1–2 days</li>
        </ul>

        <div className="mt-2 divide-y divide-line">
          {[["details", "Details & fit", <><p>{p.fit}</p><p className="mt-2 text-muted">SKU {sel?.sku ?? vs[0]?.sku}</p></>], ["fabric", "Fabric & care", <p key="f">{p.fabric}</p>], ["delivery", "Delivery & returns", <p key="d">Standard delivery 3–5 working days, express next working day, or free in-store pickup. Return unworn items within 30 days. <span className="text-muted">(Demo store: policies are examples.)</span></p>]].map(([k, label, body]) => (
            <div key={k as string}>
              <button type="button" onClick={() => setOpen(open === k ? null : (k as string))} aria-expanded={open === k} className="flex w-full items-center justify-between py-4 text-left text-[13px] font-semibold uppercase tracking-[.14em]">
                {label as string}<span className={cx("text-lg transition", open === k && "rotate-45")}>+</span>
              </button>
              <div className={cx("grid transition-all duration-300", open === k ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]")}><div className="overflow-hidden text-[15px] leading-relaxed">{body}</div></div>
            </div>
          ))}
        </div>
      </div>

      {guide && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="fade absolute inset-0 bg-ink/40" onClick={() => setGuide(false)} />
          <div className="pop relative w-full max-w-lg bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between"><h2 className="font-serif text-3xl">Size guide</h2><button type="button" onClick={() => setGuide(false)} className="grid size-10 place-items-center" aria-label="Close"><IClose /></button></div>
            <p className="mt-1 text-sm text-muted">Body measurements. {p.fit}</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-ink text-left">{(isWaist ? GUIDE.waist : GUIDE.letters).head.map(h => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{(isWaist ? GUIDE.waist : GUIDE.letters).rows.filter(r => vs.some(v => v.size === r[0])).map(r => <tr key={r[0]} className={cx("border-b border-line", r[0] === size && "bg-white font-semibold")}>{r.map((c, i) => <td key={i} className="py-2.5 pr-3 tnum">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
