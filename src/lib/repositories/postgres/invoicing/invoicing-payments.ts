import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput, TotalesFacturaCalculados } from "./types";

export async function registrarCobroCaja(
  executor: SqlExecutor,
  turnoId: string | null,
  formaPago: string,
  numeroFactura: string,
  fecha: string,
  usuario: string,
  montoEfectivo: number
): Promise<void> {
  if (turnoId && (formaPago === "EFECTIVO" || formaPago === "MIXTO") && montoEfectivo > 0) {
    const movCajaId = `mcaj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const concepto = formaPago === "MIXTO"
      ? `Anticipo efectivo venta mixta factura ${numeroFactura}`
      : `Venta contado factura ${numeroFactura}`;

    await executor.query(
      `INSERT INTO movimientos_caja (id, turno_caja_id, tipo, monto, concepto, fecha, usuario)
       VALUES ($1, $2, 'INGRESO', $3, $4, $5, $6)`,
      [movCajaId, turnoId, montoEfectivo, concepto, fecha, usuario]
    );

    await executor.query(
      `UPDATE turnos_caja SET total_ventas_efectivo = total_ventas_efectivo + $1 WHERE id = $2`,
      [montoEfectivo, turnoId]
    );
  }
}

export async function registrarFacturaCobros(
  executor: SqlExecutor,
  facturaId: string,
  input: EmitirFacturaInput,
  totales: TotalesFacturaCalculados,
  turnoId: string | null,
  numeroFactura: string
): Promise<void> {
  const formaPago = input.formaPago || "EFECTIVO";
  if (formaPago === "MIXTO") {
    await executor.query(
      `INSERT INTO factura_cobros (
         id, factura_id, metodo_pago, monto, estado, monto_recibido, cambio, turno_caja_id, creado_por
       ) VALUES ($1, $2, 'EFECTIVO', $3, 'CONFIRMADO', $4, $5, $6, $7)`,
      [
        `fcob_${Date.now()}_ef_${Math.random().toString(36).substring(2, 6)}`,
        facturaId,
        totales.montoEfectivoCobro,
        input.montoRecibido || totales.montoEfectivoCobro,
        totales.cambioRegistrado,
        turnoId,
        input.creadoPor,
      ]
    );

    await executor.query(
      `INSERT INTO factura_cobros (
         id, factura_id, metodo_pago, monto, estado, banco_origen, banco_destino, referencia_bancaria, turno_caja_id, creado_por
       ) VALUES ($1, $2, 'TRANSFERENCIA', $3, 'PENDIENTE_VERIFICACION', $4, $5, $6, $7, $8)`,
      [
        `fcob_${Date.now()}_tr_${Math.random().toString(36).substring(2, 6)}`,
        facturaId,
        totales.montoTransfCobro,
        input.bancoOrigen || "BAC",
        input.bancoDestino || "BANPRO",
        input.referenciaBancaria || `REF-${numeroFactura}`,
        turnoId,
        input.creadoPor,
      ]
    );
  } else {
    await executor.query(
      `INSERT INTO factura_cobros (
         id, factura_id, metodo_pago, monto, estado, banco_origen, banco_destino, referencia_bancaria,
         monto_recibido, cambio, turno_caja_id, creado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        `fcob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        facturaId,
        formaPago,
        totales.totalFactura,
        formaPago === "TRANSFERENCIA" ? "PENDIENTE_VERIFICACION" : "CONFIRMADO",
        input.bancoOrigen || null,
        input.bancoDestino || null,
        input.referenciaBancaria || null,
        input.montoRecibido || totales.totalFactura,
        totales.cambioRegistrado,
        turnoId,
        input.creadoPor,
      ]
    );
  }
}
