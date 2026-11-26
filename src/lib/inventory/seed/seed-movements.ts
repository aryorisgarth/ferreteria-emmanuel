import type { Movimiento, Producto } from "@/lib/types";
import { baseMovimiento } from "./seed-products-data";
import { movimientosPart1 } from "./seed-movements-part1";
import { movimientosPart2 } from "./seed-movements-part2";

export function movimientosSeed(productos: Producto[]): Movimiento[] {
  const movimientos: Movimiento[] = [
    ...movimientosPart1(productos),
    ...movimientosPart2(productos),
  ];

  const conMovimiento = new Set(movimientos.map((m) => m.productoId));
  productos
    .filter((p) => !conMovimiento.has(p.id) && p.codigo !== "FE-010" && p.codigo !== "FE-024")
    .forEach((p, indice) => {
      movimientos.push(
        baseMovimiento({
          id: `mov-apertura-${p.codigo}`,
          productoId: p.id,
          fecha: "2026-10-05",
          tipo: "ENTRADA",
          cantidad: 20,
          unidadMedida: p.unidadMedida,
          destinatario: "",
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: "INV-APERTURA",
          concepto: "Ingreso complementario de apertura",
          usuario: "Bodega Central",
          esAuditoria: false,
          estadoAuditoria: "NORMAL",
          origen: "MANUAL",
          idempotencyKey: null,
          secuencia: 1,
          createdAt: `2026-10-05T08:00:${String(indice).padStart(2, "0")}.000Z`,
        }),
      );
    });

  return movimientos;
}
