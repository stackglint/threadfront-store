import { createDb } from "../src/server/db/create";
import { seedIfEmpty } from "../src/server/db/seed";

const db = await createDb();
await seedIfEmpty(db);
console.log("Seed complete (skipped if data already existed).");
process.exit(0);
