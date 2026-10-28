import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { orderNumber } from "../../domain/orders";
import type { Db } from "./create";
import * as t from "./schema";
import { ADMIN, CITIES, DISCOUNTS, FIRST, LAST, PRODUCTS, STORE } from "./seed-data";

/** Deterministic PRNG so every reset looks the same (dates stay relative to today). */
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
}
const DAY = 864e5;

export async function seedIfEmpty(db: Db) {
  const rows = await db.select({ n: sql<number>`count(*)::int` }).from(t.store);
  if (rows[0].n === 0) await seed(db);
}

export async function resetAndSeed(db: Db) {
  await db.execute(sql`truncate order_events, order_items, orders, customers, discounts, variants, colors, products, admin_users, store restart identity cascade`);
  await db.execute(sql`alter sequence order_number_seq restart with 10001`);
  await seed(db);
}

export async function seed(db: Db, now = Date.now()) {
  const r = rng(7);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 256).toString(16).padStart(2, "0")).join("");

  await db.transaction(async tx => {
    await tx.insert(t.store).values({ id: 1, ...STORE });
    await tx.insert(t.adminUsers).values({ email: ADMIN.email, name: ADMIN.name, passwordHash: await bcrypt.hash(ADMIN.password, 10) });
    await tx.insert(t.discounts).values(DISCOUNTS);

    type V = { id: string; productId: string; name: string; color: string; size: string; image: string; price: number };
    const sellable: V[] = [];
    for (const [pi, p] of PRODUCTS.entries()) {
      const [prod] = await tx.insert(t.products).values({
        slug: p.slug, name: p.name, collection: p.collection, category: p.category, description: p.description, fabric: p.fabric, fit: p.fit,
        priceCents: p.price * 100, compareAtCents: p.compareAt ? p.compareAt * 100 : null, featured: !!p.featured,
        createdAt: new Date(now - p.daysOld * DAY),
      }).returning();
      for (const [ci, c] of p.colors.entries()) {
        const [col] = await tx.insert(t.colors).values({ productId: prod.id, name: c.name, hex: c.hex, images: c.images, position: ci }).returning();
        const rows = p.sizes.map((size, si) => {
          // Mostly healthy stock, with some sizes running low or sold out so the UI shows real states.
          const roll = r();
          const stock = roll < 0.06 ? 0 : roll < 0.22 ? 1 + Math.floor(r() * 3) : 6 + Math.floor(r() * 18);
          return { productId: prod.id, colorId: col.id, size, stock, position: si, sku: `${p.slug.split("-").map(w => w[0]).join("").toUpperCase()}${pi}-${c.name.slice(0, 3).toUpperCase()}-${size}` };
        });
        const vs = await tx.insert(t.variants).values(rows).returning();
        for (const v of vs) sellable.push({ id: v.id, productId: prod.id, name: p.name, color: c.name, size: v.size, image: c.images[0], price: p.price * 100 });
      }
    }

    const people = Array.from({ length: 120 }, (_, i) => {
      const f = FIRST[i % FIRST.length], l = LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length];
      return { name: `${f} ${l}`, email: `${f}.${l}${i}@example.com`.toLowerCase() };
    });
    const custs = await tx.insert(t.customers).values(people.map((p, i) => ({ ...p, createdAt: new Date(now - (60 - (i % 60)) * DAY) }))).returning();

    // Orders over the last 9 weeks (a full 30-day comparison window). Status follows age so the pipeline looks realistic.
    for (let d = 62; d >= 0; d--) {
      const n = d === 0 ? 4 : 3 + Math.floor(r() * 6) + (d % 7 === 5 || d % 7 === 6 ? 2 : 0);
      for (let k = 0; k < n; k++) {
        const placedAt = now - d * DAY - Math.floor(r() * (d === 0 ? 6 : 14)) * 3600e3;
        const lines = Array.from({ length: 1 + Math.floor(r() * (r() < 0.3 ? 3 : 1.6)) }, () => ({ v: pick(sellable), qty: r() < 0.85 ? 1 : 2 }));
        const sub = lines.reduce((a, l) => a + l.v.price * l.qty, 0);
        const useCode = r() < 0.18;
        const discount = useCode ? Math.round(sub * 0.1) : 0;
        const delivery = r() < 0.12 ? "pickup" : r() < 0.2 ? "express" : "standard";
        const shipping = delivery === "pickup" ? 0 : delivery === "express" ? STORE.expressCents : sub - discount >= STORE.freeShippingOverCents ? 0 : STORE.shippingCents;
        const payment = r() < 0.62 ? "card" : "cod";
        const age = d;
        const roll = r();
        const status = age > 7 ? (roll < 0.05 ? "cancelled" : "delivered") : age > 3 ? (roll < 0.5 ? "delivered" : "shipped") : age > 0 ? (roll < 0.5 ? "shipped" : "packed") : (payment === "card" ? "paid" : "placed");
        const cust = pick(custs);
        const [seq] = (await tx.execute(sql`select nextval('order_number_seq')::int as n`) as unknown as { rows: { n: number }[] }).rows;
        const [o] = await tx.insert(t.orders).values({
          number: orderNumber(seq.n), token: hex(18), customerId: cust.id, status, delivery, payment,
          address: delivery === "pickup" ? null : (() => { const [city, postcode] = pick(CITIES); return { line1: `${100 + Math.floor(r() * 899)} Demo Street`, line2: "", city, postcode, country: "United States" }; })(),
          subtotalCents: sub, discountCents: discount, shippingCents: shipping, totalCents: sub - discount + shipping,
          discountCode: useCode ? "WELCOME10" : null, createdAt: new Date(placedAt),
        }).returning();
        await tx.insert(t.orderItems).values(lines.map(l => ({ orderId: o.id, variantId: l.v.id, productId: l.v.productId, name: l.v.name, color: l.v.color, size: l.v.size, image: l.v.image, unitCents: l.v.price, qty: l.qty })));
        const flow = status === "cancelled" ? ["placed", "cancelled"] : ["placed", ...(payment === "card" ? ["paid"] : []), "packed", "shipped", "delivered"];
        const upto = status === "cancelled" ? flow.length : flow.indexOf(status) + 1;
        await tx.insert(t.orderEvents).values(flow.slice(0, upto).map((s, i) => ({ orderId: o.id, status: s as typeof t.orderStatus.enumValues[number], at: new Date(Math.min(now, placedAt + i * (s === "paid" ? 60e3 : 26 * 3600e3))) })));
      }
    }
    await tx.execute(sql`update discounts set used = (select count(*) from orders where discount_code = discounts.code)`);
  });
}
