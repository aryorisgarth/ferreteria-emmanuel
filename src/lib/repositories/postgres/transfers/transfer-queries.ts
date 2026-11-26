import type { SqlExecutor } from "../client";
import type { TransferenciaPendienteRow } from "./types";

export async function listarTransferenciasPendientes(executor: SqlExecutor): Promise<TransferenciaPendienteRow[]> {
  const res = await executor.query(`
    SELECT 
      t.id, t.factura_id as "facturaId", t.cotizacion_id as "cotizacionId",
      t.cliente_id as "clienteId", t.cliente_nombre as "clienteNombre",
      t.cajero_id as "cajeroId", t.cajero_nombre as "cajeroNombre",
      t.banco_origen as "bancoOrigen", t.banco_destino as "bancoDestino",
      t.referencia_bancaria as "referenciaBancaria", t.monto_declarado::float as "monto",
      t.monto_acreditado::float as "montoAcreditado", t.moneda,
      t.comprobante_url as "comprobanteUrl", t.estado_bancario as "estado",
      t.estado_comercial as "estadoComercial", t.verificado_por as "verificadoPor",
      t.fecha_verificacion as "fechaVerificacion", t.motivo_rechazo as "motivoRechazo",
      t.creado_en as "fecha", f.numero as "facturaNumero"
    FROM operaciones_pendientes_transferencia t
    LEFT JOIN facturas f ON f.id = t.factura_id
    ORDER BY t.creado_en DESC
  `);
  return res.rows;
}
