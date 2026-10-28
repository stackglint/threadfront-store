import { asc, eq } from "drizzle-orm";
import { sizeRank, type SortKey } from "../../domain/catalog";
import type { Db } from "../db/create";
import * as t from "../db/schema";
import { AppError } from "../errors";

export type Store = typeof t.store.$inferSelect;

export async function getStore(db: Db): Promise<Store> {
  const [s] = await db.select().from(t.store).limit(1);
  if (!s) throw new AppError("NOT_FOUND", "Store is not set up.");
  return s;
}

/** Product with colourways and variants, sizes in a sensible order. */
export async function listProducts(db: Db, opts: { includeInactive?: boolean } = {}) {
  const rows = await db.query.products.findMany({
    where: opts.includeInactive ? undefined : eq(t.products.active, true),
    with: { colors: { orderBy: asc(t.colors.position) }, variants: { orderBy: asc(t.variants.position) } },
    orderBy: asc(t.products.name),
  });
  for (const p of rows) p.variants.sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  return rows;
}
export type ProductFull = Awaited<ReturnType<typeof listProducts>>[number];

export async function getProductBySlug(db: Db, slug: string) {
  const p = await db.query.products.findFirst({
    where: eq(t.products.slug, slug),
    with: { colors: { orderBy: asc(t.colors.position) }, variants: { orderBy: asc(t.variants.position) } },
  });
  if (!p || !p.active) throw new AppError("NOT_FOUND", "Product not found.");
  p.variants.sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  return p;
}

export type ShopFilter = { collection?: string; category?: string; size?: string; color?: string; max?: number; sale?: boolean; q?: string; sort?: SortKey };

/** Filtering in memory is fine at catalogue sizes like this; swap for SQL when a store has thousands of products. */
export function filterProducts(all: ProductFull[], f: ShopFilter) {
  const q = f.q?.trim().toLowerCase();
  let out = all.filter(p =>
    (!f.collection || p.collection === f.collection || (p.collection === "Unisex" && f.collection !== "Unisex")) &&
    (!f.category || p.category === f.category) &&
    (!f.size || p.variants.some(v => v.size === f.size && v.stock > 0)) &&
    (!f.color || p.colors.some(c => colorFamily(c.hex) === f.color)) &&
    (!f.max || p.priceCents <= f.max * 100) &&
    (!f.sale || p.compareAtCents !== null) &&
    (!q || [p.name, p.category, p.collection, ...p.colors.map(c => c.name)].some(s => s.toLowerCase().includes(q))));
  const sort = f.sort ?? "featured";
  out = [...out].sort((a, b) =>
    sort === "price-asc" ? a.priceCents - b.priceCents :
    sort === "price-desc" ? b.priceCents - a.priceCents :
    sort === "new" ? b.createdAt.getTime() - a.createdAt.getTime() :
    Number(b.featured) - Number(a.featured) || b.createdAt.getTime() - a.createdAt.getTime());
  return out;
}

/** Group exact colours into families for the colour filter. */
export function colorFamily(hex: string): string {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2 / 255, s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (l > 0.86) return "White";
  if (l < 0.18) return "Black";
  if (s < 0.12) return "Grey";
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6; else if (max === g) h = (b - r) / (max - min) + 2; else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 190 && h < 260) return "Blue";
  if (h >= 260 && h < 345) return "Pink & Purple";
  if (l > 0.62 && s < 0.5) return "Neutral";
  if (h >= 345 || h < 40) return l < 0.45 ? "Brown" : "Red & Orange";
  if (h < 70) return l < 0.45 ? "Brown" : "Neutral";
  return "Green";
}

export const FAMILY_SWATCH: Record<string, string> = {
  White: "#F7F7F4", Black: "#1C1C1C", Grey: "#A7A9AC", Neutral: "#D9C7A7", Brown: "#8B5E3C", Blue: "#4A6A9C", "Red & Orange": "#D2622A", "Pink & Purple": "#A2577E", Green: "#5F7D5A",
};
