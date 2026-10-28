/** Pure pricing rules. The server always re-prices from the database; client prices are never trusted. */

export type PricedLine = { unitCents: number; qty: number };
export type Delivery = "standard" | "express" | "pickup";
export type Discount = { code: string; kind: "percent" | "fixed"; value: number; minSpendCents: number; active: boolean; usageLimit: number | null; used: number };
export type ShippingRules = { shippingCents: number; expressCents: number; freeShippingOverCents: number };

export type Quote = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  discountCode: string | null;
  discountError: string | null;
  freeShippingRemainingCents: number;
};

export const MAX_QTY = 10;

export const subtotal = (lines: PricedLine[]) => lines.reduce((a, l) => a + l.unitCents * l.qty, 0);

/** Returns null when the code can be used, otherwise a message people can understand. */
export function discountProblem(d: Discount | null, sub: number, currencyFmt: (c: number) => string): string | null {
  if (!d || !d.active) return "That code isn't valid.";
  if (d.usageLimit !== null && d.used >= d.usageLimit) return "That code has been fully used.";
  if (sub < d.minSpendCents) return `Spend ${currencyFmt(d.minSpendCents)} or more to use this code.`;
  return null;
}

export function discountAmount(d: Discount, sub: number): number {
  const raw = d.kind === "percent" ? Math.round((sub * d.value) / 100) : d.value;
  return Math.min(raw, sub); // never below zero
}

/** Shipping is based on the amount after discount, so a code can't be used to sneak under the threshold unfairly either way. */
export function shippingFor(delivery: Delivery, afterDiscount: number, r: ShippingRules): number {
  if (delivery === "pickup") return 0;
  if (delivery === "express") return r.expressCents;
  return afterDiscount >= r.freeShippingOverCents ? 0 : r.shippingCents;
}

export function quote(lines: PricedLine[], delivery: Delivery, rules: ShippingRules, d: Discount | null, codeEntered: string | null, fmt: (c: number) => string): Quote {
  const sub = subtotal(lines);
  let discountCents = 0, discountError: string | null = null, discountCode: string | null = null;
  if (codeEntered) {
    discountError = discountProblem(d, sub, fmt);
    if (!discountError && d) { discountCents = discountAmount(d, sub); discountCode = d.code; }
  }
  const after = sub - discountCents;
  const shippingCents = shippingFor(delivery, after, rules);
  return {
    subtotalCents: sub, discountCents, shippingCents, totalCents: after + shippingCents, discountCode, discountError,
    freeShippingRemainingCents: Math.max(0, rules.freeShippingOverCents - after),
  };
}
