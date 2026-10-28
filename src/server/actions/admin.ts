"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ORDER_STATUSES } from "@/domain/orders";
import { requireAdmin, signIn, signOut } from "../auth/session";
import { db } from "../db/client";
import * as t from "../db/schema";
import { resetAndSeed } from "../db/seed";
import { AppError, toResult } from "../errors";
import { setOrderStatus } from "../services/orders";

const Id = z.uuid();
const attempts = new Map<string, { n: number; until: number }>();

export async function loginAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  const email = String(form.get("email") ?? ""), password = String(form.get("password") ?? "");
  const key = email.toLowerCase(), a = attempts.get(key);
  if (a && a.until > Date.now()) return { error: "Too many attempts. Try again in a minute." };
  if (!(await signIn(email, password))) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(key, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return { error: "Email or password is incorrect." };
  }
  attempts.delete(key);
  redirect("/admin");
}

export async function logoutAction() { await signOut(); redirect("/admin/login"); }

const refresh = () => { revalidatePath("/admin", "layout"); revalidatePath("/", "layout"); };

export async function setOrderStatusAction(id: string, status: string) {
  await requireAdmin();
  return toResult(async () => { await setOrderStatus(await db(), Id.parse(id), z.enum(ORDER_STATUSES).parse(status)); refresh(); });
}

const ProductUpdate = z.object({
  id: z.uuid(),
  priceCents: z.number().int().min(100).max(10_000_000),
  compareAtCents: z.number().int().max(10_000_000).nullable(),
  active: z.boolean(),
  stock: z.array(z.object({ variantId: z.uuid(), stock: z.number().int().min(0).max(100_000) })).max(60),
}).refine(v => v.compareAtCents === null || v.compareAtCents > v.priceCents, "The “was” price must be higher than the price.");

export async function updateProductAction(input: unknown) {
  await requireAdmin();
  return toResult(async () => {
    const r = ProductUpdate.safeParse(input);
    if (!r.success) throw new AppError("INVALID", r.error.issues[0]?.message ?? "Check the values.");
    const v = r.data, d = await db();
    await d.transaction(async tx => {
      await tx.update(t.products).set({ priceCents: v.priceCents, compareAtCents: v.compareAtCents, active: v.active }).where(eq(t.products.id, v.id));
      for (const s of v.stock) await tx.update(t.variants).set({ stock: s.stock }).where(eq(t.variants.id, s.variantId));
    });
    refresh();
  });
}

const DiscountIn = z.object({
  code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9]+$/, "Letters and numbers only.").transform(s => s.toUpperCase()),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().positive(),
  minSpendCents: z.number().int().min(0).max(10_000_000),
  usageLimit: z.number().int().positive().nullable(),
}).refine(v => v.kind !== "percent" || (v.value >= 1 && v.value <= 90), "Percent must be between 1 and 90.");

export async function createDiscountAction(input: unknown) {
  await requireAdmin();
  return toResult(async () => {
    const r = DiscountIn.safeParse(input);
    if (!r.success) throw new AppError("INVALID", r.error.issues[0]?.message ?? "Check the values.");
    const d = await db();
    const [exists] = await d.select().from(t.discounts).where(eq(t.discounts.code, r.data.code));
    if (exists) throw new AppError("INVALID", "That code already exists.");
    await d.insert(t.discounts).values(r.data);
    refresh();
  });
}

export async function toggleDiscountAction(id: string, active: boolean) {
  await requireAdmin();
  return toResult(async () => { await (await db()).update(t.discounts).set({ active: z.boolean().parse(active) }).where(eq(t.discounts.id, Id.parse(id))); refresh(); });
}

export async function resetDemoAction() {
  await requireAdmin();
  return toResult(async () => { await resetAndSeed(await db()); refresh(); });
}
