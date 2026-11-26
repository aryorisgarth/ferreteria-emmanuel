"use client";

/**
 * Punto de Venta / Caja — Modularizado
 * Desacoplado conforme a la auditoría arquitectónica en submódulos de <= 150 líneas en @/components/caja/
 */

import { CajaPos } from "@/components/caja/CajaPos";
export { CajaPos as Caja };
export type { ItemCarritoPOS } from "@/components/caja/tipos";
export default CajaPos;
