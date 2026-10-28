import { randomBytes } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { MAX_QTY, quote, type Delivery, type Discount, type Quote } from "../../domain/pricing";
import { formatMoney } from "../../domain/money";
import { orderNumber } from "../../domain/orders";
import type { Db } from "../db/create";
import * as t from "../db/schema";
import { AppError } from "../errors";
import { getStore } from "./catalog";

export const CartLine = z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(MAX_QTY) });
export type CartLine = z.infer<typeof CartLine>;

const Lines = z.array(CartLine).min(1, "Your bag is empty.").max(30);

export type PricedItem = {
  variantId: string; productId: string; slug: string; name: string; color: string; size: string; image: string;
  unitCents: number; compareAtCents: number | null; qty: number; stock: number; available: boolean;
};

/** Loads current price and stock for each line. Merges duplicates; never trusts client prices. */
export async function priceLines(db: Db, raw: CartLine[]): Promise<PricedItem[]> {
  const merged = new Map<string, number>();
  for (const l of Lines.parse(raw)) merged.set(l.variantId, Math.min(MAX_QTY, (merged.get(l.variantId) ?? 0) + l.qty));
  const ids = [...merged.keys()];
  const rows = await db.select({ v: t.variants, p: t.products, c: t.colors }).from(t.variants)
    .innerJoin(t.products, eq(t.products.id, t.variants.productId))
    .innerJoin(t.colors, eq(t.colors.id, t.variants.colorId))
    .where(inArray(t.variants.id, ids));
  return ids.flatMap(id => {
    const r = rows.find(x => x.v.id === id);
    if (!r) return [];
    const qty = merged.get(id)!;
    return [{
      variantId: id, productId: r.p.id, slug: r.p.slug, name: r.p.name, color: r.c.name, size: r.v.size, image: r.c.images[0],
      unitCents: r.p.priceCents, compareAtCents: r.p.compareAtCents, qty, stock: r.v.stock, available: r.p.active && r.v.stock >= qty,
    }];
  });
}

async function findDiscount(db: Db, code: string | null | undefined): Promise<Discount | null> {
  if (!code) return null;
  const [d] = await db.select().from(t.discounts).where(eq(t.discounts.code, code.trim().toUpperCase()));
  return d ?? null;
}

export async function getQuote(db: Db, lines: CartLine[], delivery: Delivery, code?: string | null): Promise<{ items: PricedItem[]; quote: Quote; currency: string }> {
  const [store, items] = await Promise.all([getStore(db), priceLines(db, lines)]);
  const d = await findDiscount(db, code);
  const fmt = (c: number) => formatMoney(c, store.currency, { compact: true });
  return { items, currency: store.currency, quote: quote(items.filter(i => i.available).map(i => ({ unitCents: i.unitCents, qty: i.qty })), delivery, store, d, code?.trim() || null, fmt) };
}

export const PlaceOrderInput = z.object({
  lines: Lines,
  delivery: z.enum(["standard", "express", "pickup"]),
  payment: z.enum(["cod", "card"]),
  discountCode: z.string().trim().max(30).optional().nullable(),
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email.").max(120),
  phone: z.string().trim().max(30).default(""),
  address: z.object({
    line1: z.string().trim().max(120), line2: z.string().trim().max(120).default(""),
    city: z.string().trim().max(80), postcode: z.string().trim().max(20), country: z.string().trim().max(60),
  }).nullable(),
  /** Total the customer saw. If prices changed in the meantime we stop and show the new total. */
  expectedTotalCents: z.number().int().nonnegative(),
}).superRefine((v, ctx) => {
  if (v.delivery !== "pickup" && (!v.address || !v.address.line1 || !v.address.city || !v.address.postcode))
    ctx.addIssue({ code: "custom", message: "Please complete your delivery address.", path: ["address"] });
});
export type PlaceOrderInput = z.input<typeof PlaceOrderInput>;

/**
 * Place an order atomically: stock is decremented with a conditional UPDATE (stock >= qty) inside one
 * transaction, so two shoppers can never buy the last unit. The stock check constraint is the final guard.
 */
export async function placeOrder(db: Db, raw: PlaceOrderInput, now = Date.now()) {
  const input = PlaceOrderInput.parse(raw);
  const { items, quote: q } = await getQuote(db, input.lines, input.delivery, input.discountCode);
  const unavailable = items.filter(i => !i.available);
  if (unavailable.length) throw new AppError("OUT_OF_STOCK", `${unavailable.map(i => `${i.name} (${i.size})`).join(", ")} ${unavailable.length > 1 ? "are" : "is"} no longer available in that quantity.`);
  if (items.length === 0) throw new AppError("INVALID", "Your bag is empty.");
  if (input.discountCode && q.discountError) throw new AppError("INVALID", q.discountError);
  if (q.totalCents !== input.expectedTotalCents) throw new AppError("PRICE_CHANGED", "Prices changed since you opened checkout. Please review the new total.");

  return db.transaction(async tx => {
    for (const i of items) {
      const done = await tx.update(t.variants).set({ stock: sql`${t.variants.stock} - ${i.qty}` })
        .where(and(eq(t.variants.id, i.variantId), gte(t.variants.stock, i.qty))).returning({ id: t.variants.id });
      if (!done.length) throw new AppError("OUT_OF_STOCK", `Sorry, ${i.name} (${i.size}) just sold out.`);
    }
    if (q.discountCode) {
      const used = await tx.update(t.discounts).set({ used: sql`${t.discounts.used} + 1` })
        .where(and(eq(t.discounts.code, q.discountCode), sql`(${t.discounts.usageLimit} is null or ${t.discounts.used} < ${t.discounts.usageLimit})`)).returning({ id: t.discounts.id });
      if (!used.length) throw new AppError("INVALID", "That code has been fully used.");
    }
    const [customer] = await tx.insert(t.customers).values({ name: input.name, email: input.email.toLowerCase(), phone: input.phone })
      .onConflictDoUpdate({ target: t.customers.email, set: { name: input.name, ...(input.phone ? { phone: input.phone } : {}) } }).returning();
    const seq = (await tx.execute(sql`select nextval('order_number_seq')::int as n`) as unknown as { rows: { n: number }[] }).rows[0].n;
    const status = input.payment === "card" ? "paid" : "placed";
    const [order] = await tx.insert(t.orders).values({
      number: orderNumber(seq), token: randomBytes(24).toString("base64url"), customerId: customer.id, status,
      delivery: input.delivery, payment: input.payment, address: input.delivery === "pickup" ? null : input.address,
      subtotalCents: q.subtotalCents, discountCents: q.discountCents, shippingCents: q.shippingCents, totalCents: q.totalCents,
      discountCode: q.discountCode, createdAt: new Date(now),
    }).returning();
    await tx.insert(t.orderItems).values(items.map(i => ({ orderId: order.id, variantId: i.variantId, productId: i.productId, name: i.name, color: i.color, size: i.size, image: i.image, unitCents: i.unitCents, qty: i.qty })));
    await tx.insert(t.orderEvents).values([{ orderId: order.id, status: "placed" as const, at: new Date(now) }, ...(status === "paid" ? [{ orderId: order.id, status: "paid" as const, note: "Card (demo, no charge)", at: new Date(now) }] : [])]);
    return order;
  });
}
