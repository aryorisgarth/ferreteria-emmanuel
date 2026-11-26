import type { SqlExecutor } from "../client";

export async function verificarTransferenciaOperacion(
  executor: SqlExecutor,
  id: string,
  verificadoPor: string,
  montoAcreditado?: number
): Promise<boolean> {
  const trRes = await executor.query(
    `SELECT id, factura_id, monto_declarado, cobro_mixto FROM operaciones_pendientes_transferencia WHERE id = $1 FOR UPDATE`,
    [id]
  );
  if (trRes.rows.length === 0) throw new Error("Transferencia no encontrada.");
  const tr = trRes.rows[0];

  const montoFinal = montoAcreditado || tr.monto_declarado;
  await executor.query(
    `UPDATE operaciones_pendientes_transferencia
     SET estado_bancario = 'ACREDITADO',
         estado_comercial = 'CONFIRMADA',
         verificado_por = $1,
         fecha_verificacion = NOW(),
         monto_acreditado = $2,
         stock_reservado = false,
         actualizado_en = NOW()
     WHERE id = $3`,
    [verificadoPor, montoFinal, id]
  );

  if (!tr.factura_id) return true;

  await executor.query(
    `UPDATE factura_cobros SET estado = 'CONFIRMADO' WHERE factura_id = $1 AND metodo_pago = 'TRANSFERENCIA'`,
    [tr.factura_id]
  );

  const facRes = await executor.query(
    `SELECT id, numero, cliente, creado_por, stock_aplicado, cotizacion_id FROM facturas WHERE id = $1 FOR UPDATE`,
    [tr.factura_id]
  );
  if (facRes.rows.length === 0) return true;
  const fac = facRes.rows[0];

  if (!fac.stock_aplicado) {
    const itemsRes = await executor.query(
      `SELECT producto_id, cantidad, observacion, costo_unitario, unidad_medida FROM factura_items WHERE factura_id = $1`,
      [fac.id]
    );

    for (const it of itemsRes.rows) {
      await executor.query(
        `UPDATE productos SET stock_actual = stock_actual - $1, actualizado_en = NOW() WHERE id = $2`,
        [it.cantidad, it.producto_id]
      );

      const prodRes = await executor.query(
        `SELECT stock_actual::float as "stockActual", costo::float FROM productos WHERE id = $1`,
        [it.producto_id]
      );
      const p = prodRes.rows[0];
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const movSeqRes = await executor.query(`SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos`);
      const seq = movSeqRes.rows[0].seq;

      await executor.query(
        `INSERT INTO kardex_movimientos (
           id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
           unidad_medida, destinatario, numero_referencia, concepto, usuario,
           origen, secuencia, costo_unitario, valor_salida, saldo_valorado
         ) VALUES ($1, $2, NOW(), 'SALIDA', $3, 0, $3, $4, $5, $6, $7, $8, $9, 'FACTURA', $10, $11, $12, $13)`,
        [
          movId,
          it.producto_id,
          it.cantidad,
          p.stockActual,
          it.unidad_medida,
          fac.cliente,
          fac.numero,
          `Venta según factura ${fac.numero} (Transferencia Acreditada)`,
          verificadoPor,
          seq,
          it.costo_unitario,
          it.costo_unitario * it.cantidad,
          p.stockActual * it.costo_unitario,
        ]
      );
    }
  }

  if (fac.cotizacion_id) {
    const itemsRes = await executor.query(
      `SELECT producto_id, cantidad FROM factura_items WHERE factura_id = $1`,
      [fac.id]
    );
    for (const it of itemsRes.rows) {
      await executor.query(
        `UPDATE cotizacion_items
         SET cantidad_facturada = cantidad_facturada + $1,
             cantidad_pendiente = GREATEST(0, cantidad_pendiente - $1)
         WHERE cotizacion_id = $2 AND producto_id = $3`,
        [it.cantidad, fac.cotizacion_id, it.producto_id]
      );
    }
    const saldoGlobalRes = await executor.query(
      `SELECT COALESCE(SUM(cantidad_pendiente), 0)::float as total_pendiente FROM cotizacion_items WHERE cotizacion_id = $1`,
      [fac.cotizacion_id]
    );
    const totPendiente = Number(saldoGlobalRes.rows[0]?.total_pendiente || 0);
    const nuevoEstado = totPendiente <= 0.0001 ? "FACTURADA" : "PARCIALMENTE_FACTURADA";
    await executor.query(`UPDATE cotizaciones SET estado = $1 WHERE id = $2`, [nuevoEstado, fac.cotizacion_id]);
  }

  await executor.query(`UPDATE facturas SET estado = 'PAGADA', stock_aplicado = true WHERE id = $1`, [fac.id]);
  return true;
}
