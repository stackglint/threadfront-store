import type { Metadata } from "next";
import { Wishlist } from "@/components/shop/Wishlist";
import { toCard } from "@/lib/dto";
import { db } from "@/server/db/client";
import { nowMs } from "@/server/clock";
import { getStore, listProducts } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Wishlist" };

export default async function Page() {
  const d = await db();
  const [store, all] = await Promise.all([getStore(d), listProducts(d)]);
  return <Wishlist currency={store.currency} products={all.map(p => toCard(p, store.lowStockAt, nowMs()))} />;
}
