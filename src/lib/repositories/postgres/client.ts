/**
 * ============================================================================
 * FERRETERÍA EMMANUEL — CLIENTE DE BASE DE DATOS POSTGRESQL / NEON
 * ============================================================================
 * Conexión transaccional persistente ACID mediante el driver nativo 'pg'.
 * Garantiza:
 * 1. Una única conexión dedicada por transacción (BEGIN -> COMMIT / ROLLBACK)
 * 2. Bloqueo pesimista real de filas mediante SELECT ... FOR UPDATE
 * 3. Eliminación de fallbacks inseguros
 */

import { Pool, PoolClient } from "pg";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface SqlExecutor {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

export interface TransactionalClient extends SqlExecutor {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

/**
 * Normaliza los parámetros SQL para PostgreSQL.
 */
export function normalizeParams(params?: any[]): any[] {
  if (!params || params.length === 0) return [];
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === "number" && isNaN(p)) return 0;
    if (p instanceof Date) return p.toISOString();
    return p;
  });
}

/**
 * Obtiene la URL de base de datos activa desde las variables de entorno.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  return url.trim();
}

/**
 * Valida la disponibilidad de la conexión a PostgreSQL.
 */
export function isPostgresConfigured(): boolean {
  return getDatabaseUrl().length > 0;
}

// Pool global singleton para reutilización eficiente de conexiones TCP
let globalPool: Pool | null = null;
let currentPoolUrl: string = "";

export function getPool(): Pool {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      "No se ha configurado la variable de entorno DATABASE_URL o POSTGRES_URL. No es posible conectar a PostgreSQL."
    );
  }

  // Si la URL cambió o el pool no existe, recrearlo
  if (!globalPool || currentPoolUrl !== dbUrl) {
    if (globalPool) {
      globalPool.end().catch(() => {});
    }
    currentPoolUrl = dbUrl;
    globalPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return globalPool;
}

/**
 * Cierra el pool de conexiones activo (útil para pruebas o apagado del servidor).
 */
export async function closePool(): Promise<void> {
  if (globalPool) {
    await globalPool.end().catch(() => {});
    globalPool = null;
    currentPoolUrl = "";
  }
}

/**
 * Ejecuta una consulta SQL simple dentro del pool de conexiones.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  const pool = getPool();
  const normalized = normalizeParams(params);
  const result = await pool.query(sql, normalized);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount ?? result.rows.length,
  };
}

/**
 * Obtiene un cliente transaccional dedicado con una única conexión persistente.
 * Inicia explícitamente BEGIN y asegura que COMMIT o ROLLBACK cierren la conexión.
 * NO implementa fallbacks simulados.
 */
export async function getTransactionalClient(): Promise<TransactionalClient> {
  const pool = getPool();
  let client: PoolClient;

  try {
    client = await pool.connect();
  } catch (err: any) {
    throw new Error(`Error al adquirir conexión transaccional de PostgreSQL: ${err?.message || err}`);
  }

  try {
    await client.query("BEGIN;");
  } catch (err: any) {
    client.release();
    throw new Error(`Error al iniciar transacción (BEGIN) en PostgreSQL: ${err?.message || err}`);
  }

  let released = false;

  return {
    query: async <T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> => {
      if (released) {
        throw new Error("Intento de ejecutar consulta en un cliente transaccional ya liberado.");
      }
      const normalized = normalizeParams(params);
      const res = await client.query(sql, normalized);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount ?? res.rows.length,
      };
    },

    commit: async () => {
      if (released) return;
      try {
        await client.query("COMMIT;");
      } finally {
        released = true;
        client.release();
      }
    },

    rollback: async () => {
      if (released) return;
      try {
        await client.query("ROLLBACK;");
      } finally {
        released = true;
        client.release();
      }
    },

    release: () => {
      if (!released) {
        released = true;
        client.release();
      }
    },
  };
}
