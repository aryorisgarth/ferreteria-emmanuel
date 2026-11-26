import type { DB, FormaPago, OrigenFactura } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { emitirFactura } from "./engine-sales-invoicing";

export function convertirCotizacionAVenta(
  db: DB,
  input: {
    cotizacionId: string;
    creadoPor?: string;
    usuario?: string;
    fecha?: string;
    formaPago?: FormaPago;
    origen?: OrigenFactura;
    montoRecibido?: number;
    politicaPrecios?: "CONSERVAR" | "ACTUALIZAR";
    claveIdempotencia?: string;
    claveOperacion?: string;
  }
) {
  const cotizacion = db.cotizaciones.find((c) => c.id === input.cotizacionId);
  if (!cotizacion) throw new ReglaBodegaError("La cotización no existe.");

  const clave = input.claveIdempotencia || input.claveOperacion;

  if (cotizacion.estado === "FACTURADA" && cotizacion.facturaId) {
    const facturaExistente = db.facturas.find((f) => f.id === cotizacion.facturaId);
    if (facturaExistente) {
      if (clave && facturaExistente.claveIdempotencia === clave) {
        return { cotizacion, factura: facturaExistente };
      }
    }
    throw new ReglaBodegaError("Esa cotización ya fue facturada y convertida en venta anteriormente.");
  }

  if (cotizacion.estado === "RECHAZADA") {
    throw new ReglaBodegaError("No se puede facturar una cotización rechazada.");
  }

  const fechaHoy = input.fecha || new Date().toISOString().slice(0, 10);
  if (cotizacion.fechaVencimiento && fechaHoy > cotizacion.fechaVencimiento) {
    cotizacion.estado = "VENCIDA";
    throw new ReglaBodegaError(`La cotización venció el ${cotizacion.fechaVencimiento}. No se puede facturar sin renovarla.`);
  }

  const itemsVenta = cotizacion.items.map((it) => {
    let precio = it.precio;
    if (input.politicaPrecios === "ACTUALIZAR") {
      const prod = db.productos.find((p) => p.id === it.productoId);
      if (prod) precio = prod.precio;
    }
    return {
      productoId: it.productoId,
      cantidad: it.cantidad,
      precio,
      observacion: it.observacion,
      descuento: it.descuento,
      exentoIva: it.exentoIva,
    };
  });

  const claveIdemp = clave || `CONV-COT:${cotizacion.id}`;

  const factura = emitirFactura(db, {
    cliente: cotizacion.cliente,
    clienteId: cotizacion.clienteId,
    fecha: fechaHoy,
    notas: `Conversión de Cotización ${cotizacion.numero}${cotizacion.notas ? ` · ${cotizacion.notas}` : ""}`,
    creadoPor: input.creadoPor ?? input.usuario ?? "Cajero",
    cotizacionId: cotizacion.id,
    formaPago: input.formaPago ?? "EFECTIVO",
    origen: input.origen ?? "COTIZACION",
    items: itemsVenta,
    descuento: cotizacion.descuento,
    montoRecibido: input.montoRecibido,
    claveIdempotencia: claveIdemp,
  });

  return { cotizacion, factura };
}
