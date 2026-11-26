import { r3 } from "@/lib/format";
import type { DB, EstadoAuditoria } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";

export function editarMovimiento(
  db: DB,
  id: string,
  input: {
    cantidad: number;
    fecha: string;
    concepto: string;
    destinatario: string;
    oficinaId: string | null;
    esAuditoria: boolean;
    estadoAuditoria: EstadoAuditoria;
    usuario: string;
  },
) {
  const mov = db.movimientos.find((m) => m.id === id);
  if (!mov) throw new ReglaBodegaError("El renglón del kárdex no existe.");
  if (!input.concepto.trim()) throw new ReglaBodegaError("El concepto del movimiento es obligatorio.");

  // PROTECCIÓN DE MOVIMIENTOS COMERCIALES Y AJUSTES (H-05)
  const esInmutable =
    mov.origen === "FACTURA" ||
    mov.origen === "COMPRA" ||
    mov.origen === "AJUSTE" ||
    (mov.idempotencyKey &&
      (mov.idempotencyKey.startsWith("FACTURA") ||
        mov.idempotencyKey.startsWith("COMPRA") ||
        mov.idempotencyKey.startsWith("ANULA") ||
        mov.idempotencyKey.startsWith("AJUSTE")));

  if (esInmutable) {
    const origenTexto =
      mov.origen === "COMPRA"
        ? "una Compra oficial"
        : mov.origen === "FACTURA"
          ? "una Factura / Venta oficial"
          : mov.origen === "AJUSTE"
            ? "un(a) Ajuste de Inventario"
            : "una Operación oficial";
    throw new ReglaBodegaError(
      `El movimiento ${mov.numeroReferencia || mov.id} proviene de ${origenTexto} y es inmutable por trazabilidad contable y de auditoría.`
    );
  }

  // PROTECCIÓN DE SALDOS HISTÓRICOS EN KÁRDEX
  if (r3(input.cantidad) !== r3(mov.cantidad) || input.fecha !== mov.fecha) {
    throw new ReglaBodegaError(
      "Por trazabilidad e integridad contable, no se permite modificar la cantidad ni la fecha de renglones históricos en Kárdex. Cualquier diferencia física debe resolverse mediante un ajuste formal de inventario."
    );
  }

  if (mov.tipo !== "AJUSTE" && input.cantidad <= 0) {
    throw new ReglaBodegaError("La cantidad debe ser mayor que cero.");
  }
  if (mov.tipo === "SALIDA" && !input.destinatario.trim()) {
    throw new ReglaBodegaError("Toda salida exige destinatario, persona u oficina.");
  }

  mov.concepto = input.concepto.trim();
  mov.esAuditoria = input.esAuditoria;
  mov.estadoAuditoria = input.esAuditoria
    ? input.estadoAuditoria === "NORMAL"
      ? "EN_AUDITORIA"
      : input.estadoAuditoria
    : "NORMAL";
  mov.usuario = input.usuario;

  if (mov.tipo === "SALIDA") {
    const destino = input.destinatario.trim();
    if (mov.actaId) {
      const acta = db.actas.find((a) => a.id === mov.actaId);
      if (acta) {
        acta.destinatario = destino;
        if (input.oficinaId) acta.oficinaId = input.oficinaId;
      }
      for (const hermano of db.movimientos.filter((m) => m.actaId === mov.actaId)) {
        hermano.destinatario = destino;
        hermano.oficinaId = input.oficinaId;
      }
      const solicitud = db.solicitudes.find((s) => s.actaId === mov.actaId);
      if (solicitud) {
        solicitud.destinatario = destino;
        if (input.oficinaId) solicitud.oficinaId = input.oficinaId;
      }
    } else {
      mov.destinatario = destino;
      mov.oficinaId = input.oficinaId;
    }
  }

  if (mov.actaItemId) {
    const acta = db.actas.find((a) => a.id === mov.actaId);
    if (acta) {
      const linea = acta.items.find((item) => item.id === mov.actaItemId);
      if (linea) linea.cantidad = mov.cantidad;
    }
  }
  if (mov.solicitudItemId) {
    for (const solicitud of db.solicitudes) {
      const linea = solicitud.items.find((item) => item.id === mov.solicitudItemId);
      if (linea) linea.cantidad = mov.cantidad;
    }
  }
  return mov;
}
