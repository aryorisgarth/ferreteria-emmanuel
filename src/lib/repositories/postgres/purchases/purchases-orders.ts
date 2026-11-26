import type { EstadoPedidoCompra, LineaPedidoCompra, Pagina, PedidoCompra } from "@/lib/types";
import type { SqlExecutor } from "../client";
import type { AltaPedidoInput } from "./types";

export async function obtenerPedidos(executor: SqlExecutor, page: number = 1): Promise<Pagina<PedidoCompra>> {
  const limit = 20;
  const offset = Math.max(0, (page - 1) * limit);

  const countRes = await executor.query("SELECT COUNT(*) as total FROM pedidos_compra;");
  const total = parseInt(countRes.rows[0]?.total || "0", 10);
  const pages = Math.max(1, Math.ceil(total / limit));

  const rowsRes = await executor.query(
    `SELECT 
      id, numero, proveedor_id as "proveedorId", proveedor, fecha_emision as "fechaEmision",
      fecha_entrega_estimada as "fechaEntregaEstimada", estado, notas, creado_por as "creadoPor",
      creado_en as "createdAt"
    FROM pedidos_compra
    ORDER BY fecha_emision DESC
    LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  const peds = rowsRes.rows as PedidoCompra[];
  if (peds.length === 0) return { rows: [], page, pages, total };

  const pedIds = peds.map((p) => p.id);
  const itemsRes = await executor.query(
    `SELECT 
      id, pedido_id as "pedidoId", producto_id as "productoId", cantidad_pedida::float as "cantidadPedida",
      cantidad_recibida::float as "cantidadRecibida", precio_unitario::float as "precioUnitario", observacion
    FROM pedido_compra_items
    WHERE pedido_id = ANY($1);`,
    [pedIds]
  );

  const itemsMap = new Map<string, LineaPedidoCompra[]>();
  for (const item of itemsRes.rows) {
    const list = itemsMap.get(item.pedidoId) || [];
    list.push(item);
    itemsMap.set(item.pedidoId, list);
  }

  for (const p of peds) {
    p.items = itemsMap.get(p.id) || [];
  }

  return { rows: peds, page, pages, total };
}

export async function obtenerPedido(executor: SqlExecutor, id: string): Promise<PedidoCompra | null> {
  const res = await executor.query(
    `SELECT 
      id, numero, proveedor_id as "proveedorId", proveedor, fecha_emision as "fechaEmision",
      fecha_entrega_estimada as "fechaEntregaEstimada", estado, notas, creado_por as "creadoPor",
      creado_en as "createdAt"
    FROM pedidos_compra
    WHERE id = $1
    LIMIT 1;`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const p = res.rows[0] as PedidoCompra;

  const itemsRes = await executor.query(
    `SELECT 
      pci.id, pci.producto_id as "productoId", pci.cantidad_pedida::float as "cantidadPedida",
      pci.cantidad_recibida::float as "cantidadRecibida", pci.precio_unitario::float as "precioUnitario",
      pci.observacion, pr.codigo, pr.nombre
    FROM pedido_compra_items pci
    JOIN productos pr ON pr.id = pci.producto_id
    WHERE pci.pedido_id = $1;`,
    [id]
  );
  p.items = itemsRes.rows as LineaPedidoCompra[];
  return p;
}

export async function ejecutarAltaPedido(executor: SqlExecutor, input: AltaPedidoInput): Promise<string> {
  const pedId = `ped_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('pedido', 1)
    ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero;
  `);
  const numero = `PED-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

  await executor.query(
    `INSERT INTO pedidos_compra (
      id, numero, proveedor_id, proveedor, fecha_emision, fecha_entrega_estimada, estado, notas, creado_por
    ) VALUES ($1, $2, $3, $4, NOW(), $5, 'EMITIDO', $6, $7);`,
    [pedId, numero, input.proveedorId || null, input.proveedor, input.fechaEntregaEstimada || null, input.notas || "", input.creadoPor]
  );

  for (const it of input.items) {
    const itId = `pedi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await executor.query(
      `INSERT INTO pedido_compra_items (id, pedido_id, producto_id, cantidad_pedida, cantidad_recibida, precio_unitario, observacion)
      VALUES ($1, $2, $3, $4, 0.00, $5, $6);`,
      [itId, pedId, it.productoId, it.cantidad, it.precioUnitario, it.observacion || ""]
    );
  }

  return pedId;
}

export async function ejecutarCambiarEstadoPedido(
  executor: SqlExecutor,
  id: string,
  estado: EstadoPedidoCompra,
  obtenerPedidoFn: (id: string) => Promise<PedidoCompra | null>
): Promise<PedidoCompra> {
  await executor.query("UPDATE pedidos_compra SET estado = $1 WHERE id = $2;", [estado, id]);
  return (await obtenerPedidoFn(id))!;
}
