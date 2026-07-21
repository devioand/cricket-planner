import { Pool } from "pg";

/**
 * Single shared Postgres connection pool for the whole app.
 *
 * The same pool backs both Better Auth (authentication tables) and the
 * tournament data layer, so we get one place to manage connections and
 * transactional writes.
 *
 * We cache the pool on `globalThis` so Next.js hot-reloading in development
 * doesn't open a new pool (and leak connections) on every change.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon (pooled) Postgres connection string to .env.local"
  );
}

function createPool(): Pool {
  return new Pool({
    connectionString,
    // The Neon pooler requires TLS.
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
}

const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool = globalForDb.__pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgPool = pool;
}

/**
 * Run a function inside a single transaction, committing on success and
 * rolling back on any error. The callback receives a dedicated client that
 * MUST be used for every query in the transaction.
 */
export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
