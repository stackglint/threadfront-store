import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { canMove, restocksOnCancel, type OrderStatus } from "../../domain/orders";
import type { Db } from "../db/create";
import * as t from "../db/schema";
import { AppError } from "../errors";

export async function getOrderByToken(db: Db, token: string) {
  const o = await db.query.orders.findFirst({ where: eq(t.orders.token, token), with: { items: true, events: { orderBy: asc(t.orderEvents.at) }, customer: true } });
  if (!o) throw new AppError("NOT_FOUND", "We couldn't find that order.");
  return o;
}

export async function getOrder(db: Db, id: string) {
  const o = await db.query.orders.findFirst({ where: eq(t.orders.id, id), with: { items: true, events: { orderBy: asc(t.orderEvents.at) }, customer: true } });
  if (!o) throw new AppError("NOT_FOUND", "Order not found.");
  return o;
}

/** Move an order along. Cancelling before shipping returns the units to stock in the same transaction. */
export async function setOrderStatus(db: Db, id: string, to: OrderStatus, now = Date.now()) {
  await db.transaction(async tx => {
    const [o] = await tx.select().from(t.orders).where(eq(t.orders.id, id)).for("update");
    if (!o) throw new AppError("NOT_FOUND", "Order not found.");
    if (!canMove(o.status, to)) throw new AppError("BAD_TRANSITION", `A ${o.status} order can't be marked ${to}.`);
    if (to === "cancelled" && restocksOnCancel(o.status)) {
      const items = await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, id));
      for (const i of items) await tx.update(t.variants).set({ stock: sql`${t.variants.stock} + ${i.qty}` }).where(eq(t.variants.id, i.variantId));
      if (o.discountCode) await tx.update(t.discounts).set({ used: sql`greatest(${t.discounts.used} - 1, 0)` }).where(eq(t.discounts.code, o.discountCode));
    }
    await tx.update(t.orders).set({ status: to }).where(eq(t.orders.id, id));
    await tx.insert(t.orderEvents).values({ orderId: id, status: to, note: to === "cancelled" && restocksOnCancel(o.status) ? "Items returned to stock" : "", at: new Date(now) });
  });
}

export type OrderFilter = { status?: OrderStatus | "all" | "open"; q?: string; limit?: number };

export async function listOrders(db: Db, f: OrderFilter = {}) {
  const rows = await db.query.orders.findMany({
    where: f.status === "open" ? sql`${t.orders.status} in ('placed','paid','packed')` : f.status && f.status !== "all" ? eq(t.orders.status, f.status) : undefined,
    with: { customer: true, items: true },
    orderBy: desc(t.orders.createdAt),
    limit: f.q ? 1000 : f.limit ?? 150,
  });
  if (!f.q) return rows;
  const q = f.q.toLowerCase();
  return rows.filter(o => [o.number, o.customer.name, o.customer.email, ...o.items.map(i => i.name)].some(s => s.toLowerCase().includes(q))).slice(0, f.limit ?? 150);
}

export async function ordersSince(db: Db, since: number) {
  return db.query.orders.findMany({ where: and(gte(t.orders.createdAt, new Date(since))), with: { items: true } });
}
