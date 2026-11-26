import { r2 } from "@/lib/format";
import type { DB } from "@/lib/types";
import { exigirProducto } from "./engine-helpers";

export function detalleDevolucionProveedor(db: DB, id: string) {
  if (!db.devolucionesProveedor) db.devolucionesProveedor = [];
  const devolucion = db.devolucionesProveedor.find((d) => d.id === id);
  if (!devolucion) return null;

  const items = devolucion.items.map((linea) => {
    const prod = exigirProducto(db, linea.productoId);
    return {
      ...linea,
      codigo: prod.codigo,
      nombre: prod.nombre,
      unidadMedida: prod.unidadMedida,
      subtotal: r2(linea.cantidad * linea.costoUnitario),
    };
  });

  const total = r2(items.reduce((s, it) => s + it.subtotal, 0));
  const compra = db.compras.find((c) => c.id === devolucion.compraId) ?? null;

  return { devolucion, items, total, compra };
}

export function listarDevolucionesProveedor(db: DB, filtros?: { proveedorId?: string }) {
  let devoluciones = [...(db.devolucionesProveedor ?? [])];
  if (filtros?.proveedorId) {
    devoluciones = devoluciones.filter((d) => d.proveedorId === filtros.proveedorId);
  }
  return devoluciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
