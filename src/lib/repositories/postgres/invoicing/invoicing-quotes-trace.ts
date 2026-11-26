import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput, TotalesFacturaCalculados } from "./types";
import type { CotizacionBloqueada } from "./invoicing-validation";

export async function actualizarCotizacionFacturada(
  executor: SqlExecutor,
  cotizacionId: string,
  facturaId: string,
  items: EmitirFacturaInput["items"],
  cotizacionBloqueada: CotizacionBloqueada | null
): Promise<void> {
  if (!cotizacionBloqueada) return;
  for (const it of items) {
    const ci = (it.cotizacionItemId ? cotizacionBloqueada.itemsById.get(it.cotizacionItemId) : null) ||
      cotizacionBloqueada.itemsByProd.get(it.productoId);
    if (ci) {
      await executor.query(
        `UPDATE cotizacion_items
         SET cantidad_facturada = cantidad_facturada + $1,
             cantidad_pendiente = cantidad_pendiente - $1
         WHERE id = $2`,
        [it.cantidad, ci.id]
      );
    }
  }

  const saldoRes = await executor.query(
    `SELECT COALESCE(SUM(cantidad_pendiente), 0)::float as total_pendiente
     FROM cotizacion_items WHERE cotizacion_id = $1`,
    [cotizacionId]
  );
  const totPendiente = Number(saldoRes.rows[0]?.total_pendiente || 0);
  const nuevoEstado = totPendiente <= 0.0001 ? "FACTURADA" : "PARCIALMENTE_FACTURADA";

  await executor.query(
    `UPDATE cotizaciones SET estado = $1, factura_id = COALESCE(factura_id, $2) WHERE id = $3`,
    [nuevoEstado, facturaId, cotizacionId]
  );
}

export async function registrarOperacionTransferencia(
  executor: SqlExecutor,
  facturaId: string,
  numeroFactura: string,
  input: EmitirFacturaInput,
  totales: TotalesFacturaCalculados
): Promise<void> {
  const formaPago = input.formaPago || "EFECTIVO";
  if (formaPago === "TRANSFERENCIA" || formaPago === "MIXTO") {
    const refBancaria = input.referenciaBancaria || input.claveIdempotencia || `REF-${numeroFactura}`;
    const montoDeclarado = formaPago === "MIXTO" ? totales.montoTransfCobro : totales.totalFactura;
    const opId = `optx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await executor.query(
      `INSERT INTO operaciones_pendientes_transferencia (
         id, factura_id, cotizacion_id, cliente_id, cliente_nombre,
         cajero_id, cajero_nombre, banco_origen, banco_destino,
         referencia_bancaria, monto_declarado, payload_lineas,
         estado_bancario, estado_comercial, stock_reservado, cobro_mixto, monto_efectivo_mixto
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDIENTE_VERIFICACION', 'PENDIENTE_CONFIRMACION', true, $13, $14)`,
      [
        opId,
        facturaId,
        input.cotizacionId || null,
        input.clienteId || null,
        input.cliente.trim(),
        input.creadoPor,
        input.creadoPor,
        input.bancoOrigen || "BAC",
        input.bancoDestino || "BANPRO",
        refBancaria,
        montoDeclarado,
        JSON.stringify(input.items),
        formaPago === "MIXTO",
        formaPago === "MIXTO" ? totales.montoEfectivoCobro : 0,
      ]
    );
  }
}
