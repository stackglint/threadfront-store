import { BagProvider } from "@/components/shop/Bag";
import { Footer, Header } from "@/components/shop/Chrome";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore(await db());
  return (
    <BagProvider currency={store.currency} freeOver={store.freeShippingOverCents}>
      <Header name={store.name} promo={`Free shipping over ${formatMoney(store.freeShippingOverCents, store.currency, { compact: true })}`} />
      <main>{children}</main>
      <Footer name={store.name} />
    </BagProvider>
  );
}
