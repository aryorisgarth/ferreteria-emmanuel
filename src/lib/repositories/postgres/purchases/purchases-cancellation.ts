import type { Compra } from "@/lib/types";
import type { SqlExecutor } from "../client";

export async function ejecutarAnularCompra(
  executor: SqlExecutor,
  id: string,
  usuario: string,
  motivo: string,
  obtenerCompra: (id: string) => Promise<Compra | null>
): Promise<Compra> {
  const c = await obtenerCompra(id);
  if (!c) throw new Error("Compra no encontrada.");
  if (c.anulada) throw new Error("La compra ya se encuentra anulada.");

  if (c.stockAplicado) {
    for (const it of c.items) {
      const prodRes = await executor.query(
        `SELECT stock_actual::float as stock, costo::float, unidad_medida as "unidadMedida" FROM productos WHERE id = $1 FOR UPDATE;`,
        [it.productoId]
      );
      if (prodRes.rows.length > 0) {
        const p = prodRes.rows[0];
        const nuevoStock = Math.max(0, p.stock - it.cantidad);
        await executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
          nuevoStock,
          it.productoId,
        ]);

        const seqRes = await executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
        const seq = seqRes.rows[0].seq;
        const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        await executor.query(
          `INSERT INTO kardex_movimientos (
            id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
            unidad_medida, numero_referencia, concepto, usuario, origen, secuencia,
            costo_unitario, valor_salida, saldo_valorado
          ) VALUES (
            $1, $2, NOW(), 'SALIDA', $3, 0, $3, $4,
            $5, $6, $7, $8, 'AJUSTE', $9,
            $10, $11, $12
          );`,
          [
            movId, it.productoId, it.cantidad, nuevoStock, p.unidadMedida,
            c.numero, `Anulación de compra ${c.numero}: ${motivo}`, usuario,
            seq, p.costo, p.costo * it.cantidad, nuevoStock * p.costo,
          ]
        );
      }
    }
  }

  await executor.query(
    `UPDATE compras SET
      anulada = true,
      anulada_por = $1,
      motivo_anulacion = $2,
      fecha_anulacion = NOW(),
      estado_pago = 'ANULADA',
      saldo_pendiente = 0.00
    WHERE id = $3;`,
    [usuario, motivo, id]
  );

  return (await obtenerCompra(id))!;
}
