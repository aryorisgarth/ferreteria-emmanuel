import type { Compra, DevolucionProveedor, LineaDevolucionProveedor, Pagina } from "@/lib/types";
import type { SqlExecutor } from "../client";
import type { AltaDevolucionProveedorInput } from "./types";

export async function obtenerDevoluciones(executor: SqlExecutor, page: number = 1): Promise<Pagina<DevolucionProveedor>> {
  const limit = 20;
  const offset = Math.max(0, (page - 1) * limit);

  const countRes = await executor.query("SELECT COUNT(*) as total FROM devoluciones_proveedor;");
  const total = parseInt(countRes.rows[0]?.total || "0", 10);
  const pages = Math.max(1, Math.ceil(total / limit));

  const rowsRes = await executor.query(
    `SELECT 
      id, numero, compra_id as "compraId", proveedor_id as "proveedorId", proveedor,
      fecha, motivo, nota_credito_proveedor as "notaCreditoProveedor", creado_por as "creadoPor",
      stock_aplicado as "stockAplicado", total::float, creado_en as "createdAt"
    FROM devoluciones_proveedor
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  const devs = rowsRes.rows as DevolucionProveedor[];
  if (devs.length === 0) return { rows: [], page, pages, total };

  const devIds = devs.map((d) => d.id);
  const itemsRes = await executor.query(
    `SELECT 
      id, devolucion_id as "devolucionId", producto_id as "productoId", cantidad::float, costo_unitario::float as "costoUnitario",
      costo_libros::float as "costoLibros", observacion
    FROM devolucion_proveedor_items
    WHERE devolucion_id = ANY($1);`,
    [devIds]
  );

  const itemsMap = new Map<string, LineaDevolucionProveedor[]>();
  for (const item of itemsRes.rows) {
    const list = itemsMap.get(item.devolucionId) || [];
    list.push(item);
    itemsMap.set(item.devolucionId, list);
  }

  for (const d of devs) {
    d.items = itemsMap.get(d.id) || [];
  }

  return { rows: devs, page, pages, total };
}

export async function obtenerDevolucion(executor: SqlExecutor, id: string): Promise<DevolucionProveedor | null> {
  const res = await executor.query(
    `SELECT 
      id, numero, compra_id as "compraId", proveedor_id as "proveedorId", proveedor,
      fecha, motivo, nota_credito_proveedor as "notaCreditoProveedor", creado_por as "creadoPor",
      stock_aplicado as "stockAplicado", total::float, creado_en as "createdAt"
    FROM devoluciones_proveedor
    WHERE id = $1
    LIMIT 1;`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const d = res.rows[0] as DevolucionProveedor;

  const itemsRes = await executor.query(
    `SELECT 
      dpi.id, dpi.producto_id as "productoId", dpi.cantidad::float, dpi.costo_unitario::float as "costoUnitario",
      dpi.costo_libros::float as "costoLibros", dpi.observacion, p.codigo, p.nombre
    FROM devolucion_proveedor_items dpi
    JOIN productos p ON p.id = dpi.producto_id
    WHERE dpi.devolucion_id = $1;`,
    [id]
  );
  d.items = itemsRes.rows as LineaDevolucionProveedor[];
  return d;
}

export async function ejecutarAltaDevolucionProveedor(
  executor: SqlExecutor,
  input: AltaDevolucionProveedorInput,
  obtenerCompraFn: (id: string) => Promise<Compra | null>
): Promise<string> {
  const c = await obtenerCompraFn(input.compraId);
  if (!c) throw new Error("Compra de origen no encontrada.");

  const devId = `devp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('devolucion', 1)
    ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero;
  `);
  const numero = `DEV-PROV-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

  let totalDev = 0;
  for (const it of input.items) {
    const match = c.items.find((ci) => ci.productoId === it.productoId);
    totalDev += (match ? match.precio : 0) * it.cantidad;
  }

  await executor.query(
    `INSERT INTO devoluciones_proveedor (
      id, numero, compra_id, proveedor_id, proveedor, fecha, motivo,
      nota_credito_proveedor, creado_por, stock_aplicado, total
    ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, true, $9);`,
    [devId, numero, c.id, c.proveedorId, c.proveedor, input.motivo, input.notaCreditoProveedor || null, input.creadoPor, totalDev]
  );

  for (const it of input.items) {
    const match = c.items.find((ci) => ci.productoId === it.productoId);
    const precio = match ? match.precio : 0;

    const prodRes = await executor.query(
      `SELECT stock_actual::float as stock, costo::float, unidad_medida as "unidadMedida" FROM productos WHERE id = $1 FOR UPDATE;`,
      [it.productoId]
    );
    if (prodRes.rows.length > 0) {
      const p = prodRes.rows[0];
      const nuevoStock = Math.max(0, p.stock - it.cantidad);
      await executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [nuevoStock, it.productoId]);

      const itId = `devpi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await executor.query(
        `INSERT INTO devolucion_proveedor_items (id, devolucion_id, producto_id, cantidad, costo_unitario, costo_libros, observacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [itId, devId, it.productoId, it.cantidad, precio, p.costo, it.observacion || ""]
      );

      const seqRes = await executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
      const seq = seqRes.rows[0].seq;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await executor.query(
        `INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, destinatario, numero_referencia, concepto, usuario, origen, secuencia,
          costo_unitario, valor_salida, saldo_valorado
        ) VALUES (
          $1, $2, NOW(), 'SALIDA', $3, 0, $3, $4,
          $5, $6, $7, $8, $9, 'AJUSTE', $10,
          $11, $12, $13
        );`,
        [movId, it.productoId, it.cantidad, nuevoStock, p.unidadMedida, c.proveedor, numero, `Devolución a proveedor según ${numero}`, input.creadoPor, seq, p.costo, p.costo * it.cantidad, nuevoStock * p.costo]
      );
    }
  }

  return devId;
}
