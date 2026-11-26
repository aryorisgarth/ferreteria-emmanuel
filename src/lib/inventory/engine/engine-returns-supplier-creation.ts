import { r2, r3 } from "@/lib/format";
import type { DB, DevolucionProveedor, LineaDevolucionProveedor } from "@/lib/types";
import { fechaValida, ReglaBodegaError } from "./engine-core";
import { conStock, exigirProducto, movimientoNuevo, siguiente } from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function registrarDevolucionProveedor(
  db: DB,
  input: {
    compraId: string;
    fecha: string;
    motivo: string;
    notaCreditoProveedor?: string;
    creadoPor: string;
    items: Array<{ productoId: string; cantidad: number; observacion?: string }>;
  },
): DevolucionProveedor {
  const compra = db.compras.find((c) => c.id === input.compraId);
  if (!compra) throw new ReglaBodegaError("La compra no existe.");
  if (compra.anulada) throw new ReglaBodegaError("No se pueden registrar devoluciones sobre una compra anulada.");
  fechaValida(input.fecha);

  const motivo = input.motivo.trim();
  if (motivo.length < 3) throw new ReglaBodegaError("Indique el motivo de la devolución.");
  if (!input.items?.length) throw new ReglaBodegaError("Indique los artículos a devolver.");

  if (!db.devolucionesProveedor) db.devolucionesProveedor = [];
  const devolucionesPrevias = (db.devolucionesProveedor ?? []).filter((d) => d.compraId === compra.id);
  const itemsDevolucion: LineaDevolucionProveedor[] = [];
  let totalDevolucion = 0;

  for (const it of input.items) {
    const prod = exigirProducto(db, it.productoId);
    if (!(it.cantidad > 0)) throw new ReglaBodegaError(`La cantidad a devolver de ${prod.nombre} debe ser mayor que cero.`);

    const lineaCompra = compra.items.find((lc) => lc.productoId === it.productoId);
    if (!lineaCompra) {
      throw new ReglaBodegaError(`El artículo ${prod.nombre} no pertenece a la compra ${compra.numero}.`);
    }

    const yaDevuelto = devolucionesPrevias.reduce((suma, d) => {
      const lineaD = d.items.find((ld) => ld.productoId === it.productoId);
      return suma + (lineaD?.cantidad ?? 0);
    }, 0);

    const maxDevolucion = r3(lineaCompra.cantidad - yaDevuelto);
    if (it.cantidad > maxDevolucion + 0.0001) {
      throw new ReglaBodegaError(
        `La cantidad a devolver de ${prod.nombre} (${it.cantidad}) excede el disponible de la compra (${maxDevolucion}).`
      );
    }

    if (prod.stockActual < it.cantidad) {
      throw new ReglaBodegaError(
        `Stock insuficiente en bodega para devolver ${prod.nombre} (disponible: ${prod.stockActual}, a devolver: ${it.cantidad}).`
      );
    }

    const costoUnit = lineaCompra.precio;
    const subtotal = r2(it.cantidad * costoUnit);
    totalDevolucion = r2(totalDevolucion + subtotal);

    itemsDevolucion.push({
      id: crypto.randomUUID(),
      productoId: prod.id,
      cantidad: r3(it.cantidad),
      costoUnitario: costoUnit,
      observacion: (it.observacion ?? "").trim(),
    });
  }

  const devolucion: DevolucionProveedor = {
    id: crypto.randomUUID(),
    numero: "",
    compraId: compra.id,
    proveedorId: compra.proveedorId,
    proveedor: compra.proveedor,
    fecha: input.fecha,
    motivo,
    notaCreditoProveedor: (input.notaCreditoProveedor ?? "").trim(),
    creadoPor: input.creadoPor,
    stockAplicado: false,
    total: totalDevolucion,
    items: itemsDevolucion,
    createdAt: new Date().toISOString(),
  };

  conStock(db, itemsDevolucion.map((item) => item.productoId), () => {
    devolucion.numero = siguiente(db, "devolucion", input.fecha);
    if (!db.devolucionesProveedor) db.devolucionesProveedor = [];
    db.devolucionesProveedor.push(devolucion);

    for (const linea of itemsDevolucion) {
      const prod = exigirProducto(db, linea.productoId);
      const stockActual = Math.max(0, prod.stockActual);
      const cppVigente = prod.costo || 0;
      const cantSalida = linea.cantidad;
      const llave = `DEV:PROV:${devolucion.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) continue;

      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: input.fecha,
          tipo: "SALIDA",
          cantidad: linea.cantidad,
          destinatario: compra.proveedor,
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: devolucion.numero,
          concepto: `Devolución a proveedor · Compra ${compra.numero} · ${motivo}`,
          usuario: input.creadoPor,
          esAuditoria: false,
          origen: "COMPRA",
          idempotencyKey: llave,
          costoUnitario: cppVigente > 0 ? cppVigente : linea.costoUnitario,
        }),
      );

      const stockRem = r3(stockActual - cantSalida);
      if (stockRem <= 0.0005) {
        prod.costo = 0;
      } else if (cppVigente > 0) {
        prod.costo = r2(cppVigente);
      }
    }

    devolucion.stockAplicado = true;

    if (compra.condicionPago === "CREDITO" && compra.saldoPendiente !== undefined) {
      const nuevoSaldo = Math.max(0, r2(compra.saldoPendiente - totalDevolucion));
      compra.saldoPendiente = nuevoSaldo;
      if (nuevoSaldo <= 0.001) compra.estadoPago = "PAGADO";
      else compra.estadoPago = "PARCIAL";
    }
  }, recalcularProducto);

  return devolucion;
}
