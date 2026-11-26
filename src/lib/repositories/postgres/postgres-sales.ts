import type { Factura, DevolucionCliente, Pagina, LineaComercial, LineaDevolucionCliente } from "@/lib/types";
import type { SqlExecutor } from "./client";

export class PostgresSalesService {
  constructor(private executor: SqlExecutor) { }

  async facturas(page: number = 1, q: string = "", estado: string = ""): Promise<Pagina<any>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (estado) {
      params.push(estado);
      whereClauses.push(`estado = $${params.length}`);
    }

    if (q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      whereClauses.push(`(LOWER(numero) LIKE $${params.length} OR LOWER(cliente) LIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const countRes = await this.executor.query(`SELECT COUNT(*) as total FROM facturas ${whereSql};`, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const queryParams = [...params, limit, offset];
    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, cliente, cliente_id as "clienteId", fecha, cotizacion_id as "cotizacionId",
        notas, creado_por as "creadoPor", estado, stock_aplicado as "stockAplicado",
        forma_pago as "formaPago", origen, descuento::float, subtotal::float, iva::float,
        total::float, costo_total_venta::float as "costoTotalVenta", monto_recibido::float as "montoRecibido",
        cambio::float, anulada, motivo_anulacion as "motivoAnulacion", anulada_por as "anuladaPor",
        fecha_anulacion as "fechaAnulacion", clave_idempotencia as "claveIdempotencia"
      FROM facturas
      ${whereSql}
      ORDER BY fecha DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `,
      queryParams
    );

    const facturas = rowsRes.rows as Factura[];
    if (facturas.length === 0) {
      return { rows: [], page, pages, total };
    }

    // Eliminación de consulta N+1: Cargar todos los ítems en una única consulta batch
    const facIds = facturas.map((f) => f.id);
    const itemsRes = await this.executor.query(
      `
      SELECT 
        fi.id, fi.factura_id as "facturaId", fi.producto_id as "productoId", fi.cantidad::float, fi.precio::float,
        fi.unidad_medida as "unidadMedida", fi.observacion, fi.costo_unitario::float as "costoUnitario",
        fi.descuento::float, fi.exento_iva as "exentoIva", p.codigo, p.nombre,
        (fi.cantidad * fi.precio)::float as importe
      FROM factura_items fi
      LEFT JOIN productos p ON p.id = fi.producto_id
      WHERE fi.factura_id = ANY($1);
    `,
      [facIds]
    );

    const itemsMap = new Map<string, LineaComercial[]>();
    for (const item of itemsRes.rows) {
      const list = itemsMap.get(item.facturaId) || [];
      list.push(item);
      itemsMap.set(item.facturaId, list);
    }

    const formattedRows = facturas.map((f) => {
      const items = itemsMap.get(f.id) || [];
      f.items = items;
      return {
        ...f,
        factura: f,
        items,
        subtotal: f.subtotal,
        descuento: f.descuento,
        iva: f.iva,
        isv: f.iva,
        total: f.total,
      };
    });

    return { rows: formattedRows, page, pages, total };
  }

  async cuentasPorCobrar(page: number = 1, q: string = ""): Promise<{ rows: any[]; items: any[]; total: number; pages: number; page: number }> {
    const limit = page === 0 ? 1000 : 20;
    const offset = page === 0 ? 0 : Math.max(0, (page - 1) * limit);

    const whereClauses = ["forma_pago = 'CREDITO'", "estado = 'EMITIDA'", "anulada = false"];
    const params: any[] = [];

    if (q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      whereClauses.push(`(LOWER(numero) LIKE $${params.length} OR LOWER(cliente) LIKE $${params.length})`);
    }

    const whereSql = "WHERE " + whereClauses.join(" AND ");
    const countRes = await this.executor.query(`SELECT COUNT(*) as total FROM facturas ${whereSql};`, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / (page === 0 ? 1000 : limit)));

    const queryParams = [...params, limit, offset];
    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, cliente, cliente_id as "clienteId", fecha, cotizacion_id as "cotizacionId",
        notas, creado_por as "creadoPor", estado, forma_pago as "formaPago", total::float
      FROM facturas
      ${whereSql}
      ORDER BY fecha DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `,
      queryParams
    );

    const rows = rowsRes.rows.map((f: any) => ({
      id: f.id,
      numero: f.numero,
      cliente: f.cliente,
      clienteId: f.clienteId,
      fecha: f.fecha,
      total: f.total || 0,
      saldoPendiente: f.total || 0,
      abonosPrevios: 0,
      formaPago: f.formaPago,
      estado: f.estado,
    }));

    return { rows, items: rows, total, pages, page: page === 0 ? 1 : page };
  }

  async factura(id: string): Promise<any | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, cliente, cliente_id as "clienteId", fecha, cotizacion_id as "cotizacionId",
        notas, creado_por as "creadoPor", estado, stock_aplicado as "stockAplicado",
        forma_pago as "formaPago", origen, descuento::float, subtotal::float, iva::float,
        total::float, costo_total_venta::float as "costoTotalVenta", monto_recibido::float as "montoRecibido",
        cambio::float, anulada, motivo_anulacion as "motivoAnulacion", anulada_por as "anuladaPor",
        fecha_anulacion as "fechaAnulacion", clave_idempotencia as "claveIdempotencia"
      FROM facturas
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const f = res.rows[0] as Factura;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        fi.id, fi.producto_id as "productoId", fi.cantidad::float, fi.precio::float,
        fi.unidad_medida as "unidadMedida", fi.observacion, fi.costo_unitario::float as "costoUnitario",
        fi.descuento::float, fi.exento_iva as "exentoIva", p.codigo, p.nombre,
        (fi.cantidad * fi.precio)::float as importe
      FROM factura_items fi
      JOIN productos p ON p.id = fi.producto_id
      WHERE fi.factura_id = $1;
    `,
      [id]
    );
    f.items = itemsRes.rows as LineaComercial[];

    let cotizacion: any = null;
    if (f.cotizacionId) {
      const cotRes = await this.executor.query("SELECT * FROM cotizaciones WHERE id = $1 LIMIT 1;", [f.cotizacionId]);
      cotizacion = cotRes.rows[0] || null;
    }

    return {
      ...f,
      factura: f,
      cotizacion,
      items: f.items,
      subtotal: f.subtotal,
      descuento: f.descuento,
      iva: f.iva,
      isv: f.iva,
      total: f.total,
    };
  }

  async anularFactura(id: string, usuario: string, motivo: string): Promise<Factura> {
    const f = await this.factura(id);
    if (!f) throw new Error("Factura no encontrada.");
    if (f.anulada) throw new Error("La factura ya se encuentra anulada.");

    // 1. Revertir inventario
    for (const it of f.items) {
      const prodRes = await this.executor.query(
        "SELECT stock_actual::float as stock, costo::float, unidad_medida as \"unidadMedida\" FROM productos WHERE id = $1 FOR UPDATE;",
        [it.productoId]
      );
      if (prodRes.rows.length > 0) {
        const p = prodRes.rows[0];
        const nuevoStock = p.stock + it.cantidad;
        await this.executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
          nuevoStock,
          it.productoId,
        ]);

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
            $1, $2, NOW(), 'ENTRADA', $3, $3, 0, $4,
            $5, $6, $7, $8, 'AJUSTE', $9,
            $10, $11, $12
          );
        `,
          [
            movId,
            it.productoId,
            it.cantidad,
            nuevoStock,
            p.unidadMedida,
            f.numero,
            `Anulación de factura ${f.numero}: ${motivo}`,
            usuario,
            seq,
            p.costo,
            p.costo * it.cantidad,
            nuevoStock * p.costo,
          ]
        );
      }
    }

    // 2. Marcar factura como ANULADA
    await this.executor.query(
      `
      UPDATE facturas SET
        estado = 'ANULADA',
        anulada = true,
        anulada_por = $1,
        motivo_anulacion = $2,
        fecha_anulacion = NOW()
      WHERE id = $3;
    `,
      [usuario, motivo, id]
    );

    return (await this.factura(id))!;
  }

  async pagarFactura(id: string, formaPago: any): Promise<Factura> {
    await this.executor.query(
      "UPDATE facturas SET estado = 'PAGADA', forma_pago = COALESCE($1, forma_pago) WHERE id = $2;",
      [formaPago, id]
    );
    return (await this.factura(id))!;
  }

  async registrarDevolucionCliente(input: {
    facturaId: string;
    motivo: string;
    responsable: string;
    metodoReintegro: "EFECTIVO" | "NOTA_CREDITO";
    items: { productoId: string; cantidad: number; observacion?: string }[];
  }): Promise<string> {
    const f = await this.factura(input.facturaId);
    if (!f) throw new Error("Factura no encontrada.");

    const devId = `devc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('devolucionCliente', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numDev = `DEV-CLI-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

    let subtotal = 0;
    for (const it of input.items) {
      const match = f.items.find((fi) => fi.productoId === it.productoId);
      const precio = match ? match.precio : 0;
      subtotal += precio * it.cantidad;
    }
    const iva = subtotal * 0.15;
    const totalReintegro = subtotal + iva;

    await this.executor.query(
      `
      INSERT INTO devoluciones_cliente (
        id, numero, factura_id, factura_numero, cliente, cliente_id,
        fecha, motivo, responsable, subtotal, iva, total_reintegro, metodo_reintegro
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12);
    `,
      [
        devId,
        numDev,
        f.id,
        f.numero,
        f.cliente,
        f.clienteId || null,
        input.motivo,
        input.responsable,
        subtotal,
        iva,
        totalReintegro,
        input.metodoReintegro,
      ]
    );

    // Reintegrar stock y Kárdex
    for (const it of input.items) {
      const match = f.items.find((fi) => fi.productoId === it.productoId);
      const precio = match ? match.precio : 0;

      const prodRes = await this.executor.query(
        "SELECT stock_actual::float as stock, costo::float, unidad_medida as \"unidadMedida\" FROM productos WHERE id = $1 FOR UPDATE;",
        [it.productoId]
      );
      if (prodRes.rows.length > 0) {
        const p = prodRes.rows[0];
        const nuevoStock = p.stock + it.cantidad;
        await this.executor.query("UPDATE productos SET stock_actual = $1, actualizado_en = NOW() WHERE id = $2;", [
          nuevoStock,
          it.productoId,
        ]);

        const devItemId = `devci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await this.executor.query(
          `
          INSERT INTO devolucion_cliente_items (id, devolucion_id, producto_id, cantidad, precio_venta, costo_unitario, observacion)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
          [devItemId, devId, it.productoId, it.cantidad, precio, p.costo, it.observacion || ""]
        );

        const seqRes = await this.executor.query("SELECT COALESCE(MAX(secuencia), 0) + 1 as seq FROM kardex_movimientos;");
        const seq = seqRes.rows[0].seq;
        const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        await this.executor.query(
          `
          INSERT INTO kardex_movimientos (
            id, producto_id, fecha, tipo, cantidad, entradas, salidas, stock_saldo,
            unidad_medida, destinatario, numero_referencia, concepto, usuario, origen, secuencia,
            costo_unitario, valor_entrada, saldo_valorado
          ) VALUES (
            $1, $2, NOW(), 'ENTRADA', $3, $3, 0, $4,
            $5, $6, $7, $8, $9, 'AJUSTE', $10,
            $11, $12, $13
          );
        `,
          [
            movId,
            it.productoId,
            it.cantidad,
            nuevoStock,
            p.unidadMedida,
            f.cliente,
            numDev,
            `Devolución de cliente según ${numDev}`,
            input.responsable,
            seq,
            p.costo,
            p.costo * it.cantidad,
            nuevoStock * p.costo,
          ]
        );
      }
    }

    return devId;
  }

  async devolucionCliente(id: string): Promise<DevolucionCliente | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, factura_id as "facturaId", factura_numero as "facturaNumero",
        cliente, cliente_id as "clienteId", fecha, motivo, responsable,
        subtotal::float, iva::float, total_reintegro::float as "totalReintegro",
        metodo_reintegro as "metodoReintegro", reintegro_caja_id as "reintegroCajaId",
        creado_en as "createdAt"
      FROM devoluciones_cliente
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    const d = res.rows[0] as DevolucionCliente;

    const itemsRes = await this.executor.query(
      `
      SELECT 
        id, producto_id as "productoId", cantidad::float, precio_venta::float as "precioVenta",
        costo_unitario::float as "costoUnitario", observacion
      FROM devolucion_cliente_items
      WHERE devolucion_id = $1;
    `,
      [id]
    );
    d.items = itemsRes.rows as LineaDevolucionCliente[];
    return d;
  }

  async devolucionesCliente(
    params?: number | { page?: number; facturaId?: string; clienteId?: string }
  ): Promise<any> {
    let pageNum = 1;
    let facturaId: string | undefined;
    let clienteId: string | undefined;

    if (typeof params === "number") {
      pageNum = isNaN(params) || params < 1 ? 1 : Math.floor(params);
    } else if (params && typeof params === "object") {
      if (typeof params.page === "number") {
        pageNum = isNaN(params.page) || params.page < 1 ? 1 : Math.floor(params.page);
      } else if (typeof (params as any).page === "string") {
        const parsed = parseInt((params as any).page, 10);
        pageNum = isNaN(parsed) || parsed < 1 ? 1 : parsed;
      }
      if (params.facturaId && typeof params.facturaId === "string") {
        facturaId = params.facturaId.trim();
      }
      if (params.clienteId && typeof params.clienteId === "string") {
        clienteId = params.clienteId.trim();
      }
    }

    const limit = 50;
    const offset = Math.max(0, (pageNum - 1) * limit);

    // Si se filtra por facturaId o clienteId, aplicar cláusula WHERE
    let sqlWhere = "";
    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (facturaId) {
      queryParams.push(facturaId);
      conditions.push(`factura_id = $${queryParams.length}`);
    }
    if (clienteId) {
      queryParams.push(clienteId);
      conditions.push(`cliente_id = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
      sqlWhere = `WHERE ${conditions.join(" AND ")}`;
    }

    const countRes = await this.executor.query(
      `SELECT COUNT(*) as total FROM devoluciones_cliente ${sqlWhere};`,
      queryParams
    );
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const fetchParams = [...queryParams, limit, offset];

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, factura_id as "facturaId", factura_numero as "facturaNumero",
        cliente, cliente_id as "clienteId", fecha, motivo, responsable,
        subtotal::float, iva::float, total_reintegro::float as "totalReintegro",
        metodo_reintegro as "metodoReintegro", reintegro_caja_id as "reintegroCajaId",
        creado_en as "createdAt"
      FROM devoluciones_cliente
      ${sqlWhere}
      ORDER BY fecha DESC
      LIMIT $${fetchParams.length - 1} OFFSET $${fetchParams.length};
    `,
      fetchParams
    );

    const devs = rowsRes.rows as DevolucionCliente[];
    for (const d of devs) {
      const itemsRes = await this.executor.query(
        "SELECT id, producto_id as \"productoId\", cantidad::float, precio_venta::float as \"precioVenta\", costo_unitario::float as \"costoUnitario\", observacion FROM devolucion_cliente_items WHERE devolucion_id = $1;",
        [d.id]
      );
      d.items = itemsRes.rows as LineaDevolucionCliente[];
    }

    // Compatibilidad dual: array directo con metadatos de Pagina
    Object.assign(devs, {
      rows: devs,
      page: pageNum,
      pages,
      total,
    });

    return devs;
  }
}
