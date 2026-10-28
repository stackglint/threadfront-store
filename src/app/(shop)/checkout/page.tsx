import type { Metadata } from "next";
import { Checkout } from "@/components/shop/Checkout";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page() {
  const s = await getStore(await db());
  return <Checkout currency={s.currency} shipping={s.shippingCents} express={s.expressCents} freeOver={s.freeShippingOverCents} />;
}
