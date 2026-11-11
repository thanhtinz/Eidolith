import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();
for (const file of files) {
  const sql = await readFile(join(dir, file), "utf8");
  await pool.query(sql);
  console.log(`applied ${file}`);
}
await pool.end();
console.log("migrations done");
