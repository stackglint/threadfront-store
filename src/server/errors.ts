/** Expected failures the UI can show to people. Anything else is a bug and is logged. */
export class AppError extends Error {
  constructor(public code: "OUT_OF_STOCK" | "PRICE_CHANGED" | "NOT_FOUND" | "INVALID" | "FORBIDDEN" | "BAD_TRANSITION", message: string) {
    super(message);
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; error: string };

export async function toResult<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, code: e.code, error: e.message };
    console.error(e);
    return { ok: false, code: "UNKNOWN", error: "Something went wrong. Please try again." };
  }
}
