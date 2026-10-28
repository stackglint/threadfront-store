import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/** Both drivers share the Postgres query builder, so the rest of the app sees one type. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

type Options = { url?: string; dataDir?: string; seedIfEmpty?: boolean };

/**
 * DATABASE_URL set  -> real PostgreSQL (production, Docker).
 * Not set           -> embedded PostgreSQL (PGlite) in ./.data, zero setup for local dev and demos.
 */
export async function createDb(opts: Options = {}): Promise<Db> {
  const url = opts.url ?? process.env.DATABASE_URL;
  let db: Db;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 10 });
    const pg = drizzlePg(pool, { schema });
    await migratePg(pg, { migrationsFolder: MIGRATIONS });
    db = pg as unknown as Db;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = opts.dataDir ?? process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
    if (dir !== ":memory:") mkdirSync(dir, { recursive: true });
    const client = await PGlite.create(dir === ":memory:" ? undefined : dir);
    const lite = drizzleLite(client, { schema });
    await migrateLite(lite, { migrationsFolder: MIGRATIONS });
    db = lite as unknown as Db;
  }
  if (opts.seedIfEmpty) {
    const { seedIfEmpty } = await import("./seed");
    await seedIfEmpty(db);
  }
  return db;
}

