import type { Compra, LineaComercial, Pagina } from "@/lib/types";
import type { SqlExecutor } from "../client";

export async function obtenerCompras(executor: SqlExecutor, page: number = 1): Promise<Pagina<Compra>> {
  const limit = 20;
  const offset = Math.max(0, (page - 1) * limit);

  const countRes = await executor.query("SELECT COUNT(*) as total FROM compras;");
  const total = parseInt(countRes.rows[0]?.total || "0", 10);
  const pages = Math.max(1, Math.ceil(total / limit));

  const rowsRes = await executor.query(
    `SELECT 
      id, numero, factura_proveedor as "facturaProveedor", proveedor_id as "proveedorId",
      proveedor, fecha, notas, creado_por as "creadoPor", anulada, fecha_anulacion as "fechaAnulacion",
      anulada_por as "anuladaPor", motivo_anulacion as "motivoAnulacion", pedido_id as "pedidoId",
      recepcion_id as "recepcionId", stock_aplicado as "stockAplicado", condicion_pago as "condicionPago",
      forma_pago as "formaPago", dias_credito as "diasCredito", fecha_vencimiento as "fechaVencimiento",
      saldo_pendiente::float as "saldoPendiente", estado_pago as "estadoPago",
      subtotal::float, descuento::float, iva::float, total::float, creado_en as "createdAt"
    FROM compras
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  const compras = rowsRes.rows as Compra[];
  if (compras.length === 0) return { rows: [], page, pages, total };

  const compraIds = compras.map((c) => c.id);
  const itemsRes = await executor.query(
    `SELECT 
      id, compra_id as "compraId", producto_id as "productoId", cantidad::float, precio::float,
      unidad_medida as "unidadMedida", observacion, costo_unitario::float as "costoUnitario",
      descuento::float, exento_iva as "exentoIva"
    FROM compra_items
    WHERE compra_id = ANY($1);`,
    [compraIds]
  );

  const itemsMap = new Map<string, LineaComercial[]>();
  for (const item of itemsRes.rows) {
    const list = itemsMap.get(item.compraId) || [];
    list.push(item);
    itemsMap.set(item.compraId, list);
  }

  for (const c of compras) {
    c.items = itemsMap.get(c.id) || [];
  }

  return { rows: compras, page, pages, total };
}

export async function obtenerCompra(executor: SqlExecutor, id: string): Promise<Compra | null> {
  const res = await executor.query(
    `SELECT 
      id, numero, factura_proveedor as "facturaProveedor", proveedor_id as "proveedorId",
      proveedor, fecha, notas, creado_por as "creadoPor", anulada, fecha_anulacion as "fechaAnulacion",
      anulada_por as "anuladaPor", motivo_anulacion as "motivoAnulacion", pedido_id as "pedidoId",
      recepcion_id as "recepcionId", stock_aplicado as "stockAplicado", condicion_pago as "condicionPago",
      forma_pago as "formaPago", dias_credito as "diasCredito", fecha_vencimiento as "fechaVencimiento",
      saldo_pendiente::float as "saldoPendiente", estado_pago as "estadoPago",
      subtotal::float, descuento::float, iva::float, total::float, creado_en as "createdAt"
    FROM compras
    WHERE id = $1
    LIMIT 1;`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const c = res.rows[0] as Compra;

  const itemsRes = await executor.query(
    `SELECT 
      ci.id, ci.producto_id as "productoId", ci.cantidad::float, ci.precio::float,
      ci.unidad_medida as "unidadMedida", ci.observacion, ci.costo_unitario::float as "costoUnitario",
      ci.descuento::float, ci.exento_iva as "exentoIva", p.codigo, p.nombre
    FROM compra_items ci
    JOIN productos p ON p.id = ci.producto_id
    WHERE ci.compra_id = $1;`,
    [id]
  );
  c.items = itemsRes.rows as LineaComercial[];
  return c;
}
