import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "../src/server/db/create";
import * as t from "../src/server/db/schema";
import { seed } from "../src/server/db/seed";
import { getQuote, placeOrder, type PlaceOrderInput } from "../src/server/services/checkout";
import { setOrderStatus } from "../src/server/services/orders";
import { AppError } from "../src/server/errors";

// Integration tests on a real Postgres engine (PGlite in memory, or DATABASE_URL) with the real migrations.
let db: Db;
const addr = { line1: "1 Test Lane", line2: "", city: "Austin", postcode: "78701", country: "United States" };

async function variantWithStock(min: number) {
  const vs = await db.select().from(t.variants);
  return vs.find(v => v.stock >= min)!;
}
async function order(variantId: string, qty: number, extra: Partial<PlaceOrderInput> = {}) {
  const { quote } = await getQuote(db, [{ variantId, qty }], "standard", extra.discountCode ?? null);
  return placeOrder(db, { lines: [{ variantId, qty }], delivery: "standard", payment: "cod", name: "Test Buyer", email: "Buyer@Example.com", phone: "", address: addr, expectedTotalCents: quote.totalCents, ...extra });
}

describe("checkout (Postgres)", () => {
  before(async () => { db = await createDb({ dataDir: ":memory:" }); await seed(db); });

  it("places an order, decrements stock and snapshots the price", async () => {
    const v = await variantWithStock(3);
    const o = await order(v.id, 2);
    assert.match(o.number, /^SS-\d{5}$/);
    const [after] = await db.select().from(t.variants).where(eq(t.variants.id, v.id));
    assert.equal(after.stock, v.stock - 2);
    const items = await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, o.id));
    assert.equal(items[0].qty, 2);
    const [c] = await db.select().from(t.customers).where(eq(t.customers.id, o.customerId));
    assert.equal(c.email, "buyer@example.com");
  });

  it("never oversells: three shoppers race for the last unit, exactly one wins", async () => {
    const v = await variantWithStock(1);
    await db.update(t.variants).set({ stock: 1 }).where(eq(t.variants.id, v.id));
    const { quote } = await getQuote(db, [{ variantId: v.id, qty: 1 }], "standard");
    const attempt = (n: number) => placeOrder(db, { lines: [{ variantId: v.id, qty: 1 }], delivery: "standard", payment: "card", name: `Racer ${n}`, email: `racer${n}@example.com`, phone: "", address: addr, expectedTotalCents: quote.totalCents });
    const res = await Promise.allSettled([attempt(1), attempt(2), attempt(3)]);
    assert.equal(res.filter(r => r.status === "fulfilled").length, 1);
    assert.ok(res.filter(r => r.status === "rejected").every(r => (r.reason as AppError).code === "OUT_OF_STOCK"));
    const [after] = await db.select().from(t.variants).where(eq(t.variants.id, v.id));
    assert.equal(after.stock, 0);
  });

  it("the database refuses negative stock even if code tried", async () => {
    const v = await variantWithStock(0);
    await assert.rejects(db.update(t.variants).set({ stock: -1 }).where(eq(t.variants.id, v.id)), (e: { cause?: { code?: string } }) => e.cause?.code === "23514");
  });

  it("re-prices on the server and stops if the total the shopper saw is out of date", async () => {
    const v = await variantWithStock(1);
    const { quote } = await getQuote(db, [{ variantId: v.id, qty: 1 }], "standard");
    await assert.rejects(
      placeOrder(db, { lines: [{ variantId: v.id, qty: 1 }], delivery: "standard", payment: "cod", name: "Sneaky", email: "s@example.com", phone: "", address: addr, expectedTotalCents: quote.totalCents - 500 }),
      (e: AppError) => e.code === "PRICE_CHANGED");
  });

  it("applies a valid code and counts its use; rejects an inactive one", async () => {
    const v = await variantWithStock(1);
    const [before] = await db.select().from(t.discounts).where(eq(t.discounts.code, "WELCOME10"));
    const o = await order(v.id, 1, { discountCode: "welcome10" });
    assert.ok(o.discountCents > 0);
    const [after] = await db.select().from(t.discounts).where(eq(t.discounts.code, "WELCOME10"));
    assert.equal(after.used, before.used + 1);
    const v2 = await variantWithStock(1);
    await assert.rejects(order(v2.id, 1, { discountCode: "SUMMER25" }), (e: AppError) => e.code === "INVALID");
  });

  it("cancelling before shipping returns the units to stock", async () => {
    const v = await variantWithStock(2);
    const o = await order(v.id, 2);
    await setOrderStatus(db, o.id, "packed");
    await setOrderStatus(db, o.id, "cancelled");
    const [after] = await db.select().from(t.variants).where(eq(t.variants.id, v.id));
    assert.equal(after.stock, v.stock);
    await assert.rejects(setOrderStatus(db, o.id, "shipped"), (e: AppError) => e.code === "BAD_TRANSITION");
  });

  it("requires an address for delivery", async () => {
    const v = await variantWithStock(1);
    await assert.rejects(order(v.id, 1, { address: null }));
  });
});
