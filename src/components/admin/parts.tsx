import { cx } from "@/lib/format";

export const pageWrap = "mx-auto max-w-[1320px] space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10";

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-serif text-4xl leading-none sm:text-5xl">{title}</h1>{sub && <p className="mt-2 text-sm text-muted">{sub}</p>}</div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx("border border-line bg-white p-5 sm:p-6", className)}>{children}</section>;
}

export function Delta({ v, label }: { v: number | null; label?: string }) {
  if (v === null || !isFinite(v)) return <span className="text-xs text-muted">no baseline</span>;
  const up = v >= 0;
  return <span className={cx("inline-flex items-center gap-1 text-xs font-semibold tnum", up ? "text-good" : "text-sale")}>{up ? "↑" : "↓"} {Math.abs(v * 100).toFixed(0)}%{label && <span className="font-normal text-muted">{label}</span>}</span>;
}

export const statusTone = { placed: "neutral", paid: "good", packed: "warn", shipped: "ink", delivered: "good", cancelled: "sale" } as const;
