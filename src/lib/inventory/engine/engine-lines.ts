import { r2, r3 } from "@/lib/format";
import type { DB, LineaComercial } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { exigirProducto } from "./engine-helpers";

export function prepararLineas(
  db: DB,
  items: Array<{ productoId: string; cantidad: number; precio: number; observacion?: string; exentoIva?: boolean; descuento?: number }>,
): LineaComercial[] {
  if (!items.length) throw new ReglaBodegaError("Agregue al menos un artículo.");
  return items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    if (!(item.cantidad > 0)) throw new ReglaBodegaError("La cantidad debe ser mayor que cero.");
    if (!Number.isFinite(item.precio) || item.precio < 0) throw new ReglaBodegaError("El precio no es válido.");
    return {
      id: crypto.randomUUID(),
      productoId: producto.id,
      cantidad: r3(item.cantidad),
      precio: r2(item.precio),
      unidadMedida: producto.unidadMedida,
      observacion: (item.observacion ?? "").trim(),
      costoUnitario: producto.costo || 0,
      exentoIva: Boolean(item.exentoIva || (producto as any).exentoIva),
      descuento: item.descuento ? r2(item.descuento) : 0,
    };
  });
}

export function vistaLineas(db: DB, items: LineaComercial[]) {
  return items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    return {
      ...item,
      codigo: producto.codigo,
      nombre: producto.nombre,
      importe: r2(item.cantidad * item.precio),
    };
  });
}

export function coincidenItemsFactura(itemsA: LineaComercial[], itemsB: LineaComercial[]): boolean {
  if (itemsA.length !== itemsB.length) return false;
  for (let i = 0; i < itemsA.length; i++) {
    const a = itemsA[i];
    const b = itemsB[i];
    if (a.productoId !== b.productoId) return false;
    if (Math.abs(a.cantidad - b.cantidad) > 0.0001) return false;
    if (Math.abs(a.precio - b.precio) > 0.01) return false;
  }
  return true;
}
