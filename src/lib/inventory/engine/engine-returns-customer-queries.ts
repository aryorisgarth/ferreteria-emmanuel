import { r2 } from "@/lib/format";
import type { DB } from "@/lib/types";
import { exigirProducto } from "./engine-helpers";

export function detalleDevolucionCliente(db: DB, id: string) {
  if (!db.devolucionesCliente) db.devolucionesCliente = [];
  const devolucion = db.devolucionesCliente.find((d) => d.id === id);
  if (!devolucion) return null;
  const items = devolucion.items.map((it) => {
    const prod = exigirProducto(db, it.productoId);
    return {
      ...it,
      codigo: prod.codigo,
      nombre: prod.nombre,
      unidadMedida: prod.unidadMedida,
      importe: r2(it.cantidad * it.precioVenta),
    };
  });
  const factura = db.facturas.find((f) => f.id === devolucion.facturaId) ?? null;
  return { devolucion, items, factura };
}

export function listarDevolucionesCliente(db: DB, filtros?: { facturaId?: string; clienteId?: string }) {
  let list = [...(db.devolucionesCliente ?? [])];
  if (filtros?.facturaId) list = list.filter((d) => d.facturaId === filtros.facturaId);
  if (filtros?.clienteId) list = list.filter((d) => d.clienteId === filtros.clienteId);
  return list.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero));
}
