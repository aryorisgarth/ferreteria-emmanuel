import { r2 } from "@/lib/format";
import type { DB, Factura } from "@/lib/types";
import { ReglaBodegaError, totalesLineas } from "./engine-core";
import { conStock, movimientoNuevo } from "./engine-helpers";
import { vistaLineas } from "./engine-lines";
import { recalcularProducto } from "./engine-products";

export function pagarFactura(db: DB, id: string) {
  const factura = db.facturas.find((f) => f.id === id);
  if (!factura) throw new ReglaBodegaError("La factura no existe.");
  if (factura.estado === "ANULADA") throw new ReglaBodegaError("La factura está anulada.");
  factura.estado = "PAGADA";
  return factura;
}

export function detalleFactura(db: DB, id: string) {
  const factura = db.facturas.find((f) => f.id === id);
  if (!factura) return null;
  const cotizacion = db.cotizaciones.find((c) => c.id === factura.cotizacionId) ?? null;
  return { factura, cotizacion, items: vistaLineas(db, factura.items), ...totalesLineas(factura.items) };
}

export function costoHistoricoFactura(db: DB, facturaOId: Factura | string): number {
  const f = typeof facturaOId === "string" ? db.facturas.find((fac) => fac.id === facturaOId) : facturaOId;
  if (!f) return 0;
  if (f.costoTotalVenta !== undefined && f.costoTotalVenta > 0) return f.costoTotalVenta;
  return r2(
    f.items.reduce((acc, item) => {
      const costoUnit = item.costoUnitario !== undefined
        ? item.costoUnitario
        : (db.productos.find((p) => p.id === item.productoId)?.costo ?? 0);
      return acc + item.cantidad * costoUnit;
    }, 0)
  );
}

export function anularFactura(db: DB, id: string, usuario: string) {
  const factura = db.facturas.find((f) => f.id === id);
  if (!factura) throw new ReglaBodegaError("La factura no existe.");
  if (factura.estado === "ANULADA") throw new ReglaBodegaError("La factura ya está anulada.");

  const tieneDevoluciones = (db.devolucionesCliente ?? []).some((d) => d.facturaId === factura.id);
  if (tieneDevoluciones) {
    throw new ReglaBodegaError(`No se puede anular la factura ${factura.numero}: Ya cuenta con devoluciones registradas.`);
  }

  if (!factura.stockAplicado) {
    factura.estado = "ANULADA";
    factura.anulada = true;
    factura.anuladaPor = usuario;
    factura.fechaAnulacion = new Date().toISOString();
    return factura;
  }
  conStock(db, factura.items.map((item) => item.productoId), () => {
    for (const linea of factura.items) {
      const llave = `ANULA:FACTURA:${factura.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) continue;
      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: factura.fecha,
          tipo: "ENTRADA",
          cantidad: linea.cantidad,
          destinatario: "",
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: factura.numero,
          concepto: `Anulación ${factura.numero}`,
          usuario,
          esAuditoria: false,
          origen: "FACTURA",
          idempotencyKey: llave,
          costoUnitario: linea.costoUnitario,
        }),
      );
    }
    factura.stockAplicado = false;
    factura.estado = "ANULADA";
    factura.anulada = true;
    factura.anuladaPor = usuario;
    factura.fechaAnulacion = new Date().toISOString();

    const turno = (db.turnosCaja ?? []).find((t) => t.estado === "ABIERTO");
    if (turno && factura.formaPago === "EFECTIVO") {
      const totalFac = factura.total !== undefined ? factura.total : totalesLineas(factura.items).total;
      turno.totalVentasEfectivo = Math.max(0, r2(turno.totalVentasEfectivo - totalFac));
    }

    const cotizacion = db.cotizaciones.find((c) => c.id === factura.cotizacionId);
    if (cotizacion) {
      cotizacion.estado = "ACEPTADA";
      cotizacion.facturaId = null;
    }
  }, recalcularProducto);
  return factura;
}
