import { cx } from "@/lib/format";

export const btn = {
  primary: "inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[13px] font-semibold uppercase tracking-[.14em] text-white transition hover:bg-clay active:scale-[.99] disabled:pointer-events-none disabled:opacity-40",
  outline: "inline-flex h-12 items-center justify-center gap-2 border border-ink px-7 text-[13px] font-semibold uppercase tracking-[.14em] transition hover:bg-ink hover:text-white disabled:opacity-40",
  ghost: "inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-medium text-ink/75 transition hover:text-ink",
};

export const field = "h-12 w-full border border-line bg-white px-4 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-ink";

export function DemoChip({ className = "" }: { className?: string }) {
  return <span className={cx("inline-flex items-center gap-1.5 border border-current px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.16em]", className)}>Demo</span>;
}

export function Price({ cents, compareAt, fmt, className = "" }: { cents: number; compareAt?: number | null; fmt: (c: number) => string; className?: string }) {
  return (
    <span className={cx("tnum", className)}>
      {compareAt ? <><span className="text-sale">{fmt(cents)}</span> <s className="ml-1 text-muted">{fmt(compareAt)}</s></> : fmt(cents)}
    </span>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "sale" | "ink"; children: React.ReactNode }) {
  const t = { neutral: "bg-white/90 text-ink backdrop-blur", good: "bg-good/10 text-good", warn: "bg-warn/12 text-warn", sale: "bg-sale text-white", ink: "bg-ink text-white" }[tone];
  return <span className={cx("inline-flex h-6 items-center whitespace-nowrap px-2 text-[11px] font-semibold uppercase tracking-[.08em]", t)}>{children}</span>;
}
