import type { SqlExecutor } from "../client";

export async function rechazarTransferenciaOperacion(
  executor: SqlExecutor,
  id: string,
  verificadoPor: string,
  motivo: string
): Promise<boolean> {
  const trRes = await executor.query(
    `SELECT id, factura_id, cobro_mixto, monto_efectivo_mixto FROM operaciones_pendientes_transferencia WHERE id = $1 FOR UPDATE`,
    [id]
  );
  if (trRes.rows.length === 0) throw new Error("Transferencia no encontrada.");
  const tr = trRes.rows[0];

  await executor.query(
    `UPDATE operaciones_pendientes_transferencia
     SET estado_bancario = 'RECHAZADO',
         estado_comercial = 'CANCELADA',
         verificado_por = $1,
         fecha_verificacion = NOW(),
         motivo_rechazo = $2,
         stock_reservado = false,
         actualizado_en = NOW()
     WHERE id = $3`,
    [verificadoPor, motivo, id]
  );

  if (!tr.factura_id) return true;

  await executor.query(
    `UPDATE factura_cobros SET estado = 'RECHAZADO' WHERE factura_id = $1 AND metodo_pago = 'TRANSFERENCIA'`,
    [tr.factura_id]
  );

  if (tr.cobro_mixto && Number(tr.monto_efectivo_mixto || 0) > 0) {
    const facRes = await executor.query(`SELECT turno_caja_id, numero FROM facturas WHERE id = $1`, [tr.factura_id]);
    const fac = facRes.rows[0];
    if (fac?.turno_caja_id) {
      const montoDevolucion = Number(tr.monto_efectivo_mixto);
      const movId = `mcaj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executor.query(
        `INSERT INTO movimientos_caja (id, turno_caja_id, tipo, monto, concepto, fecha, usuario)
         VALUES ($1, $2, 'EGRESO', $3, $4, NOW(), $5)`,
        [
          movId,
          fac.turno_caja_id,
          montoDevolucion,
          `Devolución anticipo efectivo por transferencia rechazada factura ${fac.numero}`,
          verificadoPor,
        ]
      );
      await executor.query(
        `UPDATE turnos_caja SET total_egresos = total_egresos + $1 WHERE id = $2`,
        [montoDevolucion, fac.turno_caja_id]
      );
    }
  }

  await executor.query(
    `UPDATE facturas
     SET anulada = true,
         motivo_anulacion = $1,
         anulada_por = $2,
         fecha_anulacion = NOW()
     WHERE id = $3`,
    [`Transferencia rechazada: ${motivo}`, verificadoPor, tr.factura_id]
  );

  return true;
}
