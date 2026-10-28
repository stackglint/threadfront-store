import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductView } from "@/components/shop/ProductView";
import { toCard } from "@/lib/dto";
import { db } from "@/server/db/client";
import { nowMs } from "@/server/clock";
import { getProductBySlug, getStore, listProducts } from "@/server/services/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(await db(), slug).catch(() => null);
  return { title: p?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await db();
  const [store, p, all] = await Promise.all([getStore(d), getProductBySlug(d, slug).catch(() => null), listProducts(d)]);
  if (!p) notFound();
  const related = all.filter(x => x.id !== p.id && (x.category === p.category || x.collection === p.collection)).slice(0, 4);
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-10">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link><span className="mx-1.5">/</span>
        <Link href={`/shop?category=${p.category}`} className="hover:text-ink">{p.category}</Link><span className="mx-1.5">/</span><span className="text-ink">{p.name}</span>
      </nav>
      <ProductView
        currency={store.currency} lowAt={store.lowStockAt} freeOver={store.freeShippingOverCents}
        p={{
          slug: p.slug, name: p.name, collection: p.collection, category: p.category, description: p.description, fabric: p.fabric, fit: p.fit,
          priceCents: p.priceCents, compareAtCents: p.compareAtCents,
          colors: p.colors.map(c => ({ id: c.id, name: c.name, hex: c.hex, images: c.images })),
          variants: p.variants.map(v => ({ id: v.id, colorId: v.colorId, size: v.size, stock: v.stock, sku: v.sku })),
        }}
      />
      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-serif text-4xl">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">{related.map((r, i) => <ProductCard key={r.slug} p={toCard(r, store.lowStockAt, nowMs())} currency={store.currency} index={i} />)}</div>
        </section>
      )}
    </div>
  );
}
