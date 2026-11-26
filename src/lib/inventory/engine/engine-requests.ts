import { r3 } from "@/lib/format";
import type { Acta, DB, LineaCaptura, Solicitud } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import {
  agrupar,
  asegurarDisponible,
  conStock,
  exigirOficina,
  exigirProducto,
  exigirSolicitud,
  movimientoNuevo,
  siguiente,
} from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function crearSolicitud(
  db: DB,
  input: {
    solicitante: string;
    oficinaId: string;
    destinatario: string;
    observaciones: string;
    fecha: string;
    creadoPor: string;
    items: LineaCaptura[];
  },
) {
  if (!input.solicitante.trim()) throw new ReglaBodegaError("Indique el solicitante.");
  if (!input.items.length) throw new ReglaBodegaError("La solicitud no tiene artículos.");
  const oficina = exigirOficina(db, input.oficinaId);
  const items = input.items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    if (item.cantidad <= 0) throw new ReglaBodegaError("Cada renglón debe tener una cantidad mayor que cero.");
    return {
      id: crypto.randomUUID(),
      productoId: producto.id,
      cantidad: r3(item.cantidad),
      unidadMedida: producto.unidadMedida,
      observacion: item.observacion?.trim() || "",
    };
  });

  const solicitud: Solicitud = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "solicitud", input.fecha),
    estado: "PENDIENTE_DE_REVISION",
    solicitante: input.solicitante.trim(),
    oficinaId: oficina.id,
    destinatario: input.destinatario.trim() || oficina.nombre,
    observaciones: input.observaciones.trim(),
    fecha: input.fecha,
    actaId: null,
    stockAplicado: false,
    creadoPor: input.creadoPor,
    items,
  };
  db.solicitudes.push(solicitud);
  return solicitud;
}

export function aprobarSolicitud(db: DB, solicitudId: string) {
  const solicitud = exigirSolicitud(db, solicitudId);
  if (solicitud.estado !== "PENDIENTE_DE_REVISION" || solicitud.stockAplicado) {
    throw new ReglaBodegaError("Solo una solicitud pendiente de revisión puede aprobarse.");
  }
  const acta: Acta = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "acta", solicitud.fecha),
    solicitudId: solicitud.id,
    esSalidaDirecta: false,
    oficinaId: solicitud.oficinaId,
    destinatario: solicitud.destinatario,
    fecha: solicitud.fecha,
    concepto: solicitud.observaciones || `Entrega según solicitud ${solicitud.numero}`,
    ejecutada: false,
    items: solicitud.items.map((item) => ({
      id: crypto.randomUUID(),
      productoId: item.productoId,
      cantidad: item.cantidad,
      unidadMedida: item.unidadMedida,
      observacion: item.observacion,
      solicitudItemId: item.id,
    })),
  };
  db.actas.push(acta);
  solicitud.estado = "APROBADO";
  solicitud.actaId = acta.id;
  return acta;
}

export function entregarSolicitud(db: DB, solicitudId: string, usuario: string) {
  const solicitud = exigirSolicitud(db, solicitudId);
  if (solicitud.estado === "ENTREGADO" || solicitud.stockAplicado) {
    throw new ReglaBodegaError(
      "DESCARGO_DUPLICADO: la solicitud ya está ENTREGADA y su salida consta en el kárdex. No se descuenta el stock otra vez.",
    );
  }
  if (solicitud.estado !== "APROBADO" || !solicitud.actaId) {
    throw new ReglaBodegaError("La solicitud debe estar APROBADA y tener acta antes de entregarse.");
  }
  const acta = db.actas.find((a) => a.id === solicitud.actaId);
  if (!acta) throw new ReglaBodegaError("El acta de esta solicitud no está en el libro.");
  if (acta.ejecutada) {
    throw new ReglaBodegaError(
      `DESCARGO_DUPLICADO: el acta ${acta.numero} ya fue ejecutada. No se descuenta el stock otra vez.`,
    );
  }

  const llaves = solicitud.items.map((item) => `SOLICITUD:${solicitud.id}:ITEM:${item.id}`);
  if (db.movimientos.some((m) => m.idempotencyKey && llaves.includes(m.idempotencyKey))) {
    throw new ReglaBodegaError(
      "DESCARGO_DUPLICADO: el movimiento ya fue aplicado. No se descuenta el stock otra vez.",
    );
  }

  asegurarDisponible(db, agrupar(solicitud.items));

  conStock(
    db,
    solicitud.items.map((item) => item.productoId),
    () => {
      for (const item of solicitud.items) {
        const linea = acta.items.find((l) => l.solicitudItemId === item.id);
        db.movimientos.push(
          movimientoNuevo(db, {
            productoId: item.productoId,
            fecha: solicitud.fecha,
            tipo: "SALIDA",
            cantidad: item.cantidad,
            destinatario: solicitud.destinatario,
            oficinaId: solicitud.oficinaId,
            actaId: acta.id,
            actaItemId: linea?.id ?? null,
            solicitudId: solicitud.id,
            solicitudItemId: item.id,
            numeroReferencia: acta.numero,
            concepto: `Entrega ${acta.numero} · ${solicitud.numero}`,
            usuario,
            esAuditoria: false,
            origen: "SOLICITUD",
            idempotencyKey: `SOLICITUD:${solicitud.id}:ITEM:${item.id}`,
          }),
        );
      }
    },
    recalcularProducto
  );

  solicitud.estado = "ENTREGADO";
  solicitud.stockAplicado = true;
  acta.ejecutada = true;
  return solicitud;
}
