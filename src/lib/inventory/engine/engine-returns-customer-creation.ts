import { r2, r3 } from "@/lib/format";
import type { DB, DevolucionCliente, LineaDevolucionCliente } from "@/lib/types";
import { fechaValida, ReglaBodegaError } from "./engine-core";
import { conStock, exigirProducto, movimientoNuevo, siguiente } from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function registrarDevolucionCliente(
  db: DB,
  input: {
    facturaId: string;
    items: Array<{ productoId: string; cantidad: number; observacion?: string }>;
    motivo: string;
    responsable: string;
    fecha?: string;
    metodoReintegro?: "EFECTIVO" | "NOTA_CREDITO";
  },
): DevolucionCliente {
  if (!db.devolucionesCliente) db.devolucionesCliente = [];
  const factura = db.facturas.find((f) => f.id === input.facturaId);
  if (!factura) throw new ReglaBodegaError("La factura indicada no existe.");
  if (factura.estado === "ANULADA") throw new ReglaBodegaError("No se pueden registrar devoluciones sobre una factura anulada.");

  const motivo = (input.motivo || "").trim();
  if (!motivo) throw new ReglaBodegaError("Debe indicar el motivo o justificación de la devolución.");
  if (!input.items || input.items.length === 0) {
    throw new ReglaBodegaError("Debe incluir al menos un artículo en la devolución.");
  }

  const fecha = input.fecha || new Date().toISOString().split("T")[0];
  fechaValida(fecha);

  const previas = db.devolucionesCliente.filter((d) => d.facturaId === factura.id);
  const cantDevueltaPrevia = new Map<string, number>();
  for (const prev of previas) {
    for (const it of prev.items) {
      cantDevueltaPrevia.set(it.productoId, (cantDevueltaPrevia.get(it.productoId) || 0) + it.cantidad);
    }
  }

  const lineasDevolucion: LineaDevolucionCliente[] = [];
  for (const item of input.items) {
    const itemFactura = factura.items.find((it) => it.productoId === item.productoId);
    if (!itemFactura) {
      const prod = db.productos.find((p) => p.id === item.productoId);
      throw new ReglaBodegaError(
        `El artículo ${prod?.nombre || item.productoId} no pertenece a la factura ${factura.numero}.`,
      );
    }

    const cantidad = r3(item.cantidad);
    if (!(cantidad > 0)) throw new ReglaBodegaError("La cantidad a devolver debe ser mayor a cero.");

    const yaDevuelto = cantDevueltaPrevia.get(item.productoId) || 0;
    const maxPermitido = r3(itemFactura.cantidad - yaDevuelto);
    if (cantidad > maxPermitido + 0.0001) {
      throw new ReglaBodegaError(
        `Cantidad a devolver (${cantidad}) excede el saldo devuelto permitido (${maxPermitido}) para el artículo en la factura ${factura.numero}.`,
      );
    }

    cantDevueltaPrevia.set(item.productoId, yaDevuelto + cantidad);

    lineasDevolucion.push({
      id: crypto.randomUUID(),
      productoId: item.productoId,
      cantidad,
      precioVenta: itemFactura.precio,
      costoUnitario: itemFactura.costoUnitario,
      observacion: (item.observacion || "").trim(),
    });
  }

  const subtotalReintegro = r2(lineasDevolucion.reduce((s, it) => s + it.cantidad * it.precioVenta, 0));
  const tasaIvaFactura =
    factura.iva !== undefined && factura.subtotal && factura.subtotal > 0
      ? r2(factura.iva / factura.subtotal)
      : 0;
  const ivaReintegro = r2(subtotalReintegro * tasaIvaFactura);
  const totalReintegro = r2(subtotalReintegro + ivaReintegro);
  const metodoReintegro = input.metodoReintegro ?? (factura.formaPago === "EFECTIVO" ? "EFECTIVO" : "NOTA_CREDITO");

  const devolucion: DevolucionCliente = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "devolucionCliente", fecha),
    facturaId: factura.id,
    facturaNumero: factura.numero,
    cliente: factura.cliente,
    clienteId: factura.clienteId,
    fecha,
    motivo,
    responsable: input.responsable,
    items: lineasDevolucion,
    subtotal: subtotalReintegro,
    iva: ivaReintegro,
    totalReintegro,
    metodoReintegro,
    createdAt: new Date().toISOString(),
  };

  conStock(db, lineasDevolucion.map((it) => it.productoId), () => {
    if (!db.devolucionesCliente) db.devolucionesCliente = [];
    db.devolucionesCliente.push(devolucion);

    for (const linea of lineasDevolucion) {
      const prod = exigirProducto(db, linea.productoId);
      const llave = `DEV:CLIENTE:${devolucion.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) continue;

      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha,
          tipo: "ENTRADA",
          cantidad: linea.cantidad,
          destinatario: factura.cliente,
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: devolucion.numero,
          concepto: `Devolución cliente ${devolucion.numero} · Factura ${factura.numero}`,
          usuario: input.responsable,
          esAuditoria: false,
          origen: "FACTURA",
          idempotencyKey: llave,
          costoUnitario: prod.costo,
        }),
      );
    }

    if (metodoReintegro === "EFECTIVO") {
      const turno = (db.turnosCaja ?? []).find((t) => t.estado === "ABIERTO");
      if (turno) {
        if (!db.movimientosCaja) db.movimientosCaja = [];
        const mov = {
          id: crypto.randomUUID(),
          turnoCajaId: turno.id,
          tipo: "EGRESO" as const,
          monto: totalReintegro,
          concepto: `Devolución ${devolucion.numero} · Factura ${factura.numero}`,
          fecha,
          usuario: input.responsable,
          createdAt: new Date().toISOString(),
        };
        db.movimientosCaja.push(mov);
        devolucion.reintegroCajaId = mov.id;
      }
    }
  }, recalcularProducto);

  return devolucion;
}
