import type {
  ICommercialRepository,
  IAuthRepository,
  IConfigRepository,
} from "./types";
import { JsonCommercialRepository } from "./json/json-commercial-repository";
import { JsonAuthRepository } from "./json/json-auth-repository";
import { JsonConfigRepository } from "./json/json-config-repository";
import { PostgresCommercialRepository } from "./postgres/postgres-commercial-repository";
import { PostgresAuthRepository } from "./postgres/postgres-auth-repository";
import { PostgresConfigRepository } from "./postgres/postgres-config-repository";

export * from "./types";
export { JsonCommercialRepository } from "./json/json-commercial-repository";
export { JsonAuthRepository } from "./json/json-auth-repository";
export { JsonConfigRepository } from "./json/json-config-repository";
export { PostgresCommercialRepository } from "./postgres/postgres-commercial-repository";
export { PostgresAuthRepository } from "./postgres/postgres-auth-repository";
export { PostgresConfigRepository } from "./postgres/postgres-config-repository";

// Proveedor de persistencia configurado (por defecto: "json")
export type StorageProvider = "json" | "postgres";

let commercialRepoInstance: ICommercialRepository | null = null;
let authRepoInstance: IAuthRepository | null = null;
let configRepoInstance: IConfigRepository | null = null;

export function getStorageProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || "json";
}

/**
 * Obtiene la instancia activa del repositorio comercial.
 * - JSON: JsonCommercialRepository (garantiza compatibilidad 100% con data/*.json).
 * - PostgreSQL: PostgresCommercialRepository (transacciones ACID nativas en Neon/PostgreSQL).
 */
export function getCommercialRepository(): ICommercialRepository {
  if (!commercialRepoInstance) {
    const provider = getStorageProvider();
    if (provider === "postgres") {
      commercialRepoInstance = new PostgresCommercialRepository();
    } else {
      commercialRepoInstance = new JsonCommercialRepository();
    }
  }
  return commercialRepoInstance;
}

/**
 * Obtiene la instancia activa del repositorio de usuarios y autenticación.
 */
export function getAuthRepository(): IAuthRepository {
  if (!authRepoInstance) {
    const provider = getStorageProvider();
    if (provider === "postgres") {
      authRepoInstance = new PostgresAuthRepository();
    } else {
      authRepoInstance = new JsonAuthRepository();
    }
  }
  return authRepoInstance;
}

/**
 * Obtiene la instancia activa del repositorio de configuración del sistema.
 */
export function getConfigRepository(): IConfigRepository {
  if (!configRepoInstance) {
    const provider = getStorageProvider();
    if (provider === "postgres") {
      configRepoInstance = new PostgresConfigRepository();
    } else {
      configRepoInstance = new JsonConfigRepository();
    }
  }
  return configRepoInstance;
}
