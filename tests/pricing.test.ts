import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discountAmount, discountProblem, quote, shippingFor, type Discount } from "../src/domain/pricing";
import { canMove, orderNumber, restocksOnCancel } from "../src/domain/orders";
import { stockLevel } from "../src/domain/catalog";

const rules = { shippingCents: 600, expressCents: 1500, freeShippingOverCents: 12000 };
const fmt = (c: number) => `$${c / 100}`;
const d = (over: Partial<Discount> = {}): Discount => ({ code: "WELCOME10", kind: "percent", value: 10, minSpendCents: 0, active: true, usageLimit: null, used: 0, ...over });

describe("pricing", () => {
  it("adds standard shipping under the free-shipping threshold", () => {
    const q = quote([{ unitCents: 3200, qty: 2 }], "standard", rules, null, null, fmt);
    assert.deepEqual([q.subtotalCents, q.shippingCents, q.totalCents, q.freeShippingRemainingCents], [6400, 600, 7000, 5600]);
  });

  it("ships free at or above the threshold, express is always charged, pickup is free", () => {
    assert.equal(shippingFor("standard", 12000, rules), 0);
    assert.equal(shippingFor("express", 50000, rules), 1500);
    assert.equal(shippingFor("pickup", 100, rules), 0);
  });

  it("applies percentage and fixed codes, never below zero", () => {
    assert.equal(discountAmount(d(), 9999), 1000);
    assert.equal(discountAmount(d({ kind: "fixed", value: 2000 }), 1500), 1500);
  });

  it("uses the discounted amount for the free-shipping threshold", () => {
    const q = quote([{ unitCents: 12500, qty: 1 }], "standard", rules, d(), "welcome10", fmt);
    assert.equal(q.discountCents, 1250);
    assert.equal(q.shippingCents, 600); // 11,250 after discount is under 12,000
    assert.equal(q.totalCents, 12500 - 1250 + 600);
  });

  it("explains why a code can't be used", () => {
    assert.match(discountProblem(null, 5000, fmt)!, /isn't valid/);
    assert.match(discountProblem(d({ active: false }), 5000, fmt)!, /isn't valid/);
    assert.match(discountProblem(d({ usageLimit: 5, used: 5 }), 5000, fmt)!, /fully used/);
    assert.match(discountProblem(d({ minSpendCents: 15000 }), 5000, fmt)!, /Spend \$150/);
    assert.equal(discountProblem(d(), 5000, fmt), null);
  });
});

describe("order rules", () => {
  it("only allows forward moves, and cancelling before shipping", () => {
    assert.ok(canMove("placed", "packed"));
    assert.ok(canMove("packed", "shipped"));
    assert.ok(!canMove("shipped", "cancelled"));
    assert.ok(!canMove("delivered", "shipped"));
    assert.ok(restocksOnCancel("packed"));
    assert.ok(!restocksOnCancel("shipped"));
  });
  it("formats order numbers and stock levels", () => {
    assert.equal(orderNumber(10042), "SS-10042");
    assert.equal(stockLevel(0, 3), "out");
    assert.equal(stockLevel(2, 3), "low");
    assert.equal(stockLevel(9, 3), "in");
  });
});
