"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IClose, IFilter } from "../icons";

/** Bottom sheet with the filter panel on small screens. Closes itself when the filters (URL) change. */
export function MobileFilters({ count, children }: { count: number; children: React.ReactNode }) {
  const key = usePathname() + "?" + useSearchParams().toString();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === key;
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpenAt(key)} className="flex h-11 items-center gap-2 border border-line bg-white px-4 text-[13px] font-semibold uppercase tracking-[.12em]">
        <IFilter className="size-4" />Filters{count > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink text-[10px] text-white">{count}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="fade absolute inset-0 bg-ink/40" onClick={() => setOpenAt(null)} />
          <div className="slide-up absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto bg-paper p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><span className="text-[13px] font-semibold uppercase tracking-[.16em]">Filters</span>
              <button type="button" onClick={() => setOpenAt(null)} className="grid size-10 place-items-center" aria-label="Close filters"><IClose /></button></div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
