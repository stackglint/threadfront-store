import { desc, gte, sql } from "drizzle-orm";
import type { Db } from "../db/create";
import * as t from "../db/schema";
import { getStore, listProducts } from "./catalog";

const DAY = 864e5;
const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const pct = (a: number, b: number) => (b ? (a - b) / b : null);

/** Dashboard numbers: last 30 days vs the 30 before, daily revenue for 14 days, best sellers, low stock. */
export async function dashboard(db: Db, now = Date.now()) {
  const store = await getStore(db);
  const t0 = startOfDay(now);
  const from = t0 - 60 * DAY;
  const [orders, products, recent] = await Promise.all([
    db.query.orders.findMany({ where: gte(t.orders.createdAt, new Date(from)), with: { items: true } }),
    listProducts(db, { includeInactive: true }),
    db.query.orders.findMany({ orderBy: desc(t.orders.createdAt), limit: 7, with: { customer: true, items: true } }),
  ]);
  const live = orders.filter(o => o.status !== "cancelled");
  const inRange = (a: number, b: number) => live.filter(o => o.createdAt.getTime() >= a && o.createdAt.getTime() < b);
  const cur = inRange(now - 30 * DAY, now + 1), prev = inRange(now - 60 * DAY, now - 30 * DAY);
  const rev = (xs: typeof live) => xs.reduce((a, o) => a + o.totalCents, 0);
  const units = (xs: typeof live) => xs.reduce((a, o) => a + o.items.reduce((s, i) => s + i.qty, 0), 0);
  const today = inRange(t0, now + 1);

  const days = Array.from({ length: 14 }, (_, i) => {
    const a = t0 - (13 - i) * DAY, xs = inRange(a, a + DAY);
    return { day: a, revenue: rev(xs), orders: xs.length };
  });

  const byProduct = new Map<string, { units: number; revenue: number }>();
  for (const o of cur) for (const i of o.items) {
    const m = byProduct.get(i.productId) ?? { units: 0, revenue: 0 };
    m.units += i.qty; m.revenue += i.unitCents * i.qty; byProduct.set(i.productId, m);
  }
  const top = products.map(p => ({ id: p.id, name: p.name, image: p.colors[0]?.images[0] ?? "", ...(byProduct.get(p.id) ?? { units: 0, revenue: 0 }) }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const lowStock = products.flatMap(p => p.variants.filter(v => v.stock <= store.lowStockAt).map(v => ({
    variantId: v.id, product: p.name, slug: p.slug, color: p.colors.find(c => c.id === v.colorId)?.name ?? "", size: v.size, stock: v.stock,
  }))).sort((a, b) => a.stock - b.stock);

  const toFulfil = live.filter(o => o.status === "placed" || o.status === "paid" || o.status === "packed").length;
  const [{ n: customers }] = (await db.execute(sql`select count(*)::int as n from customers`) as unknown as { rows: { n: number }[] }).rows;

  return {
    store, revenue: rev(cur), revenueChange: pct(rev(cur), rev(prev)), orders: cur.length, ordersChange: pct(cur.length, prev.length),
    aov: cur.length ? Math.round(rev(cur) / cur.length) : 0, aovPrev: prev.length ? Math.round(rev(prev) / prev.length) : 0,
    units: units(cur), todayRevenue: rev(today), todayOrders: today.length, toFulfil, customers,
    days, top, lowStock, recent,
  };
}
