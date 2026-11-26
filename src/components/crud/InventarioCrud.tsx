"use client";

import type { InventarioCrudProps } from "./inventario/tipos";
import { InventarioOrquestador } from "./inventario/InventarioOrquestador";

export function InventarioCrud(props: InventarioCrudProps) {
  return <InventarioOrquestador {...props} />;
}

export type { InventarioCrudProps };
export default InventarioCrud;
