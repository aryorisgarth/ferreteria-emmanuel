/**
 * Fachada pública del repositorio de persistencia local (archivos JSON).
 * Re-exporta los submódulos especializados de src/lib/inventory/local/ (<= 150 líneas c/u).
 */

export * from "./local/local-products";
export * from "./local/local-requests";
export * from "./local/local-kardex";
export * from "./local/local-quotes";
export * from "./local/local-sales";
export * from "./local/local-purchases";
export * from "./local/local-returns";
export * from "./local/local-cash";
export * from "./local/local-adjustments";
export * from "./local/local-entities";
export * from "./local/local-reports";
