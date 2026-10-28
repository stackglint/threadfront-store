"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS, type SortKey } from "@/domain/catalog";

export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  return (
    <label className="relative min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Sort by</span>
      <select value={value} onChange={e => { const u = new URLSearchParams(sp.toString()); if (e.target.value === "featured") u.delete("sort"); else u.set("sort", e.target.value); router.push(`${path}${u.size ? `?${u}` : ""}`, { scroll: false }); }}
        className="h-11 w-full cursor-pointer appearance-none border border-line bg-white pl-4 pr-10 text-[13px] font-semibold uppercase tracking-[.12em] outline-none focus:border-ink">
        {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9l6 6 6-6" /></svg>
    </label>
  );
}
