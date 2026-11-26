import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput, TotalesFacturaCalculados } from "./types";

export async function generarNumeroFactura(executor: SqlExecutor): Promise<string> {
  const folioRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero)
    VALUES ('factura', 1)
    ON CONFLICT (tipo)
    DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero
  `);
  const numSeq = folioRes.rows[0].ultimo_numero;
  const anio = new Date().getFullYear();
  return `FAC-${anio}-${String(numSeq).padStart(4, "0")}`;
}

export function calcularTotalesFactura(
  input: EmitirFacturaInput,
  productMap: Map<string, any>
): TotalesFacturaCalculados {
  let subtotal = 0;
  let totalDescuento = 0;
  let totalIva = 0;
  let costoTotalVenta = 0;

  for (const it of input.items) {
    const p = productMap.get(it.productoId);
    const descUnit = it.descuento || 0;
    const baseUnit = Math.max(0, it.precio - descUnit);
    const subLinea = baseUnit * it.cantidad;
    subtotal += it.precio * it.cantidad;
    totalDescuento += descUnit * it.cantidad;
    if (!it.exentoIva && !input.exenta) {
      totalIva += subLinea * 0.15;
    }
    costoTotalVenta += (p?.costo || 0) * it.cantidad;
  }

  const totalFactura = subtotal - totalDescuento + totalIva;
  const formaPago = input.formaPago || "EFECTIVO";

  const montoEfectivoCobro = formaPago === "MIXTO"
    ? (input.montoEfectivo || 0)
    : (formaPago === "EFECTIVO" ? totalFactura : 0);

  const montoTransfCobro = formaPago === "MIXTO"
    ? (input.montoTransferencia || 0)
    : (formaPago === "TRANSFERENCIA" ? totalFactura : 0);

  if (formaPago === "MIXTO") {
    if (montoEfectivoCobro <= 0 || montoTransfCobro <= 0) {
      throw new Error("El pago mixto requiere montos válidos mayores a cero tanto en efectivo como en transferencia.");
    }
    const sumaMixta = Math.round((montoEfectivoCobro + montoTransfCobro) * 100) / 100;
    if (Math.abs(sumaMixta - totalFactura) > 0.05) {
      throw new Error(
        `La suma del efectivo (C$ ${montoEfectivoCobro.toFixed(2)}) y la transferencia (C$ ${montoTransfCobro.toFixed(2)}) no coincide con el total (C$ ${totalFactura.toFixed(2)}).`
      );
    }
  }

  const requiereVerificacionBancaria = formaPago === "TRANSFERENCIA" || formaPago === "MIXTO";
  const stockAplicado = !requiereVerificacionBancaria;
  const estadoInicialFactura = requiereVerificacionBancaria ? "EMITIDA" : "PAGADA";

  const montoRecibidoRegistrado = formaPago === "MIXTO"
    ? (input.montoRecibido || montoEfectivoCobro)
    : (input.montoRecibido || totalFactura);

  const cambioRegistrado = formaPago === "MIXTO"
    ? Math.max(0, (input.montoRecibido || montoEfectivoCobro) - montoEfectivoCobro)
    : Math.max(0, (input.montoRecibido || totalFactura) - totalFactura);

  return {
    subtotal,
    totalDescuento,
    totalIva,
    costoTotalVenta,
    totalFactura,
    montoEfectivoCobro,
    montoTransfCobro,
    montoRecibidoRegistrado,
    cambioRegistrado,
    requiereVerificacionBancaria,
    stockAplicado,
    estadoInicialFactura,
  };
}
