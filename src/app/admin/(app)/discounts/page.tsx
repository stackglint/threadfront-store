import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { PageHead, pageWrap } from "@/components/admin/parts";
import { Discounts } from "@/components/admin/Discounts";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getStore } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Discounts" };

export default async function Page() {
  const d = await db();
  const [store, rows] = await Promise.all([getStore(d), d.select().from(t.discounts).orderBy(desc(t.discounts.createdAt))]);
  return (
    <div className={pageWrap}>
      <PageHead title="Discounts" sub="Codes customers enter at checkout. Usage is counted when an order is placed and released if it's cancelled." />
      <Discounts currency={store.currency} rows={rows.map(r => ({ id: r.id, code: r.code, kind: r.kind, value: r.value, minSpendCents: r.minSpendCents, usageLimit: r.usageLimit, used: r.used, active: r.active }))} />
    </div>
  );
}
