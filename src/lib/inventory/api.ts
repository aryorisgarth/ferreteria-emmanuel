import "server-only";

/**
 * Fachada pública del API de inventario y acceso a datos multi-proveedor.
 * Re-exporta los submódulos especializados de src/lib/inventory/api/ (<= 150 líneas c/u).
 */

export * from "./api/api-core";
export * from "./api/api-products";
export * from "./api/api-requests";
export * from "./api/api-kardex";
export * from "./api/api-quotes";
export * from "./api/api-sales";
export * from "./api/api-entities";
export * from "./api/api-purchases";
export * from "./api/api-cash";
export * from "./api/api-adjustments";
export * from "./api/api-reports";
