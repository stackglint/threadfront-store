import type { ProductFull } from "@/server/services/catalog";

const DAY = 864e5;

export type CardDTO = {
  slug: string; name: string; category: string; priceCents: number; compareAtCents: number | null;
  images: string[]; colors: { name: string; hex: string }[]; isNew: boolean; totalStock: number; lowStock: boolean;
  quick: { size: string; variantId: string; stock: number }[];
};

export function toCard(p: ProductFull, lowAt: number, now: number): CardDTO {
  const c0 = p.colors[0];
  const total = p.variants.reduce((a, v) => a + v.stock, 0);
  const imgs = p.colors.flatMap(c => c.images);
  return {
    slug: p.slug, name: p.name, category: p.category, priceCents: p.priceCents, compareAtCents: p.compareAtCents,
    images: [c0?.images[0], c0?.images[1] ?? imgs[1]].filter(Boolean) as string[],
    colors: p.colors.map(c => ({ name: c.name, hex: c.hex })),
    isNew: now - p.createdAt.getTime() < 14 * DAY,
    totalStock: total,
    lowStock: total > 0 && p.variants.filter(v => v.stock > 0).every(v => v.stock <= lowAt),
    quick: p.variants.filter(v => v.colorId === c0?.id).map(v => ({ size: v.size, variantId: v.id, stock: v.stock })),
  };
}
