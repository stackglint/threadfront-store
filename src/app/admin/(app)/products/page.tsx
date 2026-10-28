import type { Metadata } from "next";
import { PageHead, pageWrap } from "@/components/admin/parts";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { db } from "@/server/db/client";
import { getStore, listProducts } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Products & stock" };

export default async function Products() {
  const d = await db();
  const [store, all] = await Promise.all([getStore(d), listProducts(d, { includeInactive: true })]);
  const units = all.reduce((a, p) => a + p.variants.reduce((s, v) => s + v.stock, 0), 0);
  return (
    <div className={pageWrap}>
      <PageHead title="Products & stock" sub={`${all.length} products · ${units} units in stock · edit price, sale price and stock per size`} />
      <div className="space-y-3">
        {all.map((p, i) => (
          <ProductEditor key={p.id} delay={i * 30} currency={store.currency} lowAt={store.lowStockAt}
            p={{ id: p.id, slug: p.slug, name: p.name, category: p.category, collection: p.collection, priceCents: p.priceCents, compareAtCents: p.compareAtCents, active: p.active,
              colors: p.colors.map(c => ({ id: c.id, name: c.name, hex: c.hex, image: c.images[0] })), variants: p.variants.map(v => ({ id: v.id, colorId: v.colorId, size: v.size, stock: v.stock })) }} />
        ))}
      </div>
    </div>
  );
}
