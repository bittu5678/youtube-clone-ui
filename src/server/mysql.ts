import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

try {
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });
} catch (_e) {
  // Ignore
}

export interface DbConfig {
  host?: string;
  port: number;
  database?: string;
  user?: string;
  password?: string;
  isConfigured: boolean;
}

export function getDbConfig(): DbConfig {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "";

  // Verify that required connection parameters exist
  const isConfigured = Boolean(host && database && user);

  return {
    host,
    port,
    database,
    user,
    password,
    isConfigured,
  };
}

let pool: mysql.Pool | null = null;

export function getMysqlPool(): mysql.Pool | null {
  const conf = getDbConfig();
  if (!conf.isConfigured) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: conf.host,
      port: conf.port,
      user: conf.user,
      password: conf.password,
      database: conf.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  return pool;
}

/**
 * Verifies live MySQL connection health and returns safe diagnostics
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  host?: string;
  database?: string;
  user?: string;
}> {
  const conf = getDbConfig();
  if (!conf.isConfigured) {
    return {
      connected: false,
      error:
        "MySQL configuration missing. Please define DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD in .env",
      host: conf.host || "NOT_SET",
      database: conf.database || "NOT_SET",
      user: conf.user || "NOT_SET",
    };
  }

  try {
    const p = getMysqlPool();
    if (!p) throw new Error("Could not initialize MySQL connection pool");
    const connection = await p.getConnection();
    try {
      await connection.ping();
      return {
        connected: true,
        host: conf.host,
        database: conf.database,
        user: conf.user ? `${conf.user.slice(0, 3)}***` : "SET",
      };
    } finally {
      connection.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      error: `MySQL connection failed: ${msg}`,
      host: conf.host,
      database: conf.database,
      user: conf.user,
    };
  }
}
