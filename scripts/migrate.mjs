import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.resolve("supabase/migrations");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const sql = await readFile(path.join(dir, f), "utf8");
  console.log(`Applying ${f}...`);
  await client.query(sql);
}
await client.end();
console.log("Migrations applied.");
