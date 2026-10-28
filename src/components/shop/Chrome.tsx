"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { useBag } from "./Bag";
import { DemoChip } from "../ui";
import { IBag, IClose, IHeart, IMenu, ISearch } from "../icons";

const NAV = [
  { href: "/shop?sort=new", label: "New in" },
  { href: "/shop?collection=Women", label: "Women" },
  { href: "/shop?collection=Men", label: "Men" },
  { href: "/shop?category=Outerwear", label: "Outerwear" },
  { href: "/shop?sale=1", label: "Sale" },
];

export function Header({ name, promo }: { name: string; promo: string }) {
  const { count, setOpen, bumpKey, wish } = useBag();
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const menu = menuAt === path;
  useEffect(() => { const f = () => setScrolled(scrollY > 8); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  useEffect(() => { if (searching) input.current?.focus(); }, [searching]);

  return (
    <>
      <div className="relative overflow-hidden bg-ink py-2 text-[11px] font-medium uppercase tracking-[.18em] text-white">
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }, (_, k) => <span key={k} className="flex gap-12">{[promo, "30-day returns", "Demo store by StackGlint · no real orders", "New arrivals every Friday"].map(s => <span key={s}>{s} <span className="ml-12 opacity-40">✦</span></span>)}</span>)}
        </div>
      </div>
      <header className={cx("sticky top-0 z-40 border-b transition-colors", scrolled ? "border-line bg-paper/90 backdrop-blur-xl" : "border-transparent bg-paper")}>
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMenuAt(path)} className="grid size-10 place-items-center lg:hidden" aria-label="Open menu"><IMenu /></button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
              {NAV.map(n => <Link key={n.href} href={n.href} className={cx("text-[13px] font-medium uppercase tracking-[.12em] transition hover:text-clay", n.label === "Sale" && "text-sale")}>{n.label}</Link>)}
            </nav>
          </div>
          <Link href="/" className="whitespace-nowrap text-center font-serif text-[22px] font-medium leading-none tracking-tight sm:text-[30px]">{name}</Link>
          <div className="flex items-center justify-end">
            <span className="mr-2 hidden md:block"><DemoChip className="text-muted" /></span>
            <button type="button" onClick={() => setSearching(true)} className="hidden size-10 place-items-center hover:text-clay sm:grid" aria-label="Search"><ISearch /></button>
            <Link href="/wishlist" className="relative grid size-10 place-items-center hover:text-clay" aria-label={`Wishlist, ${wish.length} items`}>
              <IHeart />{wish.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-clay" />}
            </Link>
            <button type="button" onClick={() => setOpen(true)} className="relative grid size-10 place-items-center hover:text-clay" aria-label={`Bag, ${count} items`}>
              <IBag />
              {count > 0 && <span key={bumpKey} className="bump absolute right-0.5 top-0.5 grid size-[18px] place-items-center rounded-full bg-ink text-[10px] font-semibold text-white tnum">{count}</span>}
            </button>
          </div>
        </div>
        {searching && (
          <div className="fade absolute inset-x-0 top-full border-b border-line bg-paper shadow-xl">
            <form className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5" onSubmit={e => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q"); setSearching(false); router.push(`/shop?q=${encodeURIComponent(String(q ?? ""))}`); }}>
              <ISearch className="size-5 text-muted" />
              <label htmlFor="q" className="sr-only">Search the store</label>
              <input ref={input} id="q" name="q" placeholder="Search coats, linen, denim…" className="h-12 flex-1 bg-transparent font-serif text-2xl outline-none placeholder:text-muted/60" onKeyDown={e => e.key === "Escape" && setSearching(false)} />
              <button type="button" onClick={() => setSearching(false)} className="grid size-10 place-items-center" aria-label="Close search"><IClose /></button>
            </form>
          </div>
        )}
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade absolute inset-0 bg-ink/40" onClick={() => setMenuAt(null)} />
          <div className="slide-in absolute inset-y-0 left-0 w-[86%] max-w-[360px] bg-paper p-6 [animation-name:fade]">
            <div className="flex items-center justify-between"><span className="font-serif text-2xl">{name}</span><button type="button" onClick={() => setMenuAt(null)} className="grid size-10 place-items-center" aria-label="Close menu"><IClose /></button></div>
            <nav className="mt-8 flex flex-col" aria-label="Mobile">
              <form action="/shop" className="mb-2 flex items-center gap-2 border-b border-ink pb-2"><ISearch className="size-5 text-muted" /><label htmlFor="mq" className="sr-only">Search</label><input id="mq" name="q" placeholder="Search" className="h-10 flex-1 bg-transparent text-lg outline-none" /></form>
              {[...NAV, { href: "/wishlist", label: "Wishlist" }].map((n, i) => <Link key={n.href} href={n.href} onClick={() => setMenuAt(null)} className="rise border-b border-line py-4 font-serif text-3xl" style={{ animationDelay: `${i * 40}ms` }}>{n.label}</Link>)}
            </nav>
            <DemoChip className="mt-8 text-muted" />
          </div>
        </div>
      )}
    </>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="font-serif text-4xl">{name}</div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">A fictional clothing brand used to demo <b className="text-white">Threadfront</b>, an online store for fashion labels built by StackGlint. Products, prices and stock are sample data.</p>
        </div>
        {[["Shop", [["New in", "/shop?sort=new"], ["Women", "/shop?collection=Women"], ["Men", "/shop?collection=Men"], ["Sale", "/shop?sale=1"]]],
          ["Help", [["Shipping", "/shop"], ["Returns", "/shop"], ["Size guide", "/product/essential-crew-tee"], ["Track order", "/shop"]]],
          ["Demo", [["Store admin", "/admin"], ["Wishlist", "/wishlist"]]]].map(([h, ls]) => (
          <div key={h as string}><div className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/50">{h as string}</div>
            <ul className="mt-4 space-y-2.5 text-sm">{(ls as string[][]).map(([l, href]) => <li key={l}><Link href={href} className="text-white/80 hover:text-white">{l}</Link></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <span>Threadfront demo by StackGlint · fictional brand · no real orders or payments</span><span>Photos: Unsplash</span>
        </div>
      </div>
    </footer>
  );
}
