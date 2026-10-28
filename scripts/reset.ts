import { createDb } from "../src/server/db/create";
import { resetAndSeed } from "../src/server/db/seed";

const db = await createDb();
await resetAndSeed(db);
console.log("Database reset with fresh demo data.");
process.exit(0);
