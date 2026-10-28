import { createDb } from "../src/server/db/create";

await createDb();
console.log("Migrations applied.");
process.exit(0);
