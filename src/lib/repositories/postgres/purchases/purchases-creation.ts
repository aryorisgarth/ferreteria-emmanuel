import type { SqlExecutor } from "../client";
import type { AltaCompraInput } from "./types";

export async function ejecutarAltaCompra(executor: SqlExecutor, input: AltaCompraInput): Promise<string> {
  if (!input.items || input.items.length === 0) throw new Error("La compra debe contener al menos un producto.");

  const compraId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('compra', 1)
    ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero;
  `);
  const numSeq = numRes.rows[0].ultimo_numero;
  const numero = `CMP-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

  let subtotal = 0;
  let totalDescuento = 0;
  let totalIva = 0;

  for (const it of input.items) {
    const desc = it.descuento || 0;
    const base = Math.max(0, it.precio - desc);
    subtotal += it.precio * it.cantidad;
    totalDescuento += desc * it.cantidad;
    if (!it.exentoIva) totalIva += base * it.cantidad * 0.15;
  }
  const total = subtotal - totalDescuento + totalIva;
  const condicion = input.condicionPago || "CONTADO";
  const saldoPendiente = condicion === "CREDITO" ? total : 0;
  const estadoPago = condicion === "CREDITO" ? "PENDIENTE" : "PAGADO";
  const fecha = input.fecha || new Date().toISOString();
  const diasCredito = input.diasCredito || 0;

  await executor.query(
    `INSERT INTO compras (
      id, numero, factura_proveedor, proveedor_id, proveedor, fecha, notas, creado_por,
      condicion_pago, forma_pago, dias_credito, saldo_pendiente, estado_pago,
      subtotal, descuento, iva, total, pedido_id, recepcion_id, stock_aplicado
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19, $20
    );`,
    [
      compraId, numero, input.facturaProveedor || null, input.proveedorId || null,
      input.proveedor.trim(), fecha, input.notas || "", input.creadoPor, condicion,
      input.formaPago || "EFECTIVO", diasCredito, saldoPendiente, estadoPago,
      subtotal, totalDescuento, totalIva, total, input.pedidoId || null,
      input.recepcionId || null, input.stockAplicado !== false,
    ]
  );

  for (const it of input.items) {
    const prodRes = await executor.query(
      `SELECT id, unidad_medida as "unidadMedida", stock_actual::float as stock, costo::float FROM productos WHERE id = $1 FOR UPDATE;`,
      [it.productoId]
    );
    if (prodRes.rows.length === 0) throw new Error(`Producto ${it.productoId} no encontrado.`);
    const p = prodRes.rows[0];

    const itemId = `cmpi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await executor.query(
      `INSERT INTO compra_items (
        id, compra_id, producto_id, cantidad, precio, unidad_medida, observacion,
        costo_unitario, descuento, exento_iva
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [itemId, compraId, it.productoId, it.cantidad, it.precio, p.unidadMedida, it.observacion || "", it.precio, it.descuento || 0, it.exentoIva || false]
    );

    if (input.stockAplicado !== false) {
      const nuevoStock = p.stock + it.cantidad;
      const valorInventarioPrevio = p.stock * p.costo;
      const valorEntrada = it.cantidad * it.precio;
      const nuevoCostoCPP = nuevoStock > 0 ? (valorInventarioPrevio + valorEntrada) / nuevoStock : it.precio;

      await executor.query(
        "UPDATE productos SET stock_actual = $1, costo = $2, actualizado_en = NOW() WHERE id = $3;",
        [nuevoStock, nuevoCostoCPP, it.productoId]
      );

      const seqRes = await executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
      const seq = seqRes.rows[0].seq;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await executor.query(
        `INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, destinatario, numero_referencia, concepto, usuario, origen, secuencia,
          costo_unitario, valor_entrada, saldo_valorado
        ) VALUES (
          $1, $2, $3, 'ENTRADA', $4, $4, 0, $5,
          $6, $7, $8, $9, $10, 'COMPRA', $11,
          $12, $13, $14
        );`,
        [
          movId, it.productoId, fecha, it.cantidad, nuevoStock, p.unidadMedida,
          input.proveedor, numero, `Compra según ${numero}`, input.creadoPor,
          seq, it.precio, valorEntrada, nuevoStock * nuevoCostoCPP,
        ]
      );
    }
  }

  return compraId;
}
