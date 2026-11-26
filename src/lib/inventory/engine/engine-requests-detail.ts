import type { DB } from "@/lib/types";
import { exigirProducto } from "./engine-helpers";

export function detalleSolicitud(db: DB, id: string) {
  const solicitud = db.solicitudes.find((s) => s.id === id);
  if (!solicitud) return null;
  const oficina = db.oficinas.find((o) => o.id === solicitud.oficinaId) ?? null;
  const acta = db.actas.find((a) => a.id === solicitud.actaId) ?? null;
  const items = solicitud.items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    return { ...item, codigo: producto.codigo, nombre: producto.nombre };
  });
  return { solicitud, oficina, acta, items };
}

export function detalleActa(db: DB, id: string) {
  const acta = db.actas.find((a) => a.id === id);
  if (!acta) return null;
  const oficina = db.oficinas.find((o) => o.id === acta.oficinaId) ?? null;
  const solicitud = db.solicitudes.find((s) => s.id === acta.solicitudId) ?? null;
  const items = acta.items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    return { ...item, codigo: producto.codigo, nombre: producto.nombre };
  });
  return { acta, oficina, solicitud, items };
}
