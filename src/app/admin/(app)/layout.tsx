import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getStore } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const store = await getStore(await db());
  return <AdminShell user={session.name} store={store.name}>{children}</AdminShell>;
}
