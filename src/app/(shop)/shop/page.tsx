import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortSelect } from "@/components/shop/SortSelect";
import { MobileFilters } from "@/components/shop/MobileFilters";
import { IClose } from "@/components/icons";
import { SORTS, sizeRank, type SortKey } from "@/domain/catalog";
import { toCard } from "@/lib/dto";
import { cx, formatMoney } from "@/lib/format";
import { db } from "@/server/db/client";
import { nowMs } from "@/server/clock";
import { colorFamily, FAMILY_SWATCH, filterProducts, getStore, listProducts, type ShopFilter } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Shop" };
type SP = { collection?: string; category?: string; size?: string; color?: string; max?: string; sale?: string; q?: string; sort?: string };

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const d = await db();
  const [store, all] = await Promise.all([getStore(d), listProducts(d)]);
  const sort = (SORTS.find(s => s.key === sp.sort)?.key ?? "featured") as SortKey;
  const f: ShopFilter = { collection: sp.collection, category: sp.category, size: sp.size, color: sp.color, max: sp.max ? Number(sp.max) || undefined : undefined, sale: sp.sale === "1", q: sp.q?.slice(0, 60), sort };
  const list = filterProducts(all, f);
  const cur = store.currency;
  const href = (patch: Partial<Record<keyof SP, string | undefined>>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, v);
    const s = u.toString(); return s ? `/shop?${s}` : "/shop";
  };
  const toggle = (k: keyof SP, v: string) => href({ [k]: sp[k] === v ? undefined : v });
  const scoped = filterProducts(all, { ...f, category: undefined, size: undefined, color: undefined, max: undefined, sort });
  const categories = [...new Set(all.map(p => p.category))];
  const sizes = [...new Set(all.flatMap(p => p.variants.map(v => v.size)))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const families = [...new Set(all.flatMap(p => p.colors.map(c => colorFamily(c.hex))))];
  const title = sp.q ? `“${sp.q}”` : sp.sale === "1" ? "Sale" : sp.category ?? sp.collection ?? (sort === "new" ? "New in" : "All clothing");
  const active = (["collection", "category", "size", "color", "max", "sale", "q"] as const).filter(k => sp[k]);
  const chip = "inline-flex h-9 items-center border px-3 text-[13px] transition";

  const panel = (
    <div className="space-y-8">
      <div><h3 className="text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Collection</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">{["Women", "Men"].map(c => <Link key={c} href={toggle("collection", c)} className={cx(chip, sp.collection === c ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink")}>{c}</Link>)}</div></div>
      <div><h3 className="text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Category</h3>
        <ul className="mt-3 space-y-1">{categories.map(c => { const n = scoped.filter(p => p.category === c).length; return (
          <li key={c}><Link href={toggle("category", c)} className={cx("flex items-center justify-between py-1 text-[15px] transition hover:text-clay", sp.category === c && "font-semibold")}><span className="flex items-center gap-2.5"><span className={cx("size-3.5 border", sp.category === c ? "border-ink bg-ink" : "border-ink/30")} />{c}</span><span className="text-xs text-muted tnum">{n}</span></Link></li>); })}</ul></div>
      <div><h3 className="text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Size in stock</h3>
        <div className="mt-3 grid grid-cols-5 gap-1.5">{sizes.map(s => <Link key={s} href={toggle("size", s)} className={cx("grid h-10 place-items-center border text-[13px] transition", sp.size === s ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink")}>{s}</Link>)}</div></div>
      <div><h3 className="text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Colour</h3>
        <div className="mt-3 flex flex-wrap gap-2">{families.map(c => <Link key={c} href={toggle("color", c)} title={c} aria-label={c} aria-pressed={sp.color === c} className={cx("grid size-9 place-items-center rounded-full ring-1 transition", sp.color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "ring-ink/15 hover:ring-ink/50")}><span className="size-7 rounded-full" style={{ background: FAMILY_SWATCH[c] }} /></Link>)}</div></div>
      <div><h3 className="text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Price</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">{[50, 100, 150].map(m => <Link key={m} href={toggle("max", String(m))} className={cx(chip, sp.max === String(m) ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink")}>Under {formatMoney(m * 100, cur, { compact: true })}</Link>)}
          <Link href={toggle("sale", "1")} className={cx(chip, sp.sale === "1" ? "border-sale bg-sale text-white" : "border-line bg-white text-sale hover:border-sale")}>On sale</Link></div></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <nav className="text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span> <span className="text-ink">Shop</span></nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-5xl leading-none sm:text-6xl">{title}</h1><p className="mt-2 text-sm text-muted">{list.length} {list.length === 1 ? "style" : "styles"}</p></div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <MobileFilters count={active.length}>{panel}</MobileFilters>
          <SortSelect value={sort} />
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {active.map(k => <Link key={k} href={href({ [k]: undefined })} className="inline-flex h-8 items-center gap-1.5 bg-ink px-3 text-xs text-white">{k === "max" ? `Under ${formatMoney(Number(sp.max) * 100, cur, { compact: true })}` : k === "sale" ? "On sale" : k === "q" ? `Search: ${sp.q}` : sp[k]}<IClose className="size-3.5" /></Link>)}
          <Link href={sort !== "featured" ? `/shop?sort=${sort}` : "/shop"} className="text-xs text-muted underline underline-offset-4 hover:text-ink">Clear all</Link>
        </div>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{panel}</aside>
        {list.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">{list.map((p, i) => <ProductCard key={p.slug} p={toCard(p, store.lowStockAt, nowMs())} currency={cur} index={i} priority={i < 6} />)}</div>
        ) : (
          <div className="py-20 text-center"><p className="font-serif text-3xl">Nothing matches those filters</p><Link href="/shop" className="mt-4 inline-block text-sm underline underline-offset-4">Clear filters</Link></div>
        )}
      </div>
    </div>
  );
}
