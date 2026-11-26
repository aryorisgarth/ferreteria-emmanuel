import { r2, r3 } from "@/lib/format";
import type { DB, LineaRecepcionCompra, RecepcionCompra } from "@/lib/types";
import { fechaValida, ReglaBodegaError } from "./engine-core";
import { conStock, exigirProducto, movimientoNuevo, siguiente } from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function registrarRecepcionCompra(
  db: DB,
  input: {
    pedidoId?: string | null;
    proveedor: string;
    proveedorId?: string | null;
    fecha: string;
    remisionProveedor?: string;
    responsable: string;
    estadoConformidad?: "CONFORME" | "INCOMPLETO" | "CON_DANOS";
    notas?: string;
    items: Array<{
      productoId: string;
      cantidadRecibida: number;
      costoUnitario: number;
      lineaPedidoId?: string;
      observacion?: string;
    }>;
  },
): RecepcionCompra {
  const proveedor = input.proveedor.trim();
  if (proveedor.length < 2) throw new ReglaBodegaError("Indique el proveedor.");
  fechaValida(input.fecha);
  if (!input.items?.length) throw new ReglaBodegaError("Indique los artículos recibidos.");

  if (!db.recepcionesCompra) db.recepcionesCompra = [];

  const pedido = input.pedidoId ? (db.pedidosCompra ?? []).find((p) => p.id === input.pedidoId) : null;
  if (input.pedidoId && !pedido) throw new ReglaBodegaError("El pedido de compra especificado no existe.");
  if (pedido && pedido.estado === "CANCELADO") throw new ReglaBodegaError("No se pueden registrar recepciones sobre un pedido cancelado.");

  const itemsRecepcion: LineaRecepcionCompra[] = [];
  for (const it of input.items) {
    const prod = exigirProducto(db, it.productoId);
    if (!(it.cantidadRecibida > 0)) throw new ReglaBodegaError(`La cantidad recibida de ${prod.nombre} debe ser mayor que cero.`);
    if (!Number.isFinite(it.costoUnitario) || it.costoUnitario < 0) {
      throw new ReglaBodegaError(`El costo unitario de ${prod.nombre} no es válido.`);
    }

    if (pedido) {
      const lineaPedido = pedido.items.find((lp) => lp.id === it.lineaPedidoId || lp.productoId === it.productoId);
      if (lineaPedido) {
        const pendiente = r3(lineaPedido.cantidadPedida - lineaPedido.cantidadRecibida);
        if (it.cantidadRecibida > pendiente + 0.0001) {
          throw new ReglaBodegaError(
            `La cantidad recibida (${it.cantidadRecibida}) excede la cantidad pendiente (${pendiente}) para el artículo ${prod.nombre} en el pedido ${pedido.numero}.`
          );
        }
      }
    }

    itemsRecepcion.push({
      id: crypto.randomUUID(),
      productoId: prod.id,
      cantidadRecibida: r3(it.cantidadRecibida),
      costoUnitario: r2(it.costoUnitario),
      lineaPedidoId: it.lineaPedidoId,
      observacion: (it.observacion ?? "").trim(),
    });
  }

  const recepcion: RecepcionCompra = {
    id: crypto.randomUUID(),
    numero: "",
    pedidoId: pedido ? pedido.id : null,
    proveedorId: input.proveedorId ?? pedido?.proveedorId ?? null,
    proveedor: pedido?.proveedor || proveedor,
    fecha: input.fecha,
    remisionProveedor: (input.remisionProveedor ?? "").trim(),
    responsable: (input.responsable ?? "").trim(),
    estadoConformidad: input.estadoConformidad ?? "CONFORME",
    notas: (input.notas ?? "").trim(),
    stockAplicado: false,
    items: itemsRecepcion,
    createdAt: new Date().toISOString(),
  };

  conStock(db, itemsRecepcion.map((it) => it.productoId), () => {
    recepcion.numero = siguiente(db, "recepcion", input.fecha);
    db.recepcionesCompra!.push(recepcion);

    for (const linea of itemsRecepcion) {
      const producto = exigirProducto(db, linea.productoId);
      const stockPrevio = Math.max(0, producto.stockActual);
      const costoPrevio = producto.costo || 0;
      const cantidad = linea.cantidadRecibida;
      const costo = linea.costoUnitario;

      if (stockPrevio <= 0 || costoPrevio <= 0) {
        producto.costo = r2(costo);
      } else {
        const valPrev = stockPrevio * costoPrevio;
        const valLote = cantidad * costo;
        producto.costo = r2((valPrev + valLote) / (stockPrevio + cantidad));
      }

      const llave = `RECEPCION:${recepcion.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) throw new ReglaBodegaError("RECEPCION_DUPLICADA");

      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: input.fecha,
          tipo: "ENTRADA",
          cantidad: linea.cantidadRecibida,
          destinatario: "",
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: recepcion.numero,
          concepto: `Recepción ${recepcion.numero}${recepcion.remisionProveedor ? ` · Rem: ${recepcion.remisionProveedor}` : ""} · ${recepcion.proveedor}`,
          usuario: input.responsable,
          esAuditoria: false,
          origen: "COMPRA",
          idempotencyKey: llave,
          costoUnitario: linea.costoUnitario,
        }),
      );

      if (pedido) {
        const lineaPedido = pedido.items.find((lp) => lp.id === linea.lineaPedidoId || lp.productoId === linea.productoId);
        if (lineaPedido) {
          lineaPedido.cantidadRecibida = r3(lineaPedido.cantidadRecibida + linea.cantidadRecibida);
        }
      }
    }

    recepcion.stockAplicado = true;

    if (pedido) {
      const todoRecibido = pedido.items.every((lp) => lp.cantidadRecibida >= lp.cantidadPedida - 0.0001);
      const algoRecibido = pedido.items.some((lp) => lp.cantidadRecibida > 0.0001);
      pedido.estado = todoRecibido ? "RECIBIDO" : algoRecibido ? "PARCIAL" : "EMITIDO";
    }
  }, recalcularProducto);

  return recepcion;
}
