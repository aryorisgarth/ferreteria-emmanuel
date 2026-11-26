import { r2 } from "@/lib/format";
import type { Compra, CondicionPagoCompra, DB, FormaPagoCompra } from "@/lib/types";
import { fechaValida, IVA, ReglaBodegaError } from "./engine-core";
import { conStock, movimientoNuevo, siguiente } from "./engine-helpers";
import { prepararLineas } from "./engine-lines";
import { recalcularProducto } from "./engine-products";

export function registrarCompra(
  db: DB,
  input: {
    proveedor?: string;
    proveedorId?: string | null;
    fecha: string;
    notas?: string;
    creadoPor?: string;
    registradoPor?: string;
    facturaProveedor?: string;
    numeroFactura?: string;
    condicionPago?: CondicionPagoCompra;
    formaPago?: FormaPagoCompra;
    diasCredito?: number;
    fechaVencimiento?: string;
    recepcionId?: string | null;
    pedidoId?: string | null;
    descuento?: number;
    iva?: number;
    isv?: number;
    tasaIva?: number;
    items: Array<{ productoId: string; cantidad: number; precio?: number; costoUnitario?: number; observacion?: string }>;
  },
) {
  const provEncontrado = input.proveedorId ? db.proveedores?.find((p) => p.id === input.proveedorId) : undefined;
  const proveedor = (input.proveedor ?? provEncontrado?.nombre ?? "").trim();
  if (proveedor.length < 2) throw new ReglaBodegaError("Indique el proveedor.");
  fechaValida(input.fecha);
  const itemsNormalizados = (input.items || []).map((it) => ({
    productoId: it.productoId,
    cantidad: it.cantidad,
    precio: it.precio ?? it.costoUnitario ?? 0,
    observacion: it.observacion,
  }));
  const items = prepararLineas(db, itemsNormalizados);

  const condicionPago: CondicionPagoCompra = input.condicionPago ?? "CONTADO";
  const formaPago: FormaPagoCompra = input.formaPago ?? "EFECTIVO";
  const subtotal = r2(items.reduce((acc, it) => acc + it.cantidad * it.precio, 0));
  const descuento = Math.max(0, r2(input.descuento ?? 0));
  const base = Math.max(0, r2(subtotal - descuento));

  let montoIva = 0;
  if (input.iva !== undefined) montoIva = r2(input.iva);
  else if (input.isv !== undefined) montoIva = r2(input.isv);
  else if (input.tasaIva !== undefined) montoIva = r2(base * input.tasaIva);
  else montoIva = r2(base * IVA);
  const total = r2(base + montoIva);

  let fechaVencimiento = input.fechaVencimiento;
  if (condicionPago === "CREDITO" && !fechaVencimiento) {
    const dias = input.diasCredito && input.diasCredito > 0 ? input.diasCredito : 30;
    const d = new Date(input.fecha);
    d.setDate(d.getDate() + dias);
    fechaVencimiento = d.toISOString().slice(0, 10);
  }

  const compra: Compra = {
    id: crypto.randomUUID(),
    numero: "",
    facturaProveedor: (input.facturaProveedor ?? input.numeroFactura ?? "").trim(),
    proveedorId: input.proveedorId ?? null,
    proveedor,
    fecha: input.fecha,
    notas: (input.notas ?? "").trim(),
    creadoPor: input.creadoPor ?? input.registradoPor ?? "Sistema",
    anulada: false,
    items,
    pedidoId: input.pedidoId ?? null,
    recepcionId: input.recepcionId ?? null,
    stockAplicado: false,
    condicionPago,
    formaPago,
    diasCredito: input.diasCredito ?? (condicionPago === "CREDITO" ? 30 : 0),
    fechaVencimiento,
    saldoPendiente: condicionPago === "CREDITO" ? total : 0,
    estadoPago: condicionPago === "CREDITO" ? "PENDIENTE" : "PAGADO",
    descuento,
    iva: montoIva,
    isv: montoIva,
    total,
    createdAt: new Date().toISOString(),
  };

  if (input.recepcionId) {
    const recepcion = (db.recepcionesCompra ?? []).find((r) => r.id === input.recepcionId);
    if (!recepcion) throw new ReglaBodegaError("La recepción de mercancía indicada no existe.");
    if (!recepcion.stockAplicado) throw new ReglaBodegaError("La recepción aún no ha aplicado el inventario.");

    compra.numero = siguiente(db, "compra", input.fecha);
    compra.stockAplicado = false;
    db.compras.push(compra);
    return compra;
  }

  conStock(db, items.map((item) => item.productoId), () => {
    compra.numero = siguiente(db, "compra", input.fecha);
    compra.stockAplicado = true;
    db.compras.push(compra);
    for (const linea of items) {
      const producto = db.productos.find((p) => p.id === linea.productoId);
      if (producto && linea.precio > 0) {
        const stockPrevio = Math.max(0, producto.stockActual);
        const costoPrevio = producto.costo || 0;
        const cantidadComprada = linea.cantidad;
        const costoCompraUnitario = linea.precio;

        if (stockPrevio <= 0 || costoPrevio <= 0) {
          producto.costo = r2(costoCompraUnitario);
        } else {
          const valorInventarioPrevio = stockPrevio * costoPrevio;
          const valorLoteComprado = cantidadComprada * costoCompraUnitario;
          const nuevoStockTotal = stockPrevio + cantidadComprada;
          const nuevoCostoPonderado = (valorInventarioPrevio + valorLoteComprado) / nuevoStockTotal;
          producto.costo = r2(nuevoCostoPonderado);
        }
      }

      db.movimientos.push(
        movimientoNuevo(db, {
          productoId: linea.productoId,
          fecha: input.fecha,
          tipo: "ENTRADA",
          cantidad: linea.cantidad,
          destinatario: "",
          oficinaId: null,
          actaId: null,
          actaItemId: null,
          solicitudId: null,
          solicitudItemId: null,
          numeroReferencia: compra.numero,
          concepto: `Compra ${compra.numero} · ${proveedor}`,
          usuario: compra.creadoPor || input.creadoPor || "Sistema",
          esAuditoria: false,
          origen: "COMPRA",
          idempotencyKey: `COMPRA:${compra.id}:ITEM:${linea.id}`,
          costoUnitario: linea.precio,
        }),
      );
    }
  }, recalcularProducto);

  return compra;
}
