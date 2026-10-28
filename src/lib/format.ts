export { formatMoney } from "@/domain/money";

export const img = (url: string, w: number, h?: number) => `${url}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=72`;

export function cx(...a: (string | false | null | undefined)[]) { return a.filter(Boolean).join(" "); }

export const fmtDate = (ms: number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("en-US", opts).format(ms);

export const initials = (name: string) => name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
