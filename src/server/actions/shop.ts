"use server";

import { z } from "zod";
import { db } from "../db/client";
import { AppError, toResult } from "../errors";
import { CartLine, getQuote, placeOrder } from "../services/checkout";

// Server actions are public endpoints: validate every argument.
const Lines = z.array(CartLine).max(30);
const Delivery = z.enum(["standard", "express", "pickup"]);

export async function quoteAction(lines: unknown, delivery: unknown = "standard", code: unknown = null) {
  return toResult(async () => {
    const l = Lines.parse(lines);
    if (!l.length) return null;
    return getQuote(await db(), l, Delivery.parse(delivery), z.string().max(30).nullable().parse(code));
  });
}

export async function placeOrderAction(input: unknown) {
  return toResult(async () => {
    try {
      const o = await placeOrder(await db(), input as never);
      return { token: o.token, number: o.number };
    } catch (e) {
      if (e instanceof z.ZodError) throw new AppError("INVALID", e.issues[0]?.message ?? "Please check your details.");
      throw e;
    }
  });
}
