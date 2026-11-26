import type { Cotizacion, LineaComercial, Pagina, EstadoCotizacion } from "@/lib/types";
import type { SqlExecutor } from "./client";

export class PostgresQuotesService {
  constructor(private executor: SqlExecutor) { }

  async cotizaciones(page: number = 1, estado?: EstadoCotizacion): Promise<Pagina<any>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const whereClause = estado ? "WHERE estado = $1" : "";
    const params = estado ? [estado] : [];

    const countRes = await this.executor.query(`SELECT COUNT(*) as total FROM cotizaciones ${whereClause};`, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, folio, cliente, cliente_id as "clienteId", fecha,
        fecha_vencimiento as "fechaVencimiento", estado, notas,
        condiciones_comerciales as "condicionesComerciales", creado_por as "creadoPor",
        factura_id as "facturaId", subtotal::float, descuento::float, iva::float, total::float,
        version, cotizacion_raiz_id as "cotizacionRaizId", es_version_actual as "esVersionActual"
      FROM cotizaciones
      ${whereClause}
      ORDER BY fecha DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `,
      [...params, limit, offset]
    );

    const cots = rowsRes.rows as Cotizacion[];
    if (cots.length === 0) {
      return { rows: [], page, pages, total };
    }

    // Eliminación de consulta N+1: Cargar todos los ítems en una única consulta batch
    const cotIds = cots.map((c) => c.id);
    const itemsRes = await this.executor.query(
      `
      SELECT 
        ci.id, ci.cotizacion_id as "cotizacionId", ci.producto_id as "productoId", ci.cantidad::float,
        ci.cantidad_facturada::float as "cantidadFacturada",
        ci.cantidad_cancelada::float as "cantidadCancelada",
        ci.cantidad_pendiente::float as "cantidadPendiente",
        ci.precio::float, ci.precio_autorizado::float as "precioAutorizado",
        ci.unidad_medida as "unidadMedida", ci.observacion, ci.costo_unitario::float as "costoUnitario",
        ci.descuento::float, ci.exento_iva as "exentoIva", p.codigo, p.nombre,
        (ci.cantidad * ci.precio)::float as importe
      FROM cotizacion_items ci
      LEFT JOIN productos p ON p.id = ci.producto_id
      WHERE ci.cotizacion_id = ANY($1);
    `,
      [cotIds]
    );

    const itemsMap = new Map<string, any[]>();
    for (const item of itemsRes.rows) {
      const list = itemsMap.get(item.cotizacionId) || [];
      list.push(item);
      itemsMap.set(item.cotizacionId, list);
    }

    const formattedRows = cots.map((c) => {
      const items = itemsMap.get(c.id) || [];
      c.items = items;
      return {
        ...c,
        cotizacion: c,
        items,
        subtotal: c.subtotal,
        descuento: c.descuento,
        iva: c.iva,
        isv: c.iva,
        total: c.total,
      };
    });

    return { rows: formattedRows, page, pages, total };
  }

  async cotizacion(id: string): Promise<any | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, folio, cliente, cliente_id as "clienteId", fecha,
        fecha_vencimiento as "fechaVencimiento", estado, notas,
        condiciones_comerciales as "condicionesComerciales", creado_por as "creadoPor",
        factura_id as "facturaId", subtotal::float, descuento::float, iva::float, total::float,
        version, cotizacion_raiz_id as "cotizacionRaizId", es_version_actual as "esVersionActual"
      FROM cotizaciones
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const c = res.rows[0] as Cotizacion;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        ci.id, ci.producto_id as "productoId", ci.cantidad::float,
        ci.cantidad_facturada::float as "cantidadFacturada",
        ci.cantidad_cancelada::float as "cantidadCancelada",
        ci.cantidad_pendiente::float as "cantidadPendiente",
        ci.precio::float, ci.precio_autorizado::float as "precioAutorizado",
        ci.unidad_medida as "unidadMedida", ci.observacion, ci.costo_unitario::float as "costoUnitario",
        ci.descuento::float, ci.exento_iva as "exentoIva", p.codigo, p.nombre,
        (ci.cantidad * ci.precio)::float as importe
      FROM cotizacion_items ci
      JOIN productos p ON p.id = ci.producto_id
      WHERE ci.cotizacion_id = $1;
    `,
      [id]
    );
    c.items = itemsRes.rows as any[];
    return {
      ...c,
      cotizacion: c,
      items: c.items,
      subtotal: c.subtotal,
      descuento: c.descuento,
      iva: c.iva,
      isv: c.iva,
      total: c.total,
    };
  }

  async crearCotizacion(input: {
    cliente: string;
    clienteId?: string | null;
    creadoPor: string;
    notas?: string;
    condicionesComerciales?: string;
    diasValidez?: number;
    items: { productoId: string; cantidad: number; precio: number; descuento?: number; exentoIva?: boolean; observacion?: string }[];
  }): Promise<string> {
    if (!input.items || input.items.length === 0) throw new Error("La cotización debe contener al menos un producto.");

    const cotId = `cot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('cotizacion', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numero = `COT-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    let subtotal = 0;
    let subtotalGravado = 0;
    let subtotalExento = 0;
    let totalDescuento = 0;
    let totalIva = 0;

    for (const it of input.items) {
      const desc = it.descuento || 0;
      const base = Math.max(0, it.precio - desc);
      const subRenglon = it.precio * it.cantidad;
      subtotal += subRenglon;
      totalDescuento += desc * it.cantidad;
      if (!it.exentoIva) {
        subtotalGravado += base * it.cantidad;
        totalIva += base * it.cantidad * 0.15;
      } else {
        subtotalExento += base * it.cantidad;
      }
    }
    const total = subtotal - totalDescuento + totalIva;
    const diasVal = input.diasValidez || 15;

    await this.executor.query(
      `
      INSERT INTO cotizaciones (
        id, numero, cliente, cliente_id, fecha, fecha_vencimiento, estado,
        notas, condiciones_comerciales, creado_por, subtotal, subtotal_gravado, subtotal_exento,
        descuento, iva, total, version, cotizacion_raiz_id, es_version_actual
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW() + ($5 || ' days')::interval, 'EMITIDA',
        $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, $1, true
      );
    `,
      [
        cotId,
        numero,
        input.cliente.trim(),
        input.clienteId || null,
        String(diasVal),
        input.notas || "",
        input.condicionesComerciales || "",
        input.creadoPor,
        subtotal,
        subtotalGravado,
        subtotalExento,
        totalDescuento,
        totalIva,
        total,
      ]
    );

    for (const it of input.items) {
      const prodRes = await this.executor.query("SELECT unidad_medida as \"unidadMedida\", costo::float FROM productos WHERE id = $1;", [
        it.productoId,
      ]);
      const uMed = prodRes.rows[0]?.unidadMedida || "UNIDAD";
      const costo = prodRes.rows[0]?.costo || 0;
      const itemId = `coti_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await this.executor.query(
        `
        INSERT INTO cotizacion_items (
          id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
          precio, precio_autorizado, unidad_medida, observacion,
          costo_unitario, descuento, exento_iva
        ) VALUES ($1, $2, $3, $4, 0, 0, $4, $5, $5, $6, $7, $8, $9, $10);
      `,
        [
          itemId,
          cotId,
          it.productoId,
          it.cantidad,
          it.precio,
          uMed,
          it.observacion || "",
          costo,
          it.descuento || 0,
          it.exentoIva || false,
        ]
      );
    }

    return cotId;
  }

  async marcarCotizacion(id: string, estado: EstadoCotizacion): Promise<Cotizacion> {
    await this.executor.query("UPDATE cotizaciones SET estado = $1 WHERE id = $2;", [estado, id]);
    return (await this.cotizacion(id))!;
  }

  async editarCotizacion(
    id: string,
    input: {
      notas?: string;
      condicionesComerciales?: string;
      items?: { productoId: string; cantidad: number; precio: number; descuento?: number; exentoIva?: boolean; observacion?: string }[];
    }
  ): Promise<Cotizacion> {
    const c = await this.cotizacion(id);
    if (!c) throw new Error("Cotización no encontrada.");
    if (c.estado === "FACTURADA") throw new Error("No se puede editar una cotización ya facturada.");

    if (input.items && input.items.length > 0) {
      await this.executor.query("DELETE FROM cotizacion_items WHERE cotizacion_id = $1;", [id]);

      let subtotal = 0;
      let totalDescuento = 0;
      let totalIva = 0;

      for (const it of input.items) {
        const desc = it.descuento || 0;
        const base = Math.max(0, it.precio - desc);
        subtotal += it.precio * it.cantidad;
        totalDescuento += desc * it.cantidad;
        if (!it.exentoIva) {
          totalIva += base * it.cantidad * 0.15;
        }

        const prodRes = await this.executor.query("SELECT unidad_medida as \"unidadMedida\", costo::float FROM productos WHERE id = $1;", [
          it.productoId,
        ]);
        const uMed = prodRes.rows[0]?.unidadMedida || "UNIDAD";
        const costo = prodRes.rows[0]?.costo || 0;
        const itemId = `coti_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        await this.executor.query(
          `
          INSERT INTO cotizacion_items (
            id, cotizacion_id, producto_id, cantidad, precio, unidad_medida, observacion,
            costo_unitario, descuento, exento_iva
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `,
          [itemId, id, it.productoId, it.cantidad, it.precio, uMed, it.observacion || "", costo, it.descuento || 0, it.exentoIva || false]
        );
      }

      const total = subtotal - totalDescuento + totalIva;
      await this.executor.query(
        `
        UPDATE cotizaciones SET
          notas = COALESCE($1, notas),
          condiciones_comerciales = COALESCE($2, condiciones_comerciales),
          subtotal = $3,
          descuento = $4,
          iva = $5,
          total = $6
        WHERE id = $7;
      `,
        [input.notas, input.condicionesComerciales, subtotal, totalDescuento, totalIva, total, id]
      );
    } else {
      await this.executor.query(
        `
        UPDATE cotizaciones SET
          notas = COALESCE($1, notas),
          condiciones_comerciales = COALESCE($2, condiciones_comerciales)
        WHERE id = $3;
      `,
        [input.notas, input.condicionesComerciales, id]
      );
    }

    return (await this.cotizacion(id))!;
  }

  async borrarCotizacion(id: string): Promise<boolean> {
    const c = await this.cotizacion(id);
    if (!c) return false;
    if (c.estado === "FACTURADA") throw new Error("No se puede eliminar una cotización facturada.");
    await this.executor.query("DELETE FROM cotizaciones WHERE id = $1;", [id]);
    return true;
  }
}
