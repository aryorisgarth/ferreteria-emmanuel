import { r2, r3 } from "@/lib/format";
import type { Compra, DB } from "@/lib/types";
import { ReglaBodegaError, totalesLineas } from "./engine-core";
import { conStock, exigirProducto, movimientoNuevo } from "./engine-helpers";
import { vistaLineas } from "./engine-lines";
import { recalcularProducto } from "./engine-products";

export function detalleCompra(db: DB, id: string) {
  const compra = db.compras.find((c) => c.id === id);
  if (!compra) return null;
  return { ...compra, items: vistaLineas(db, compra.items), ...totalesLineas(compra.items) };
}

export function validarAnulacionCompra(db: DB, compra: Compra) {
  if (compra.recepcionId) {
    throw new ReglaBodegaError(`No se puede anular la compra ${compra.numero}: Está vinculada a una recepción de mercancía física.`);
  }
  const tienePagos = (db.pagosCompra ?? []).some((p) => p.compraId === compra.id);
  if (tienePagos) {
    throw new ReglaBodegaError(`No se puede anular la compra ${compra.numero}: Tiene pagos o abonos registrados. Debe anular los pagos primero.`);
  }
  const tieneDevoluciones = (db.devolucionesProveedor ?? []).some((d) => d.compraId === compra.id);
  if (tieneDevoluciones) {
    throw new ReglaBodegaError(`No se puede anular la compra ${compra.numero}: Tiene devoluciones a proveedor registradas.`);
  }

  for (const linea of compra.items) {
    const producto = exigirProducto(db, linea.productoId);
    if (producto.stockActual < linea.cantidad) {
      throw new ReglaBodegaError(
        `No se puede anular la compra ${compra.numero}: El artículo ${producto.nombre} (${producto.codigo}) no cuenta con existencias suficientes (${producto.stockActual} disponibles, se requieren ${linea.cantidad}).`
      );
    }

    const movOriginal = db.movimientos.find(
      (m) =>
        m.productoId === linea.productoId &&
        (m.idempotencyKey === `COMPRA:${compra.id}:ITEM:${linea.id}` || m.numeroReferencia === compra.numero)
    );

    const fechaBase = movOriginal ? movOriginal.fecha : compra.fecha;
    const createdAtBase = (movOriginal ? movOriginal.createdAt : compra.createdAt) || "";
    const secuenciaBase = movOriginal ? movOriginal.secuencia : 0;

    const movsPosteriores = db.movimientos.filter((m) => {
      if (m.productoId !== linea.productoId) return false;
      if (m.idempotencyKey?.startsWith(`ANULA:COMPRA:${compra.id}`)) return false;
      if (movOriginal && m.id === movOriginal.id) return false;
      if (m.fecha > fechaBase) return true;
      if (m.fecha === fechaBase) {
        if (m.secuencia > secuenciaBase) return true;
        if (m.secuencia === secuenciaBase && m.createdAt > createdAtBase) return true;
      }
      return false;
    });

    const tieneVentaPosterior =
      db.facturas.some(
        (f) =>
          f.estado !== "ANULADA" &&
          (f.fecha > compra.fecha || (f.fecha === compra.fecha && f.numero > compra.numero)) &&
          f.items.some((i) => i.productoId === linea.productoId)
      ) ||
      movsPosteriores.some((m) => m.tipo === "SALIDA" || m.origen === "FACTURA" || (m.idempotencyKey && m.idempotencyKey.startsWith("FACTURA")));

    if (tieneVentaPosterior) {
      throw new ReglaBodegaError(
        `No se puede anular la compra ${compra.numero}: El artículo ${producto.nombre} (${producto.codigo}) tiene ventas posteriores registradas. Las devoluciones físicas deben tramitarse a través de devoluciones.`
      );
    }

    const tieneCompraPosterior =
      db.compras.some(
        (c) =>
          !c.anulada &&
          c.id !== compra.id &&
          (c.fecha > compra.fecha || (c.fecha === compra.fecha && c.numero > compra.numero)) &&
          c.items.some((i) => i.productoId === linea.productoId)
      ) ||
      movsPosteriores.some((m) => m.origen === "COMPRA" || (m.idempotencyKey && m.idempotencyKey.startsWith("COMPRA")));

    if (tieneCompraPosterior) {
      throw new ReglaBodegaError(
        `No se puede anular la compra ${compra.numero}: El artículo ${producto.nombre} (${producto.codigo}) tiene compras posteriores que recalcularon el CPP.`
      );
    }

    if (movsPosteriores.length > 0) {
      throw new ReglaBodegaError(
        `No se puede anular la compra ${compra.numero}: El artículo ${producto.nombre} (${producto.codigo}) tiene movimientos posteriores registrados en el Kárdex.`
      );
    }
  }
}

export function anularCompra(db: DB, id: string, usuario: string) {
  const compra = db.compras.find((c) => c.id === id);
  if (!compra) throw new ReglaBodegaError("La compra no existe.");
  if (compra.anulada) throw new ReglaBodegaError("La compra ya está anulada.");

  validarAnulacionCompra(db, compra);

  conStock(db, compra.items.map((item) => item.productoId), () => {
    validarAnulacionCompra(db, compra);

    for (const linea of compra.items) {
      const producto = exigirProducto(db, linea.productoId);
      const stockActual = Math.max(0, producto.stockActual);
      const costoActual = producto.costo || 0;
      const cantidadAnulada = linea.cantidad;
      const precioCompraAnulada = linea.precio;

      const stockRemanente = r3(stockActual - cantidadAnulada);
      if (stockRemanente <= 0.0005) {
        producto.costo = 0;
      } else {
        const valorActual = stockActual * costoActual;
        const valorAnulado = cantidadAnulada * precioCompraAnulada;
        const valorRemanente = valorActual - valorAnulado;
        producto.costo = r2(valorRemanente / stockRemanente);
      }

      const llave = `ANULA:COMPRA:${compra.id}:ITEM:${linea.id}`;
      if (db.movimientos.some((m) => m.idempotencyKey === llave)) continue;

      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: compra.fecha,
          tipo: "SALIDA",
          cantidad: linea.cantidad,
          destinatario: compra.proveedor,
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: compra.numero,
          concepto: `Anulación compra ${compra.numero}`,
          usuario,
          esAuditoria: false,
          origen: "COMPRA",
          idempotencyKey: llave,
        }),
      );
    }
    compra.anulada = true;
  }, recalcularProducto);
  return compra;
}
