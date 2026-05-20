import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const { Client } = pg;
const dbPassword = process.argv[2];

if (!dbPassword) {
  console.error("Usage: node scripts/migrate.mjs <DB_PASSWORD>");
  console.error("Find it in Supabase → Project Settings → Database");
  process.exit(1);
}

const client = new Client({
  host: "db.xrdeycakwdowzpuddwdl.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../supabase/migrations/001_initial.sql"),
  "utf8"
);

try {
  await client.connect();
  console.log("מחובר לבסיס הנתונים");
  await client.query(sql);
  console.log("Migration הצליח - כל הטבלאות נוצרו");
  await client.end();
} catch (err) {
  console.error("שגיאה:", err.message);
  await client.end();
  process.exit(1);
}
