import "server-only";
import { createDb, type Db } from "./create";

// One connection per server process (survives Next.js dev hot reloads).
// A failed start is not cached, so the next request retries instead of staying broken.
const g = globalThis as unknown as { __threadfrontDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__threadfrontDb ??= createDb({ seedIfEmpty: true }).catch(e => { g.__threadfrontDb = undefined; throw e; });
  return g.__threadfrontDb;
}
