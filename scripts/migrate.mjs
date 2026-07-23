// Tracked SQL migration runner.
//
// Applies every db/migrations/*.sql that hasn't run yet against DATABASE_URL,
// recording each in a `schema_migrations` table so every environment (Neon
// branch) knows exactly what it has. Run it per-environment via the npm
// scripts, which load the right .env.*.local:
//
//   npm run migrate:dev    → Neon dev branch
//   npm run migrate:prod   → Neon production branch
//
// Flags:
//   --baseline   record pending files as applied WITHOUT running them
//                (used once to adopt a database whose schema already exists)
//   --status     print applied vs pending and exit
//
// Migrations run inside a transaction (per file), so no CREATE INDEX
// CONCURRENTLY. A file that changed after being applied is flagged (hash drift)
// — add a new migration instead of editing an old one.

import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const MIG_DIR = path.resolve(process.cwd(), "db/migrations");
const BASELINE = process.argv.includes("--baseline");
const STATUS = process.argv.includes("--status");

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("🚨 DATABASE_URL is not set. Run via `npm run migrate:dev` / `migrate:prod`.");
  process.exit(1);
}
// TLS is handled by the `ssl` option below, so strip channel_binding (pg can't
// do it) and sslmode (redundant; avoids pg's verify-full deprecation warning).
const connectionString = raw
  .replace(/([?&])(channel_binding|sslmode)=[^&]*/g, "$1")
  .replace(/[?&]+$/, "");

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/** Strip standalone BEGIN;/COMMIT; so we control one transaction per file. */
const unwrap = (sql) =>
  sql.replace(/^[ \t]*begin[ \t]*;[ \t]*$/gim, "").replace(/^[ \t]*commit[ \t]*;[ \t]*$/gim, "");

const host = connectionString.replace(/.*@([^/]+)\/.*/, "$1");
console.log(`▶ migrate${BASELINE ? " --baseline" : STATUS ? " --status" : ""} → ${host}`);

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 });
const client = await pool.connect();
let failed = false;
try {
  await client.query(
    `create table if not exists public.schema_migrations (
       id text primary key,
       hash text not null,
       applied_at timestamptz not null default now()
     )`,
  );
  const applied = new Map(
    (await client.query(`select id, hash from public.schema_migrations`)).rows.map((r) => [r.id, r.hash]),
  );
  const files = (await readdir(MIG_DIR)).filter((f) => f.endsWith(".sql")).sort();

  if (STATUS) {
    for (const f of files) console.log(`  ${applied.has(f) ? "✔ applied " : "· pending "} ${f}`);
    process.exit(0);
  }

  let ran = 0;
  for (const f of files) {
    const sql = await readFile(path.join(MIG_DIR, f), "utf8");
    const hash = sha(sql);
    if (applied.has(f)) {
      if (applied.get(f) !== hash) {
        console.error(`  🚨 ${f} — changed since it was applied (hash drift). Add a NEW migration instead.`);
        failed = true;
      } else {
        console.log(`  = ${f} (already applied)`);
      }
      continue;
    }
    if (BASELINE) {
      await client.query(`insert into public.schema_migrations (id, hash) values ($1, $2)`, [f, hash]);
      console.log(`  ⦿ ${f} (baselined — recorded, not run)`);
      ran++;
      continue;
    }
    try {
      await client.query("begin");
      await client.query(unwrap(sql));
      await client.query(`insert into public.schema_migrations (id, hash) values ($1, $2)`, [f, hash]);
      await client.query("commit");
      console.log(`  ✔ ${f} (applied)`);
      ran++;
    } catch (e) {
      await client.query("rollback");
      console.error(`  🚨 ${f} FAILED — rolled back: ${e.message}`);
      failed = true;
      break;
    }
  }
  console.log(failed ? "✗ finished with errors" : `✅ up to date (${ran} ${BASELINE ? "baselined" : "applied"} this run)`);
} finally {
  client.release();
  await pool.end();
}
process.exit(failed ? 1 : 0);
