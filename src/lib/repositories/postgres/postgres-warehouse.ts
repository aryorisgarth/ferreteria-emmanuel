import type {
  Solicitud,
  Acta,
  AjusteInventario,
  ConteoFisico,
  SolicitudItem,
  LineaDocumento,
  ConteoFisicoItem,
  Pagina,
  EstadoSolicitud,
  LineaCaptura,
} from "@/lib/types";
import type { SqlExecutor } from "./client";

export interface ParametrosAjuste {
  productoId: string;
  tipo: "SOBRANTE" | "FALTANTE" | "DANO" | "MERMA" | "CORRECCION";
  signo?: 1 | -1 | "POSITIVO" | "NEGATIVO";
  cantidad: number;
  motivo?: string;
  observaciones?: string;
  creadoPor?: string;
  usuario?: string;
  conteoId?: string;
}

export interface ParametrosConteoFisico {
  codigoConteo?: string;
  responsable?: string;
  usuario?: string;
  observaciones?: string;
  notas?: string;
  items: Array<{
    productoId: string;
    conteoFisico: number;
    observacion?: string;
  }>;
}

export class PostgresWarehouseService {
  constructor(private executor: SqlExecutor) {}

  // --- SOLICITUDES DE REQUISICIÓN ---
  async solicitudes(page: number = 1, estado?: EstadoSolicitud): Promise<Pagina<Solicitud>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const whereClause = estado ? "WHERE estado = $1" : "";
    const params = estado ? [estado] : [];

    const countRes = await this.executor.query(`SELECT COUNT(*) as total FROM solicitudes ${whereClause};`, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, estado, solicitante, oficina_id as "oficinaId", destinatario,
        observaciones, fecha, acta_id as "actaId", stock_aplicado as "stockAplicado",
        creado_por as "creadoPor"
      FROM solicitudes
      ${whereClause}
      ORDER BY fecha DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `,
      [...params, limit, offset]
    );

    const sols = rowsRes.rows as Solicitud[];
    for (const s of sols) {
      const itemsRes = await this.executor.query(
        `
        SELECT 
          si.id, si.producto_id as "productoId", si.cantidad::float, si.unidad_medida as "unidadMedida",
          si.observacion, p.codigo, p.nombre
        FROM solicitud_items si
        JOIN productos p ON p.id = si.producto_id
        WHERE si.solicitud_id = $1;
      `,
        [s.id]
      );
      s.items = itemsRes.rows as SolicitudItem[];
    }

    return { rows: sols, page, pages, total };
  }

  async solicitud(id: string): Promise<Solicitud | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, estado, solicitante, oficina_id as "oficinaId", destinatario,
        observaciones, fecha, acta_id as "actaId", stock_aplicado as "stockAplicado",
        creado_por as "creadoPor"
      FROM solicitudes
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const s = res.rows[0] as Solicitud;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        si.id, si.producto_id as "productoId", si.cantidad::float, si.unidad_medida as "unidadMedida",
        si.observacion, p.codigo, p.nombre
      FROM solicitud_items si
      JOIN productos p ON p.id = si.producto_id
      WHERE si.solicitud_id = $1;
    `,
      [id]
    );
    s.items = itemsRes.rows as SolicitudItem[];
    return s;
  }

  async crear(input: {
    solicitante: string;
    oficinaId: string;
    destinatario: string;
    observaciones: string;
    fecha: string;
    creadoPor: string;
    items: LineaCaptura[];
  }): Promise<string> {
    if (!input.items || input.items.length === 0) throw new Error("La solicitud no contiene artículos.");

    const solId = `sol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('solicitud', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numero = `SOL-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    await this.executor.query(
      `
      INSERT INTO solicitudes (
        id, numero, estado, solicitante, oficina_id, destinatario, observaciones, fecha, stock_aplicado, creado_por
      ) VALUES ($1, $2, 'PENDIENTE_DE_REVISION', $3, $4, $5, $6, $7, false, $8);
    `,
      [solId, numero, input.solicitante, input.oficinaId, input.destinatario, input.observaciones || "", input.fecha || new Date().toISOString(), input.creadoPor]
    );

    for (const it of input.items) {
      const prodRes = await this.executor.query("SELECT unidad_medida as \"unidadMedida\" FROM productos WHERE id = $1;", [it.productoId]);
      const uMed = prodRes.rows[0]?.unidadMedida || "UNIDAD";
      const itemId = `soli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await this.executor.query(
        `
        INSERT INTO solicitud_items (id, solicitud_id, producto_id, cantidad, unidad_medida, observacion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `,
        [itemId, solId, it.productoId, it.cantidad, uMed, it.observacion || ""]
      );
    }

    return solId;
  }

  async aprobar(id: string, usuario: string): Promise<Solicitud> {
    await this.executor.query("UPDATE solicitudes SET estado = 'APROBADO' WHERE id = $1;", [id]);
    return (await this.solicitud(id))!;
  }

  async entregar(id: string, usuario: string): Promise<Acta> {
    const s = await this.solicitud(id);
    if (!s) throw new Error("Solicitud no encontrada.");
    if (s.estado === "ENTREGADO") throw new Error("La solicitud ya fue entregada anteriormente.");

    const actaId = `acta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('acta', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numActa = `ACT-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    await this.executor.query(
      `
      INSERT INTO actas (
        id, numero, solicitud_id, es_salida_directa, oficina_id, destinatario, fecha, concepto, ejecutada
      ) VALUES ($1, $2, $3, false, $4, $5, NOW(), $6, true);
    `,
      [actaId, numActa, s.id, s.oficinaId, s.destinatario, `Entrega de solicitud ${s.numero}`]
    );

    // Descontar inventario y registrar Kárdex
    for (const it of s.items) {
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
        INSERT INTO acta_items (id, acta_id, producto_id, cantidad, unidad_medida, observacion, solicitud_item_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `,
        [actaItemId, actaId, it.productoId, it.cantidad, p.unidadMedida, it.observacion || "", it.id]
      );

      const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
      const seq = seqRes.rows[0].seq;
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await this.executor.query(
        `
        INSERT INTO kardex_movimientos (
          id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
          unidad_medida, destinatario, oficina_id, acta_id, acta_item_id, solicitud_id, solicitud_item_id,
          numero_referencia, concepto, usuario, origen, secuencia,
          costo_unitario, valor_salida, saldo_valorado
        ) VALUES (
          $1, $2, NOW(), 'SALIDA', $3, 0, $3, $4,
          $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, 'SOLICITUD', $15,
          $16, $17, $18
        );
      `,
        [
          movId,
          it.productoId,
          it.cantidad,
          nuevoStock,
          p.unidadMedida,
          s.destinatario,
          s.oficinaId,
          actaId,
          actaItemId,
          s.id,
          it.id,
          numActa,
          `Salida según acta ${numActa} (Solicitud ${s.numero})`,
          usuario,
          seq,
          p.costo,
          p.costo * it.cantidad,
          nuevoStock * p.costo,
        ]
      );
    }

    await this.executor.query("UPDATE solicitudes SET estado = 'ENTREGADO', acta_id = $1, stock_aplicado = true WHERE id = $2;", [
      actaId,
      s.id,
    ]);

    return (await this.acta(actaId))!;
  }

  // --- ACTAS ---
  async actas(page: number = 1): Promise<Pagina<Acta>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const countRes = await this.executor.query("SELECT COUNT(*) as total FROM actas;");
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, solicitud_id as "solicitudId", es_salida_directa as "esSalidaDirecta",
        oficina_id as "oficinaId", destinatario, fecha, concepto, ejecutada
      FROM actas
      ORDER BY fecha DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    const acts = rowsRes.rows as Acta[];
    for (const a of acts) {
      const itemsRes = await this.executor.query(
        `
        SELECT 
          ai.id, ai.producto_id as "productoId", ai.cantidad::float, ai.unidad_medida as "unidadMedida",
          ai.observacion, ai.solicitud_item_id as "solicitudItemId", p.codigo, p.nombre
        FROM acta_items ai
        JOIN productos p ON p.id = ai.producto_id
        WHERE ai.acta_id = $1;
      `,
        [a.id]
      );
      a.items = itemsRes.rows as LineaDocumento[];
    }

    return { rows: acts, page, pages, total };
  }

  async acta(id: string): Promise<Acta | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, solicitud_id as "solicitudId", es_salida_directa as "esSalidaDirecta",
        oficina_id as "oficinaId", destinatario, fecha, concepto, ejecutada
      FROM actas
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const a = res.rows[0] as Acta;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        ai.id, ai.producto_id as "productoId", ai.cantidad::float, ai.unidad_medida as "unidadMedida",
        ai.observacion, ai.solicitud_item_id as "solicitudItemId", p.codigo, p.nombre
      FROM acta_items ai
      JOIN productos p ON p.id = ai.producto_id
      WHERE ai.acta_id = $1;
    `,
      [id]
    );
    a.items = itemsRes.rows as LineaDocumento[];
    return a;
  }

  // --- AJUSTES DE INVENTARIO ---
  async ajustes(page: number = 1): Promise<Pagina<AjusteInventario>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const countRes = await this.executor.query("SELECT COUNT(*) as total FROM ajustes_inventario;");
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, producto_id as "productoId", tipo, cantidad::float, signo,
        stock_previo::float as "stockPrevio", stock_nuevo::float as "stockNuevo",
        costo_unitario::float as "costoUnitario", valor_total::float as "valorTotal",
        motivo, fecha, usuario, conteo_id as "conteoId", creado_en as "createdAt"
      FROM ajustes_inventario
      ORDER BY fecha DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    return { rows: rowsRes.rows as AjusteInventario[], page, pages, total };
  }

  async registrarAjuste(input: ParametrosAjuste): Promise<AjusteInventario> {
    const prodRes = await this.executor.query(
      "SELECT id, unidad_medida as \"unidadMedida\", stock_actual::float as stock, costo::float, nombre FROM productos WHERE id = $1 FOR UPDATE;",
      [input.productoId]
    );
    if (prodRes.rows.length === 0) throw new Error("Producto no encontrado.");
    const p = prodRes.rows[0];

    const stockPrevio = p.stock;
    const signoNum =
      input.signo === -1 || input.signo === "NEGATIVO" || input.tipo === "FALTANTE" || input.tipo === "DANO" || input.tipo === "MERMA"
        ? -1
        : 1;
    const delta = signoNum * input.cantidad;
    const stockNuevo = stockPrevio + delta;

    if (stockNuevo < 0) {
      throw new Error(`El ajuste dejaría el stock en negativo (${stockNuevo}). Operación cancelada.`);
    }

    await this.executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
      stockNuevo,
      input.productoId,
    ]);

    const ajId = `aj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('ajuste', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numAj = `AJ-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    const costoUnit = p.costo;
    const valorTot = Math.abs(delta) * costoUnit;

    await this.executor.query(
      `
      INSERT INTO ajustes_inventario (
        id, numero, producto_id, tipo, cantidad, signo, stock_previo, stock_nuevo,
        costo_unitario, valor_total, motivo, fecha, usuario, conteo_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, $13);
    `,
      [
        ajId,
        numAj,
        input.productoId,
        input.tipo,
        input.cantidad,
        signoNum,
        stockPrevio,
        stockNuevo,
        costoUnit,
        valorTot,
        input.motivo,
        input.usuario,
        input.conteoId || null,
      ]
    );

    // Kárdex
    const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
    const seq = seqRes.rows[0].seq;
    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tipoKardex = input.signo === 1 ? "ENTRADA" : "SALIDA";

    await this.executor.query(
      `
      INSERT INTO kardex_movimientos (
        id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
        unidad_medida, numero_referencia, concepto, usuario, origen, secuencia,
        costo_unitario, valor_entrada, valor_salida, saldo_valorado
      ) VALUES (
        $1, $2, NOW(), $3, $4, $5, $6, $7,
        $8, $9, $10, $11, 'AJUSTE', $12,
        $13, $14, $15, $16
      );
    `,
      [
        movId,
        input.productoId,
        tipoKardex,
        input.cantidad,
        input.signo === 1 ? input.cantidad : 0,
        input.signo === -1 ? input.cantidad : 0,
        stockNuevo,
        p.unidadMedida,
        numAj,
        `Ajuste de inventario (${input.tipo}): ${input.motivo}`,
        input.usuario,
        seq,
        costoUnit,
        input.signo === 1 ? valorTot : 0,
        input.signo === -1 ? valorTot : 0,
        stockNuevo * costoUnit,
      ]
    );

    const res = await this.executor.query(
      `
      SELECT 
        id, numero, producto_id as "productoId", tipo, cantidad::float, signo,
        stock_previo::float as "stockPrevio", stock_nuevo::float as "stockNuevo",
        costo_unitario::float as "costoUnitario", valor_total::float as "valorTotal",
        motivo, fecha, usuario, conteo_id as "conteoId", creado_en as "createdAt"
      FROM ajustes_inventario WHERE id = $1;
    `,
      [ajId]
    );

    return res.rows[0] as AjusteInventario;
  }

  // --- CONTEOS FÍSICOS ---
  async conteos(page: number = 1): Promise<Pagina<ConteoFisico>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const countRes = await this.executor.query("SELECT COUNT(*) as total FROM conteos_fisicos;");
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT id, numero, fecha, usuario, notas, estado, creado_en as "createdAt"
      FROM conteos_fisicos
      ORDER BY fecha DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    const cfs = rowsRes.rows as ConteoFisico[];
    for (const cf of cfs) {
      const itemsRes = await this.executor.query(
        `
        SELECT 
          producto_id as "productoId", stock_sistema::float as "stockSistema",
          conteo_fisico::float as "conteoFisico", diferencia::float, observacion
        FROM conteo_fisico_items
        WHERE conteo_id = $1;
      `,
        [cf.id]
      );
      cf.items = itemsRes.rows as ConteoFisicoItem[];
    }

    return { rows: cfs, page, pages, total };
  }

  async conteo(id: string): Promise<ConteoFisico | null> {
    const res = await this.executor.query(
      "SELECT id, numero, fecha, usuario, notas, estado, creado_en as \"createdAt\" FROM conteos_fisicos WHERE id = $1 LIMIT 1;",
      [id]
    );
    if (res.rows.length === 0) return null;
    const cf = res.rows[0] as ConteoFisico;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        ci.producto_id as "productoId", ci.stock_sistema::float as "stockSistema",
        ci.conteo_fisico::float as "conteoFisico", ci.diferencia::float, ci.observacion,
        p.codigo, p.nombre
      FROM conteo_fisico_items ci
      JOIN productos p ON p.id = ci.producto_id
      WHERE ci.conteo_id = $1;
    `,
      [id]
    );
    cf.items = itemsRes.rows as ConteoFisicoItem[];
    return cf;
  }

  async registrarConteo(input: ParametrosConteoFisico): Promise<ConteoFisico> {
    const cfId = `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('conteo', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numero = `CF-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    await this.executor.query(
      "INSERT INTO conteos_fisicos (id, numero, fecha, usuario, notas, estado) VALUES ($1, $2, NOW(), $3, $4, 'BORRADOR');",
      [cfId, numero, input.usuario, input.notas || ""]
    );

    for (const it of input.items) {
      const prodRes = await this.executor.query("SELECT stock_actual::float as stock FROM productos WHERE id = $1;", [it.productoId]);
      const stockSistema = prodRes.rows[0]?.stock || 0;
      const diferencia = it.conteoFisico - stockSistema;
      const itemId = `cfi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await this.executor.query(
        `
        INSERT INTO conteo_fisico_items (id, conteo_id, producto_id, stock_sistema, conteo_fisico, diferencia, observacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `,
        [itemId, cfId, it.productoId, stockSistema, it.conteoFisico, diferencia, it.observacion || ""]
      );
    }

    return (await this.conteo(cfId))!;
  }

  async aplicarConteo(id: string, usuario: string): Promise<ConteoFisico> {
    const cf = await this.conteo(id);
    if (!cf) throw new Error("Conteo físico no encontrado.");
    if (cf.estado === "APLICADO") throw new Error("El conteo ya fue aplicado previamente.");

    for (const it of cf.items) {
      if (it.diferencia !== 0) {
        const signo = it.diferencia > 0 ? 1 : -1;
        const tipo = it.diferencia > 0 ? "SOBRANTE" : "FALTANTE";
        await this.registrarAjuste({
          productoId: it.productoId,
          tipo,
          cantidad: Math.abs(it.diferencia),
          signo,
          motivo: `Ajuste automático por Conteo Físico ${cf.numero}`,
          usuario,
          conteoId: cf.id,
        });
      }
    }

    await this.executor.query("UPDATE conteos_fisicos SET estado = 'APLICADO' WHERE id = $1;", [id]);
    return (await this.conteo(id))!;
  }
}
