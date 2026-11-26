import { paginar } from "@/lib/format";
import {
  aprobarSolicitud,
  crearSolicitud,
  detalleActa,
  detalleSolicitud,
  entregarSolicitud,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { EstadoSolicitud, LineaCaptura } from "@/lib/types";

export function oficinas() {
  return consultar((db) => db.oficinas);
}

export function solicitudes(page: number, estado?: EstadoSolicitud) {
  return consultar((db) => {
    const filas = db.solicitudes
      .filter((s) => !estado || s.estado === estado)
      .sort((a, b) => b.numero.localeCompare(a.numero))
      .map((s) => ({
        id: s.id, numero: s.numero, estado: s.estado, solicitante: s.solicitante, destinatario: s.destinatario,
        fecha: s.fecha, oficinaNombre: db.oficinas.find((o) => o.id === s.oficinaId)?.nombre ?? "",
        actaNumero: db.actas.find((a) => a.id === s.actaId)?.numero ?? null, stockAplicado: s.stockAplicado,
      }));
    return paginar(filas, page);
  });
}

export function solicitud(id: string) {
  return consultar((db) => {
    const detalle = detalleSolicitud(db, id);
    if (!detalle) return null;
    return {
      id: detalle.solicitud.id, numero: detalle.solicitud.numero, estado: detalle.solicitud.estado,
      solicitante: detalle.solicitud.solicitante, destinatario: detalle.solicitud.destinatario,
      observaciones: detalle.solicitud.observaciones, fecha: detalle.solicitud.fecha,
      oficinaId: detalle.solicitud.oficinaId, oficinaNombre: detalle.oficina?.nombre ?? "",
      actaId: detalle.acta?.id ?? null, actaNumero: detalle.acta?.numero ?? null,
      ejecutada: detalle.acta?.ejecutada ?? false, stockAplicado: detalle.solicitud.stockAplicado, items: detalle.items,
    };
  });
}

export function crear(input: {
  solicitante: string; oficinaId: string; destinatario: string; observaciones: string;
  fecha: string; creadoPor: string; items: LineaCaptura[];
}) {
  return transaccion((db) => crearSolicitud(db, input).id);
}

export function aprobar(id: string) {
  return transaccion((db) => aprobarSolicitud(db, id).id);
}

export function entregar(id: string, usuario: string) {
  transaccion((db) => entregarSolicitud(db, id, usuario));
}

export function actas(page: number) {
  return consultar((db) => {
    const filas = [...db.actas]
      .sort((a, b) => b.numero.localeCompare(a.numero))
      .map((acta) => ({
        id: acta.id, numero: acta.numero, fecha: acta.fecha, destinatario: acta.destinatario,
        oficinaNombre: db.oficinas.find((o) => o.id === acta.oficinaId)?.nombre ?? "",
        ejecutada: acta.ejecutada, esSalidaDirecta: acta.esSalidaDirecta, solicitudId: acta.solicitudId,
        solicitudNumero: db.solicitudes.find((s) => s.id === acta.solicitudId)?.numero ?? null,
      }));
    return paginar(filas, page);
  });
}

export function acta(id: string) {
  return consultar((db) => {
    const detalle = detalleActa(db, id);
    if (!detalle) return null;
    return {
      id: detalle.acta.id, numero: detalle.acta.numero, fecha: detalle.acta.fecha,
      destinatario: detalle.acta.destinatario, oficinaNombre: detalle.oficina?.nombre ?? "",
      ejecutada: detalle.acta.ejecutada, esSalidaDirecta: detalle.acta.esSalidaDirecta,
      solicitudId: detalle.solicitud?.id ?? null, solicitudNumero: detalle.solicitud?.numero ?? null,
      concepto: detalle.acta.concepto, items: detalle.items,
    };
  });
}
