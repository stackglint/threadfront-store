import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { btn } from "@/components/ui";
import { IArrowR, ILeaf, IReturn, ITruck } from "@/components/icons";
import { toCard } from "@/lib/dto";
import { formatMoney, img } from "@/lib/format";
import { db } from "@/server/db/client";
import { nowMs } from "@/server/clock";
import { EDITORIAL } from "@/server/db/seed-data";
import { filterProducts, getStore, listProducts } from "@/server/services/catalog";

export default async function Home() {
  const d = await db();
  const [store, all] = await Promise.all([getStore(d), listProducts(d)]);
  const now = nowMs();
  const cards = (xs: typeof all) => xs.map(p => toCard(p, store.lowStockAt, now));
  const newIn = cards(filterProducts(all, { sort: "new" }).slice(0, 4));
  const featured = cards(filterProducts(all, { sort: "featured" }).filter(p => p.featured).slice(0, 8));
  const cur = store.currency;
  const tiles = [
    { label: "Women", href: "/shop?collection=Women", image: EDITORIAL.women, n: all.filter(p => p.collection !== "Men").length },
    { label: "Men", href: "/shop?collection=Men", image: EDITORIAL.men, n: all.filter(p => p.collection !== "Women").length },
    { label: "Knitwear", href: "/shop?category=Knitwear", image: EDITORIAL.knit, n: all.filter(p => p.category === "Knitwear").length },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative mx-auto grid max-w-[1440px] gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:px-10 lg:pt-10">
        <div className="flex flex-col justify-center lg:py-10">
          <p className="rise text-[11px] font-semibold uppercase tracking-[.24em] text-clay">Autumn edit · Demo store</p>
          <h1 className="rise mt-5 font-serif text-[56px] font-medium leading-[.95] tracking-[-.02em] sm:text-[84px] lg:text-[104px]" style={{ animationDelay: ".08s" }}>
            Quiet<br />essentials,<br /><em className="font-normal">made to last.</em>
          </h1>
          <p className="rise mt-6 max-w-md text-[17px] leading-relaxed text-muted" style={{ animationDelay: ".16s" }}>Natural fabrics, honest cuts and colours that work together. Build a wardrobe you&apos;ll actually wear.</p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: ".24s" }}>
            <Link href="/shop?sort=new" className={btn.primary}>Shop new in <IArrowR className="size-4" /></Link>
            <Link href="/shop?category=Outerwear" className={btn.outline}>Coats & jackets</Link>
          </div>
        </div>
        <div className="relative">
          <div className="reveal relative aspect-[4/5] overflow-hidden bg-line sm:aspect-[5/5] lg:aspect-[4/5]">
            <img src={img(EDITORIAL.hero, 1200, 1500)} alt={EDITORIAL.heroAlt} className="kenburns absolute inset-0 size-full object-cover" />
          </div>
          <Link href={`/product/${featured[0]?.slug ?? ""}`} className="pop absolute bottom-5 left-5 flex items-center gap-3 bg-white/92 p-2.5 pr-4 shadow-xl backdrop-blur" style={{ animationDelay: ".7s" }}>
            {featured[0] && <img src={img(featured[0].images[0], 120, 150)} alt="" className="h-[60px] w-12 object-cover" />}
            <span><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Featured</span><span className="text-sm font-medium">{featured[0]?.name}</span></span>
          </Link>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-10">
          {[[ITruck, `Free shipping over ${formatMoney(store.freeShippingOverCents, cur, { compact: true })}`, "Express delivery available"], [IReturn, "30-day returns", "Easy, no questions asked"], [ILeaf, "Natural fibres", "Organic cotton, linen and wool"]].map(([Ic, a, b], i) => {
            const Icon = Ic as typeof ITruck;
            return <div key={i} className="flex items-center gap-4 py-5 sm:justify-center"><Icon className="size-6 text-clay" /><div><div className="text-sm font-semibold">{a as string}</div><div className="text-sm text-muted">{b as string}</div></div></div>;
          })}
        </div>
      </section>

      {/* New in */}
      <section className="mx-auto max-w-[1440px] px-4 pt-20 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4"><h2 className="font-serif text-4xl sm:text-5xl">New in</h2><Link href="/shop?sort=new" className="text-[13px] font-semibold uppercase tracking-[.14em] underline underline-offset-8 hover:text-clay">View all</Link></div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">{newIn.map((p, i) => <ProductCard key={p.slug} p={p} currency={cur} index={i} priority />)}</div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto mt-24 grid max-w-[1440px] gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-10">
        {tiles.map((t, i) => (
          <Link key={t.label} href={t.href} className="rise group relative block aspect-[4/5] overflow-hidden bg-line" style={{ animationDelay: `${i * 80}ms` }}>
            <img src={img(t.image, 900, 1125)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-[1.2s] ease-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-white">
              <div><div className="font-serif text-4xl">{t.label}</div><div className="mt-1 text-sm text-white/75">{t.n} styles</div></div>
              <span className="grid size-11 place-items-center rounded-full bg-white text-ink transition group-hover:bg-clay group-hover:text-white"><IArrowR className="size-5" /></span>
            </div>
          </Link>
        ))}
      </section>

      {/* Editorial band */}
      <section className="mx-auto mt-24 grid max-w-[1440px] items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-10">
        <div className="relative aspect-[5/4] overflow-hidden bg-line"><img src={img(EDITORIAL.flatlay, 1100, 880)} alt="Knit cardigan, jeans and boots laid out" loading="lazy" className="absolute inset-0 size-full object-cover" /></div>
        <div className="md:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-clay">The edit</p>
          <h2 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-6xl">Fewer pieces.<br /><em>Better ones.</em></h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted">Every piece is designed to mix with the rest of the collection, in a palette of oat, stone, camel and ink. Start with a coat, add a knit, finish with denim.</p>
          <Link href="/shop" className={btn.outline + " mt-8"}>Shop the collection</Link>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4"><h2 className="font-serif text-4xl sm:text-5xl">Most loved</h2><Link href="/shop" className="text-[13px] font-semibold uppercase tracking-[.14em] underline underline-offset-8 hover:text-clay">Shop all</Link></div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">{featured.map((p, i) => <ProductCard key={p.slug} p={p} currency={cur} index={i} />)}</div>
      </section>
    </>
  );
}
