"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardDTO } from "@/lib/dto";
import { cx, formatMoney, img } from "@/lib/format";
import { useBag } from "./Bag";
import { Badge, Price } from "../ui";
import { IHeart } from "../icons";

export function ProductCard({ p, currency, index = 0, priority = false }: { p: CardDTO; currency: string; index?: number; priority?: boolean }) {
  const { add, wish, toggleWish } = useBag();
  const [hover, setHover] = useState(false);
  const fmt = (c: number) => formatMoney(c, currency, { compact: true });
  const saved = wish.includes(p.slug);
  const off = p.compareAtCents ? Math.round((1 - p.priceCents / p.compareAtCents) * 100) : 0;
  return (
    <article className="rise group relative" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={`/product/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-line">
        <img src={img(p.images[0], 720, 960)} alt={p.name} loading={priority ? "eager" : "lazy"} className={cx("absolute inset-0 size-full object-cover transition duration-700 ease-out", p.images[1] ? "group-hover:opacity-0" : "group-hover:scale-[1.04]")} />
        {p.images[1] && <img src={img(p.images[1], 720, 960)} alt="" loading="lazy" className="absolute inset-0 size-full scale-[1.04] object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100" />}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {p.totalStock === 0 ? <Badge tone="ink">Sold out</Badge> : off > 0 ? <Badge tone="sale">−{off}%</Badge> : p.isNew ? <Badge tone="neutral">New</Badge> : null}
          {p.lowStock && <Badge tone="warn">Low stock</Badge>}
        </div>
      </Link>
      <button type="button" onClick={() => toggleWish(p.slug)} aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
        className={cx("absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/85 backdrop-blur transition hover:bg-white", saved && "text-clay")}>
        <IHeart className={cx("size-[18px]", saved && "fill-current")} />
      </button>
      {/* Quick add (desktop hover) */}
      {p.totalStock > 0 && (
        <div className={cx("absolute inset-x-3 hidden translate-y-2 bg-white/95 p-2 opacity-0 shadow-lg backdrop-blur transition duration-300 lg:block", hover && "translate-y-0 opacity-100")} style={{ bottom: "calc(4.75rem + 12px)" }}>
          <div className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Quick add</div>
          <div className="flex flex-wrap justify-center gap-1">
            {p.quick.map(q => (
              <button key={q.variantId} type="button" disabled={q.stock === 0} onClick={() => add(q.variantId)} aria-label={`Add ${p.name}, size ${q.size}`}
                className="h-8 min-w-9 border border-line px-2 text-xs font-medium transition hover:border-ink hover:bg-ink hover:text-white disabled:text-muted/50 disabled:line-through disabled:hover:border-line disabled:hover:bg-transparent">{q.size}</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/product/${p.slug}`} className="block truncate text-[15px] font-medium hover:underline">{p.name}</Link>
          <div className="mt-1 flex items-center gap-1.5">
            {p.colors.map(c => <span key={c.name} title={c.name} className="size-3 rounded-full ring-1 ring-ink/15" style={{ background: c.hex }} />)}
            <span className="ml-1 text-xs text-muted">{p.colors.length > 1 ? `${p.colors.length} colours` : p.colors[0]?.name}</span>
          </div>
        </div>
        <Price cents={p.priceCents} compareAt={p.compareAtCents} fmt={fmt} className="shrink-0 text-[15px]" />
      </div>
    </article>
  );
}
