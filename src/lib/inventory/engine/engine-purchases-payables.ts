import { r2 } from "@/lib/format";
import type { DB, FormaPagoCompra, PagoCompra } from "@/lib/types";
import { fechaValida, ISV, ReglaBodegaError } from "./engine-core";
import { siguiente } from "./engine-helpers";
import { vistaLineas } from "./engine-lines";

export function registrarAbonoCompra(
  db: DB,
  input: {
    compraId: string;
    fecha: string;
    monto: number;
    formaPago?: FormaPagoCompra;
    referencia?: string;
    notas?: string;
    creadoPor: string;
  },
): PagoCompra {
  const compra = db.compras.find((c) => c.id === input.compraId);
  if (!compra) throw new ReglaBodegaError("La compra no existe.");
  if (compra.anulada) throw new ReglaBodegaError("No se pueden registrar pagos a una compra anulada.");
  if (compra.condicionPago !== "CREDITO") {
    throw new ReglaBodegaError("Solo se pueden registrar abonos en compras a crédito.");
  }
  fechaValida(input.fecha);
  if (!(input.monto > 0)) throw new ReglaBodegaError("El monto del abono debe ser mayor que cero.");

  const saldoActual = compra.saldoPendiente ?? 0;
  if (input.monto > saldoActual + 0.001) {
    throw new ReglaBodegaError(`El monto del abono (C$ ${input.monto}) excede el saldo pendiente de la compra (C$ ${saldoActual}).`);
  }

  if (!db.pagosCompra) db.pagosCompra = [];

  const pago: PagoCompra = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "pago", input.fecha),
    compraId: compra.id,
    proveedorId: compra.proveedorId,
    fecha: input.fecha,
    monto: r2(input.monto),
    formaPago: input.formaPago ?? "EFECTIVO",
    referencia: (input.referencia ?? "").trim(),
    notas: (input.notas ?? "").trim(),
    creadoPor: input.creadoPor,
    createdAt: new Date().toISOString(),
  };

  db.pagosCompra.push(pago);

  compra.saldoPendiente = r2(saldoActual - input.monto);
  if (compra.saldoPendiente <= 0.001) {
    compra.saldoPendiente = 0;
    compra.estadoPago = "PAGADO";
  } else {
    compra.estadoPago = "PARCIAL";
  }

  return pago;
}

export function historialPagosCompra(db: DB, compraId: string) {
  return (db.pagosCompra ?? []).filter((p) => p.compraId === compraId).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function listarCuentasPorPagar(db: DB) {
  const comprasCredito = db.compras.filter(
    (c) => !c.anulada && c.condicionPago === "CREDITO" && (c.saldoPendiente ?? 0) > 0.001
  );

  return comprasCredito.map((c) => {
    const items = vistaLineas(db, c.items);
    const subtotal = r2(items.reduce((s, it) => s + it.importe, 0));
    const descuento = c.descuento ?? 0;
    const isv = c.isv !== undefined ? c.isv : r2(Math.max(0, subtotal - descuento) * ISV);
    const total = c.total !== undefined ? c.total : r2(Math.max(0, subtotal - descuento) + isv);
    const saldoPendiente = c.saldoPendiente ?? total;
    const totalAbonado = r2(total - saldoPendiente);

    return {
      compra: c,
      total,
      saldoPendiente,
      totalAbonado,
      estadoPago: c.estadoPago ?? "PENDIENTE",
      fechaVencimiento: c.fechaVencimiento ?? c.fecha,
    };
  }).sort((a, b) => (a.fechaVencimiento || "").localeCompare(b.fechaVencimiento || ""));
}
