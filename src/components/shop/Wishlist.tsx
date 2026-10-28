"use client";

import Link from "next/link";
import type { CardDTO } from "@/lib/dto";
import { useBag } from "./Bag";
import { ProductCard } from "./ProductCard";
import { btn } from "../ui";

export function Wishlist({ products, currency }: { products: CardDTO[]; currency: string }) {
  const { wish, ready } = useBag();
  const saved = products.filter(p => wish.includes(p.slug));
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <h1 className="font-serif text-5xl sm:text-6xl">Wishlist</h1>
      <p className="mt-2 text-sm text-muted">{ready ? `${saved.length} saved ${saved.length === 1 ? "piece" : "pieces"}` : " "} · saved in this browser</p>
      {ready && saved.length === 0 ? (
        <div className="py-20 text-center"><p className="font-serif text-3xl">Nothing saved yet</p><p className="mt-2 text-muted">Tap the heart on any piece to keep it here.</p><Link href="/shop" className={btn.primary + " mt-8"}>Browse the shop</Link></div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">{saved.map((p, i) => <ProductCard key={p.slug} p={p} currency={currency} index={i} />)}</div>
      )}
    </div>
  );
}
