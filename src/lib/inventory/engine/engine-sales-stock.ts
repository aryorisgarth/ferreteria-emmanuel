import type { DB, Factura, FormaPago } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { conStock, movimientoNuevo, siguiente } from "./engine-helpers";
import { recalcularProducto } from "./engine-products";
import { r2 } from "@/lib/format";

export function actualizarTurnoVenta(db: DB, formaPago: FormaPago, total: number): void {
  const turno = (db.turnosCaja ?? []).find((t) => t.estado === "ABIERTO");
  if (!turno) return;
  if (formaPago === "EFECTIVO") turno.totalVentasEfectivo = r2(turno.totalVentasEfectivo + total);
  else if (formaPago === "TRANSFERENCIA") turno.totalVentasTransferencia = r2(turno.totalVentasTransferencia + total);
  else if (formaPago === "TARJETA") turno.totalVentasTarjeta = r2(turno.totalVentasTarjeta + total);
  else if (formaPago === "CREDITO") turno.totalVentasCredito = r2(turno.totalVentasCredito + total);
}

export function aplicarDescargoFactura(
  db: DB,
  factura: Factura,
  cotizacion: any | null,
  totalConDescuento: number,
  claveIdempotencia?: string,
): Factura {
  let facturaResultado: Factura = factura;

  conStock(db, factura.items.map((item) => item.productoId), () => {
    if (claveIdempotencia) {
      const existente = db.facturas.find((f) => f.claveIdempotencia === claveIdempotencia);
      if (existente) {
        facturaResultado = existente;
        return;
      }
    }
    factura.numero = siguiente(db, "factura", factura.fecha);
    db.facturas.push(factura);

    for (const linea of factura.items) {
      const llave = `FACTURA:${factura.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) {
        throw new ReglaBodegaError("DESCARGO_DUPLICADO");
      }
      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: factura.fecha,
          tipo: "SALIDA",
          cantidad: linea.cantidad,
          destinatario: factura.cliente,
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: factura.numero,
          concepto: `Factura ${factura.numero}${linea.observacion ? ` · ${linea.observacion}` : ""}`,
          usuario: factura.creadoPor,
          esAuditoria: false,
          origen: "FACTURA",
          idempotencyKey: llave,
          costoUnitario: linea.costoUnitario,
        }),
      );
    }

    factura.stockAplicado = true;
    if (cotizacion) {
      cotizacion.estado = "FACTURADA";
      cotizacion.facturaId = factura.id;
    }

    actualizarTurnoVenta(db, factura.formaPago, totalConDescuento);
  }, recalcularProducto);

  return facturaResultado;
}
