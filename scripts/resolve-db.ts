/**
 * Resolves DATABASE_URL and DIRECT_URL based on DB_MODE before running Prisma CLI commands.
 * Usage: tsx scripts/resolve-db.ts <command>
 * Example: tsx scripts/resolve-db.ts npx prisma db push
 */
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

// Manually parse .env file (avoids dotenv dependency)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {}
}

loadEnv();

const mode = process.env.DB_MODE || "local";
const args = process.argv.slice(2).join(" ");

if (mode === "supabase") {
  process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  process.env.DIRECT_URL = process.env.SUPABASE_DIRECT_URL || process.env.DIRECT_URL;
  console.log("Using Supabase database");
} else {
  process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
  process.env.DIRECT_URL = process.env.LOCAL_DATABASE_URL || process.env.DIRECT_URL;
  console.log("Using local database");
}

try {
  execSync(args, { stdio: "inherit", env: process.env });
} catch {
  process.exit(1);
}
