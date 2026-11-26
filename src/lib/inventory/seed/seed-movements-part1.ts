import type { Movimiento, Producto } from "@/lib/types";
import { movimientosPart1a } from "./seed-movements-part1a";
import { movimientosPart1b } from "./seed-movements-part1b";

export function movimientosPart1(productos: Producto[]): Movimiento[] {
  return [
    ...movimientosPart1a(productos),
    ...movimientosPart1b(productos),
  ];
}
