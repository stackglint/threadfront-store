"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { logoutAction, resetDemoAction } from "@/server/actions/admin";
import { cx } from "@/lib/format";
import { DemoChip } from "../ui";
import { IBag, IBox, IClose, IExternal, IGrid, ILogout, IMenu, IReset, ISpark, IUsers } from "../icons";

const NAV = [
  { href: "/admin", label: "Overview", icon: IGrid },
  { href: "/admin/orders", label: "Orders", icon: IBag },
  { href: "/admin/products", label: "Products & stock", icon: IBox },
  { href: "/admin/customers", label: "Customers", icon: IUsers },
  { href: "/admin/discounts", label: "Discounts", icon: ISpark },
];

export function AdminShell({ user, store, children }: { user: string; store: string; children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const open = openAt === path;
  useEffect(() => { if (!confirm) return; const t = setTimeout(() => setConfirm(false), 3500); return () => clearTimeout(t); }, [confirm]);
  const reset = () => { if (!confirm) return setConfirm(true); setConfirm(false); start(async () => { await resetDemoAction(); router.refresh(); }); };

  const side = (
    <div className="flex h-full flex-col text-white">
      <div className="px-2"><div className="font-serif text-2xl">{store}</div><div className="mt-0.5 text-[11px] uppercase tracking-[.16em] text-white/50">Threadfront admin</div></div>
      <nav className="mt-8 flex-1 space-y-1" aria-label="Admin">
        {NAV.map(n => {
          const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
          const Icon = n.icon;
          return <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cx("flex h-11 items-center gap-3 px-3 text-sm font-medium transition", active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white")}><Icon className="size-[18px]" />{n.label}</Link>;
        })}
      </nav>
      <div className="space-y-1">
        <a href="/" target="_blank" className="flex h-10 items-center gap-2 px-3 text-sm text-white/70 hover:text-white"><IExternal className="size-4" />View store</a>
        <button type="button" onClick={reset} disabled={pending} className={cx("flex h-10 w-full items-center gap-2 px-3 text-sm transition", confirm ? "bg-sale/20 text-white" : "text-white/70 hover:text-white")}>
          <IReset className={cx("size-4", pending && "animate-spin")} />{pending ? "Resetting…" : confirm ? "Click again to reset" : "Reset demo data"}
        </button>
        <div className="mt-2 flex items-center justify-between border-t border-white/10 px-2 pt-3">
          <div className="min-w-0"><div className="truncate text-sm font-medium">{user}</div><DemoChip className="mt-1 text-white/60" /></div>
          <form action={logoutAction}><button className="grid size-9 place-items-center text-white/60 hover:text-white" aria-label="Sign out"><ILogout className="size-4" /></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F3F1ED] lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 bg-ink p-5 lg:block">{side}</aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <button type="button" onClick={() => setOpenAt(path)} className="grid size-10 place-items-center" aria-label="Open menu"><IMenu /></button>
        <span className="font-serif text-xl">{store}</span><DemoChip className="text-white/70" />
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade absolute inset-0 bg-ink/50" onClick={() => setOpenAt(null)} />
          <div className="slide-in absolute inset-y-0 left-0 w-[270px] bg-ink p-5 [animation-name:fade]">
            <button type="button" onClick={() => setOpenAt(null)} className="absolute right-3 top-3 grid size-9 place-items-center text-white" aria-label="Close menu"><IClose className="size-4" /></button>
            {side}
          </div>
        </div>
      )}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
