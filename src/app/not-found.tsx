import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.24em] text-muted">404</p>
        <h1 className="mt-3 font-serif text-6xl">Not found</h1>
        <p className="mt-3 text-muted">That page or order doesn&apos;t exist.</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center bg-ink px-7 text-[13px] font-semibold uppercase tracking-[.14em] text-white">Back to the store</Link>
      </div>
    </main>
  );
}
