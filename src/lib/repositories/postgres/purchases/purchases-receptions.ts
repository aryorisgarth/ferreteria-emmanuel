import type { LineaRecepcionCompra, Pagina, RecepcionCompra } from "@/lib/types";
import type { SqlExecutor } from "../client";
import type { AltaRecepcionInput } from "./types";

export async function obtenerRecepciones(executor: SqlExecutor, page: number = 1): Promise<Pagina<RecepcionCompra>> {
  const limit = 20;
  const offset = Math.max(0, (page - 1) * limit);

  const countRes = await executor.query("SELECT COUNT(*) as total FROM recepciones_compra;");
  const total = parseInt(countRes.rows[0]?.total || "0", 10);
  const pages = Math.max(1, Math.ceil(total / limit));

  const rowsRes = await executor.query(
    `SELECT 
      id, numero, pedido_id as "pedidoId", proveedor_id as "proveedorId", proveedor,
      fecha, remision_proveedor as "remisionProveedor", responsable, estado_conformidad as "estadoConformidad",
      notas, stock_aplicado as "stockAplicado", creado_en as "createdAt"
    FROM recepciones_compra
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  const recs = rowsRes.rows as RecepcionCompra[];
  if (recs.length === 0) return { rows: [], page, pages, total };

  const recIds = recs.map((r) => r.id);
  const itemsRes = await executor.query(
    `SELECT 
      id, recepcion_id as "recepcionId", producto_id as "productoId", cantidad_recibida::float as "cantidadRecibida",
      costo_unitario::float as "costoUnitario", linea_pedido_id as "lineaPedidoId", observacion
    FROM recepcion_compra_items
    WHERE recepcion_id = ANY($1);`,
    [recIds]
  );

  const itemsMap = new Map<string, LineaRecepcionCompra[]>();
  for (const item of itemsRes.rows) {
    const list = itemsMap.get(item.recepcionId) || [];
    list.push(item);
    itemsMap.set(item.recepcionId, list);
  }

  for (const r of recs) {
    r.items = itemsMap.get(r.id) || [];
  }

  return { rows: recs, page, pages, total };
}

export async function obtenerRecepcion(executor: SqlExecutor, id: string): Promise<RecepcionCompra | null> {
  const res = await executor.query(
    `SELECT 
      id, numero, pedido_id as "pedidoId", proveedor_id as "proveedorId", proveedor,
      fecha, remision_proveedor as "remisionProveedor", responsable, estado_conformidad as "estadoConformidad",
      notas, stock_aplicado as "stockAplicado", creado_en as "createdAt"
    FROM recepciones_compra
    WHERE id = $1
    LIMIT 1;`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0] as RecepcionCompra;

  const itemsRes = await executor.query(
    `SELECT 
      rci.id, rci.producto_id as "productoId", rci.cantidad_recibida::float as "cantidadRecibida",
      rci.costo_unitario::float as "costoUnitario", rci.linea_pedido_id as "lineaPedidoId",
      rci.observacion, p.codigo, p.nombre
    FROM recepcion_compra_items rci
    JOIN productos p ON p.id = rci.producto_id
    WHERE rci.recepcion_id = $1;`,
    [id]
  );
  r.items = itemsRes.rows as LineaRecepcionCompra[];
  return r;
}

export async function ejecutarAltaRecepcion(executor: SqlExecutor, input: AltaRecepcionInput): Promise<string> {
  const recId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('recepcion', 1)
    ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero;
  `);
  const numero = `REC-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

  await executor.query(
    `INSERT INTO recepciones_compra (
      id, numero, pedido_id, proveedor_id, proveedor, fecha, remision_proveedor, responsable, estado_conformidad, notas, stock_aplicado
    ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, false);`,
    [
      recId, numero, input.pedidoId || null, input.proveedorId || null,
      input.proveedor, input.remisionProveedor || null, input.responsable,
      input.estadoConformidad || "CONFORME", input.notas || "",
    ]
  );

  for (const it of input.items) {
    const itId = `reci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await executor.query(
      `INSERT INTO recepcion_compra_items (id, recepcion_id, producto_id, cantidad_recibida, costo_unitario, linea_pedido_id, observacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [itId, recId, it.productoId, it.cantidad, it.costoUnitario, it.lineaPedidoId || null, it.observacion || ""]
    );
  }

  return recId;
}
