import { r2 } from "@/lib/format";
import type { DB } from "@/lib/types";
import { exigirProducto } from "./engine-helpers";

export function detalleRecepcionCompra(db: DB, id: string) {
  if (!db.recepcionesCompra) db.recepcionesCompra = [];
  const recepcion = db.recepcionesCompra.find((r) => r.id === id);
  if (!recepcion) return null;

  const items = recepcion.items.map((linea) => {
    const prod = exigirProducto(db, linea.productoId);
    return {
      ...linea,
      codigo: prod.codigo,
      nombre: prod.nombre,
      unidadMedida: prod.unidadMedida,
      subtotal: r2(linea.cantidadRecibida * linea.costoUnitario),
    };
  });

  const total = r2(items.reduce((s, it) => s + it.subtotal, 0));
  const pedido = recepcion.pedidoId ? (db.pedidosCompra ?? []).find((p) => p.id === recepcion.pedidoId) ?? null : null;
  const compra = (db.compras ?? []).find((c) => c.recepcionId === recepcion.id) ?? null;

  return { recepcion, items, total, pedido, compra };
}

export function listarRecepcionesCompra(db: DB, filtros?: { proveedorId?: string }) {
  let recepciones = [...(db.recepcionesCompra ?? [])];
  if (filtros?.proveedorId) {
    recepciones = recepciones.filter((r) => r.proveedorId === filtros.proveedorId);
  }
  return recepciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
