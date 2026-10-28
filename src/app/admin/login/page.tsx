import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/server/auth/session";
import { ADMIN, EDITORIAL } from "@/server/db/seed-data";
import { img } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Store admin" };

export default async function Login() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block"><img src={img(EDITORIAL.rack, 1200, 1600)} alt="" className="absolute inset-0 size-full object-cover" /><div className="absolute inset-0 bg-ink/30" />
        <div className="absolute bottom-10 left-10 text-white"><div className="font-serif text-5xl">Sora & Sand</div><div className="mt-2 text-sm text-white/80">Store admin · powered by Threadfront</div></div></div>
      <div className="grid place-items-center px-4 py-12">
        <div className="rise w-full max-w-[400px]">
          <div className="font-serif text-4xl lg:hidden">Sora & Sand</div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight lg:mt-0">Sign in to your store</h1>
          <p className="mt-1 text-sm text-muted">Orders, stock, customers and discounts.</p>
          <LoginForm email={ADMIN.email} password={ADMIN.password} />
          <div className="mt-6 border border-line bg-white p-4 text-sm">
            <div className="font-semibold">Demo login (pre-filled)</div>
            <div className="mt-1 font-mono text-[13px] text-ink/75">{ADMIN.email} · {ADMIN.password}</div>
            <div className="mt-1 text-xs text-muted">Fictional store with sample data.</div>
          </div>
          <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-ink">← Back to the store</Link>
        </div>
      </div>
    </main>
  );
}
