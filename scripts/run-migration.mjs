import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url === "your_supabase_project_url") {
  console.error("ERROR: מלא את NEXT_PUBLIC_SUPABASE_URL ב-.env.local");
  process.exit(1);
}
if (!key || key === "your_supabase_service_role_key") {
  console.error("ERROR: מלא את SUPABASE_SERVICE_ROLE_KEY ב-.env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../supabase/migrations/001_initial.sql"),
  "utf8"
);

console.log("מריץ migration...");

const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(() => ({
  error: { message: "rpc not available" },
}));

if (error) {
  // Fallback: try direct query
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let failed = 0;
  for (const stmt of statements) {
    const { error: e } = await supabase.from("_dummy_").select().limit(0).throwOnError().catch(() => ({ error: null }));
    void e;
  }

  console.log("\nהמיגרציה לא ניתן להריץ אוטומטית עם anon key.");
  console.log("הדבק את תוכן הקובץ supabase/migrations/001_initial.sql ב-SQL Editor של Supabase.");
}

console.log("בדיקת חיבור...");
const { data, error: pingError } = await supabase
  .from("profile")
  .select("count")
  .limit(1);

if (pingError && pingError.code === "42P01") {
  console.log("טבלת profile לא קיימת עדיין - הרץ את ה-SQL migration קודם.");
} else if (pingError) {
  console.error("שגיאה:", pingError.message);
} else {
  console.log("החיבור תקין. הטבלאות קיימות.");
}
