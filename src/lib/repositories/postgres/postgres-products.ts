import type { Producto, ProductoVista, DatosProducto, Pagina } from "@/lib/types";
import type { SqlExecutor } from "./client";

export class PostgresProductsService {
  constructor(private executor: SqlExecutor) {}

  async inventarioPaginado(filtros: {
    page?: number;
    limit?: number;
    q?: string;
    categoria?: string;
    marca?: string;
    estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
    soloStockBajo?: boolean;
  }): Promise<{
    rows: ProductoVista[];
    total: number;
    pages: number;
    page: number;
    metricas: {
      totalArticulos: number;
      stockBajoCount: number;
      valorInventario: number;
    };
  }> {
    const limit = Math.max(1, Number(filtros.limit) || 50);
    const pageNum = Math.max(1, Number(filtros.page) || 1);
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filtros.q && filtros.q.trim()) {
      params.push(`%${filtros.q.trim().toLowerCase()}%`);
      whereClauses.push(
        `(LOWER(p.nombre) LIKE $${params.length} OR LOWER(p.codigo) LIKE $${params.length} OR LOWER(COALESCE(p.codigo_barras, '')) LIKE $${params.length} OR LOWER(p.categoria) LIKE $${params.length} OR LOWER(COALESCE(p.marca, '')) LIKE $${params.length})`
      );
    }

    if (filtros.categoria && filtros.categoria !== "TODAS") {
      params.push(filtros.categoria);
      whereClauses.push(`p.categoria = $${params.length}`);
    }

    if (filtros.marca && filtros.marca !== "TODAS") {
      if (filtros.marca === "Genérica") {
        whereClauses.push(`(p.marca = 'Genérica' OR p.marca IS NULL OR p.marca = '')`);
      } else {
        params.push(filtros.marca);
        whereClauses.push(`p.marca = $${params.length}`);
      }
    }

    if (filtros.estado === "ACTIVOS") {
      whereClauses.push(`p.activo = true`);
    } else if (filtros.estado === "INACTIVOS") {
      whereClauses.push(`p.activo = false`);
    }

    if (filtros.soloStockBajo) {
      whereClauses.push(`p.stock_actual <= p.stock_minimo`);
    }

    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const countRes = await this.executor.query(
      `SELECT COUNT(*) as total FROM productos p ${whereSql};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));
    const pageValida = Math.min(pageNum, pages);
    const offset = Math.max(0, (pageValida - 1) * limit);

    const queryParams = [...params, limit, offset];
    const rowsRes = await this.executor.query(
      `
      SELECT 
        p.id, p.codigo, p.codigo_barras as "codigoBarras", p.nombre, p.marca,
        p.unidad_medida as "unidadMedida", p.inventario_inicial::float as "inventarioInicial",
        p.stock_actual::float as "stockActual", p.precio::float, p.costo::float,
        p.categoria, p.stock_minimo::float as "stockMinimo", p.activo,
        0::float as "totalEntradas",
        0::float as "totalSalidas"
      FROM productos p
      ${whereSql}
      ORDER BY p.nombre ASC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `,
      queryParams
    );

    const metricasRes = await this.executor.query(`
      SELECT 
        COUNT(*)::int as "totalArticulos",
        COUNT(*) FILTER (WHERE stock_actual <= stock_minimo)::int as "stockBajoCount",
        COALESCE(SUM(stock_actual * COALESCE(costo, precio * 0.7)), 0)::float as "valorInventario"
      FROM productos;
    `);
    const m = metricasRes.rows[0] || {};
    const metricas = {
      totalArticulos: Number(m.totalArticulos || 0),
      stockBajoCount: Number(m.stockBajoCount || 0),
      valorInventario: Number(m.valorInventario || 0),
    };

    return {
      rows: rowsRes.rows as ProductoVista[],
      total,
      pages,
      page: pageValida,
      metricas,
    };
  }

  async productos(q: string = "", page: number = 1): Promise<Pagina<ProductoVista>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);
    const busqueda = `%${q.trim().toLowerCase()}%`;

    const countRes = await this.executor.query(
      `
      SELECT COUNT(*) as total
      FROM productos
      WHERE LOWER(nombre) LIKE $1 OR LOWER(codigo) LIKE $1 OR LOWER(COALESCE(codigo_barras, '')) LIKE $1;
    `,
      [busqueda]
    );

    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        p.id, p.codigo, p.codigo_barras as "codigoBarras", p.nombre, p.marca,
        p.unidad_medida as "unidadMedida", p.inventario_inicial::float as "inventarioInicial",
        p.stock_actual::float as "stockActual", p.precio::float, p.costo::float,
        p.categoria, p.stock_minimo::float as "stockMinimo", p.activo,
        COALESCE(SUM(k.entradas), 0)::float as "totalEntradas",
        COALESCE(SUM(k.salidas), 0)::float as "totalSalidas"
      FROM productos p
      LEFT JOIN kardex_movimientos k ON k.producto_id = p.id
      WHERE LOWER(p.nombre) LIKE $1 OR LOWER(p.codigo) LIKE $1 OR LOWER(COALESCE(p.codigo_barras, '')) LIKE $1
      GROUP BY p.id
      ORDER BY p.nombre ASC
      LIMIT $2 OFFSET $3;
    `,
      [busqueda, limit, offset]
    );

    return {
      rows: rowsRes.rows as ProductoVista[],
      page,
      pages,
      total,
    };
  }

  async catalogo(): Promise<Producto[]> {
    const res = await this.executor.query(`
      SELECT 
        id, codigo, codigo_barras as "codigoBarras", nombre, marca,
        unidad_medida as "unidadMedida", inventario_inicial::float as "inventarioInicial",
        stock_actual::float as "stockActual", precio::float, costo::float,
        categoria, stock_minimo::float as "stockMinimo", activo
      FROM productos
      WHERE activo = true
      ORDER BY nombre ASC;
    `);
    return res.rows as Producto[];
  }

  async producto(id: string): Promise<Producto | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, codigo, codigo_barras as "codigoBarras", nombre, marca,
        unidad_medida as "unidadMedida", inventario_inicial::float as "inventarioInicial",
        stock_actual::float as "stockActual", precio::float, costo::float,
        categoria, stock_minimo::float as "stockMinimo", activo
      FROM productos
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0] as Producto;
  }

  async alta(datos: DatosProducto): Promise<Producto> {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stockInicial = datos.inventarioInicial || 0;

    await this.executor.query(
      `
      INSERT INTO productos (
        id, codigo, codigo_barras, nombre, marca, unidad_medida,
        inventario_inicial, stock_actual, precio, costo, categoria, stock_minimo, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true);
    `,
      [
        id,
        datos.codigo.trim().toUpperCase(),
        datos.codigoBarras ? datos.codigoBarras.trim() : null,
        datos.nombre.trim(),
        datos.marca ? datos.marca.trim() : "Genérica",
        datos.unidadMedida,
        stockInicial,
        stockInicial,
        datos.precio || 0,
        datos.costo || 0,
        datos.categoria || "General",
        datos.stockMinimo || 0,
      ]
    );

    // Si tiene inventario inicial, registrar movimiento en Kárdex
    if (stockInicial > 0) {
      const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
      const seq = seqRes.rows[0].seq;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await this.executor.query(
        `
        INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, numero_referencia, concepto, usuario, origen, secuencia,
          costo_unitario, valor_entrada, saldo_valorado
        ) VALUES (
          $1, $2, NOW(), 'ENTRADA', $3, $3, 0, $3,
          $4, 'INV-INICIAL', 'Inventario inicial registrado', 'SISTEMA', 'MANUAL', $5,
          $6, $7, $7
        );
      `,
        [
          movId,
          id,
          stockInicial,
          datos.unidadMedida,
          seq,
          datos.costo || 0,
          (datos.costo || 0) * stockInicial,
        ]
      );
    }

    return (await this.producto(id))!;
  }

  async editarArticulo(id: string, datos: DatosProducto): Promise<Producto> {
    await this.executor.query(
      `
      UPDATE productos SET
        codigo = $1,
        codigo_barras = $2,
        nombre = $3,
        marca = $4,
        unidad_medida = $5,
        precio = $6,
        costo = $7,
        categoria = $8,
        stock_minimo = $9,
        actualizado_en = NOW()
      WHERE id = $10;
    `,
      [
        datos.codigo.trim().toUpperCase(),
        datos.codigoBarras ? datos.codigoBarras.trim() : null,
        datos.nombre.trim(),
        datos.marca ? datos.marca.trim() : "Genérica",
        datos.unidadMedida,
        datos.precio || 0,
        datos.costo || 0,
        datos.categoria || "General",
        datos.stockMinimo || 0,
        id,
      ]
    );
    return (await this.producto(id))!;
  }

  async borrarArticulo(id: string): Promise<boolean> {
    // Si tiene movimientos de kárdex o ventas, no se borra físicamente; se desactiva
    const kRes = await this.executor.query("SELECT id FROM kardex_movimientos WHERE producto_id = $1 LIMIT 1;", [id]);
    if (kRes.rows.length > 0) {
      await this.executor.query("UPDATE productos SET activo = false, actualizado_en = NOW() WHERE id = $1;", [id]);
      return true;
    }
    await this.executor.query("DELETE FROM productos WHERE id = $1;", [id]);
    return true;
  }

  async activarArticulo(id: string): Promise<Producto> {
    await this.executor.query("UPDATE productos SET activo = true, actualizado_en = NOW() WHERE id = $1;", [id]);
    return (await this.producto(id))!;
  }

  async desactivarArticulo(id: string): Promise<Producto> {
    await this.executor.query("UPDATE productos SET activo = false, actualizado_en = NOW() WHERE id = $1;", [id]);
    return (await this.producto(id))!;
  }

  async importar(filas: any[]): Promise<{ importados: number; errores: string[] }> {
    let importados = 0;
    const errores: string[] = [];

    for (const f of filas) {
      try {
        const cod = (f.codigo || "").trim().toUpperCase();
        if (!cod) continue;
        const exist = await this.executor.query("SELECT id FROM productos WHERE codigo = $1 LIMIT 1;", [cod]);
        if (exist.rows.length > 0) {
          // Actualizar precio y costo
          await this.executor.query(
            "UPDATE productos SET precio = COALESCE($1, precio), costo = COALESCE($2, costo), actualizado_en = NOW() WHERE id = $3;",
            [f.precio, f.costo, exist.rows[0].id]
          );
        } else {
          await this.alta({
            codigo: cod,
            nombre: f.nombre || cod,
            unidadMedida: f.unidadMedida || "UNIDAD",
            inventarioInicial: f.cantidad || 0,
            precio: f.precio || 0,
            costo: f.costo || 0,
            categoria: f.categoria || "General",
            stockMinimo: f.stockMinimo || 0,
          });
        }
        importados++;
      } catch (err: any) {
        errores.push(`Fila código ${f.codigo}: ${err.message}`);
      }
    }

    return { importados, errores };
  }
}
