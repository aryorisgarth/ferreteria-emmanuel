import type { Movimiento, MovimientoVista, LineaCaptura, Pagina } from "@/lib/types";
import type { FiltroKardex } from "@/lib/inventory/modelos";
import type { SqlExecutor } from "./client";

export class PostgresKardexService {
  constructor(private executor: SqlExecutor) {}

  async kardex(filtro: FiltroKardex = {}): Promise<Pagina<MovimientoVista>> {
    const pageNum = typeof filtro.page === "number" ? filtro.page : 1;
    const limit = (filtro as any).limite || 30;
    const offset = Math.max(0, (pageNum - 1) * limit);

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.productoId) {
      conditions.push(`k.producto_id = $${pIdx++}`);
      params.push(filtro.productoId);
    }
    if (filtro.tipo) {
      conditions.push(`k.tipo = $${pIdx++}`);
      params.push(filtro.tipo);
    }
    if (filtro.desde) {
      conditions.push(`k.fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`k.fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }
    const textoBusqueda = filtro.busqueda || (filtro as any).q;
    if (textoBusqueda) {
      const q = `%${textoBusqueda.trim().toLowerCase()}%`;
      conditions.push(
        `(LOWER(p.nombre) LIKE $${pIdx} OR LOWER(p.codigo) LIKE $${pIdx} OR LOWER(k.numero_referencia) LIKE $${pIdx} OR LOWER(k.concepto) LIKE $${pIdx})`
      );
      params.push(q);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await this.executor.query(
      `
      SELECT COUNT(*) as total
      FROM kardex_movimientos k
      JOIN productos p ON p.id = k.producto_id
      ${whereClause};
    `,
      params
    );

    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        k.id, k.producto_id as "productoId", k.fecha, k.tipo, k.cantidad::float,
        k.entradas::float, k.salidas::float, k.stock_saldo::float as "stockSaldo",
        k.unidad_medida as "unidadMedida", k.destinatario, k.oficina_id as "oficinaId",
        k.acta_id as "actaId", k.solicitud_id as "solicitudId", k.numero_referencia as "numeroReferencia",
        k.concepto, k.usuario, k.es_auditoria as "esAuditoria", k.estado_auditoria as "estadoAuditoria",
        k.origen, k.idempotency_key as "idempotencyKey", k.secuencia, k.creado_en as "createdAt",
        k.costo_unitario::float as "costoUnitario", k.valor_entrada::float as "valorEntrada",
        k.valor_salida::float as "valorSalida", k.saldo_valorado::float as "saldoValorado",
        p.codigo, p.nombre, p.codigo_barras as "codigoBarras",
        COALESCE(o.nombre, '') as "oficinaNombre"
      FROM kardex_movimientos k
      JOIN productos p ON p.id = k.producto_id
      LEFT JOIN oficinas o ON o.id = k.oficina_id
      ${whereClause}
      ORDER BY k.secuencia DESC, k.fecha DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `,
      [...params, limit, offset]
    );

    return {
      rows: rowsRes.rows as MovimientoVista[],
      page: pageNum,
      pages,
      total,
    };
  }

  async movimiento(id: string): Promise<MovimientoVista | null> {
    const res = await this.executor.query(
      `
      SELECT 
        k.id, k.producto_id as "productoId", k.fecha, k.tipo, k.cantidad::float,
        k.entradas::float, k.salidas::float, k.stock_saldo::float as "stockSaldo",
        k.unidad_medida as "unidadMedida", k.destinatario, k.oficina_id as "oficinaId",
        k.acta_id as "actaId", k.solicitud_id as "solicitudId", k.numero_referencia as "numeroReferencia",
        k.concepto, k.usuario, k.es_auditoria as "esAuditoria", k.estado_auditoria as "estadoAuditoria",
        k.origen, k.idempotency_key as "idempotencyKey", k.secuencia, k.creado_en as "createdAt",
        k.costo_unitario::float as "costoUnitario", k.valor_entrada::float as "valorEntrada",
        k.valor_salida::float as "valorSalida", k.saldo_valorado::float as "saldoValorado",
        p.codigo, p.nombre, p.codigo_barras as "codigoBarras",
        COALESCE(o.nombre, '') as "oficinaNombre"
      FROM kardex_movimientos k
      JOIN productos p ON p.id = k.producto_id
      LEFT JOIN oficinas o ON o.id = k.oficina_id
      WHERE k.id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0] as MovimientoVista;
  }

  async entrada(input: {
    productoId: string;
    cantidad: number;
    fecha: string;
    concepto: string;
    usuario: string;
    esAuditoria: boolean;
  }): Promise<Movimiento> {
    if (input.cantidad <= 0) throw new Error("La cantidad debe ser mayor a cero.");

    // Bloquear producto
    const prodRes = await this.executor.query(
      "SELECT id, unidad_medida as \"unidadMedida\", stock_actual::float as stock, costo::float FROM productos WHERE id = $1 FOR UPDATE;",
      [input.productoId]
    );
    if (prodRes.rows.length === 0) throw new Error("Producto no encontrado.");
    const p = prodRes.rows[0];

    const nuevoStock = p.stock + input.cantidad;
    await this.executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
      nuevoStock,
      input.productoId,
    ]);

    const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
    const seq = seqRes.rows[0].seq;
    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await this.executor.query(
      `
      INSERT INTO kardex_movimientos (
        id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
        unidad_medida, numero_referencia, concepto, usuario, es_auditoria,
        origen, secuencia, costo_unitario, valor_entrada, saldo_valorado
      ) VALUES (
        $1, $2, $3, 'ENTRADA', $4, $4, 0, $5,
        $6, 'ENT-MANUAL', $7, $8, $9,
        'MANUAL', $10, $11, $12, $13
      );
    `,
      [
        movId,
        input.productoId,
        input.fecha || new Date().toISOString(),
        input.cantidad,
        nuevoStock,
        p.unidadMedida,
        input.concepto || "Entrada manual de inventario",
        input.usuario,
        input.esAuditoria || false,
        seq,
        p.costo,
        p.costo * input.cantidad,
        nuevoStock * p.costo,
      ]
    );

    return (await this.movimiento(movId))!;
  }

  async directa(input: {
    oficinaId: string;
    destinatario: string;
    fecha: string;
    concepto: string;
    usuario: string;
    esAuditoria: boolean;
    items: LineaCaptura[];
  }): Promise<string> {
    if (!input.items || input.items.length === 0) throw new Error("No hay artículos en la salida directa.");

    const actaId = `acta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('acta', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numActa = `ACT-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

    await this.executor.query(
      `
      INSERT INTO actas (id, numero, es_salida_directa, oficina_id, destinatario, fecha, concepto, ejecutada)
      VALUES ($1, $2, true, $3, $4, $5, $6, true);
    `,
      [actaId, numActa, input.oficinaId, input.destinatario, input.fecha || new Date().toISOString(), input.concepto]
    );

    for (const it of input.items) {
      const prodRes = await this.executor.query(
        "SELECT id, unidad_medida as \"unidadMedida\", stock_actual::float as stock, costo::float, nombre FROM productos WHERE id = $1 FOR UPDATE;",
        [it.productoId]
      );
      if (prodRes.rows.length === 0) throw new Error(`Producto ${it.productoId} no encontrado.`);
      const p = prodRes.rows[0];

      if (p.stock < it.cantidad) {
        throw new Error(`Existencias insuficientes para "${p.nombre}". Solicitado: ${it.cantidad}, Disponible: ${p.stock}`);
      }

      const nuevoStock = p.stock - it.cantidad;
      await this.executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
        nuevoStock,
        it.productoId,
      ]);

      const actaItemId = `actai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await this.executor.query(
        `
        INSERT INTO acta_items (id, acta_id, producto_id, cantidad, unidad_medida, observacion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `,
        [actaItemId, actaId, it.productoId, it.cantidad, p.unidadMedida, it.observacion || ""]
      );

      const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
      const seq = seqRes.rows[0].seq;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await this.executor.query(
        `
        INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, destinatario, oficina_id, acta_id, acta_item_id,
          numero_referencia, concepto, usuario, es_auditoria, origen, secuencia,
          costo_unitario, valor_salida, saldo_valorado
        ) VALUES (
          $1, $2, $3, 'SALIDA', $4, 0, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, 'SALIDA_DIRECTA', $15,
          $16, $17, $18
        );
      `,
        [
          movId,
          it.productoId,
          input.fecha || new Date().toISOString(),
          it.cantidad,
          nuevoStock,
          p.unidadMedida,
          input.destinatario,
          input.oficinaId,
          actaId,
          actaItemId,
          numActa,
          input.concepto || `Salida directa según ${numActa}`,
          input.usuario,
          input.esAuditoria || false,
          seq,
          p.costo,
          p.costo * it.cantidad,
          nuevoStock * p.costo,
        ]
      );
    }

    return actaId;
  }

  async editar(id: string, input: { concepto?: string; observacion?: string; destinatario?: string }): Promise<Movimiento> {
    await this.executor.query(
      `
      UPDATE kardex_movimientos SET
        concepto = COALESCE($1, concepto),
        destinatario = COALESCE($2, destinatario)
      WHERE id = $3;
    `,
      [input.concepto, input.destinatario, id]
    );
    return (await this.movimiento(id))!;
  }
}
