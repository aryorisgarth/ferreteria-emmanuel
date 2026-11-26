import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput } from "./types";

export async function registrarLineasEInventario(
  executor: SqlExecutor,
  facturaId: string,
  numeroFactura: string,
  fecha: string,
  input: EmitirFacturaInput,
  productMap: Map<string, any>,
  stockAplicado: boolean
): Promise<void> {
  for (const it of input.items) {
    const p = productMap.get(it.productoId);
    const itemId = `faci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await executor.query(
      `
      INSERT INTO factura_items (
        id, factura_id, producto_id, cantidad, precio, unidad_medida, observacion,
        costo_unitario, descuento, exento_iva
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        itemId,
        facturaId,
        it.productoId,
        it.cantidad,
        it.precio,
        p.unidadMedida,
        it.observacion || "",
        p.costo,
        it.descuento || 0,
        it.exentoIva || false,
      ]
    );

    // Descontar inventario de inmediato ÚNICAMENTE si no está retenido por verificación bancaria previa
    if (stockAplicado) {
      await executor.query(
        `UPDATE productos SET stock_actual = stock_actual - $1, actualizado_en = NOW() WHERE id = $2`,
        [it.cantidad, it.productoId]
      );

      const nuevoSaldo = p.stockActual - it.cantidad;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const movSeqRes = await executor.query(`SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos`);
      const seq = movSeqRes.rows[0].seq;

      await executor.query(
        `
        INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, destinatario, numero_referencia, concepto, usuario,
          origen, idempotency_key, secuencia, costo_unitario, valor_salida, saldo_valorado
        ) VALUES (
          $1, $2, $3, 'SALIDA', $4, 0, $4, $5,
          $6, $7, $8, $9, $10,
          'FACTURA', $11, $12, $13, $14, $15
        )
      `,
        [
          movId,
          it.productoId,
          fecha,
          it.cantidad,
          nuevoSaldo,
          p.unidadMedida,
          input.cliente,
          numeroFactura,
          `Venta según factura ${numeroFactura}`,
          input.creadoPor,
          input.claveIdempotencia ? `${input.claveIdempotencia}_${it.productoId}` : null,
          seq,
          p.costo,
          p.costo * it.cantidad,
          nuevoSaldo * p.costo,
        ]
      );
    }
  }
}
