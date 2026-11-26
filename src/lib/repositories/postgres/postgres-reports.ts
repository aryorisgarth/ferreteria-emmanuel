import type { TotalDia } from "@/lib/types";
import type { FiltroReporte } from "@/lib/inventory/engine";
import type { SqlExecutor } from "./client";

export class PostgresReportsService {
  constructor(private executor: SqlExecutor) {}

  async resumen(fechaODias?: string | number) {
    const ahora = new Date();
    const hoyIso = ahora.toISOString().slice(0, 10);
    const fecha = typeof fechaODias === "string" && fechaODias.includes("-") ? fechaODias : hoyIso;
    const prefijoMes = fecha.slice(0, 7);

    // Ventas del día
    const vDiaRes = await this.executor.query(
      `
      SELECT 
        COUNT(id) as "ventasHoy",
        COALESCE(SUM(total), 0)::float as "montoVentasHoy",
        COALESCE(SUM(subtotal), 0)::float as "subtotalHoy",
        COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN total ELSE 0 END), 0)::float as "cobradoHoy",
        COALESCE(SUM(costo_total_venta), 0)::float as "costoHoy"
      FROM facturas
      WHERE anulada = false AND fecha::date = $1::date;
      `,
      [fecha]
    );

    // Gastos del día
    const gDiaRes = await this.executor.query(
      `SELECT COALESCE(SUM(monto), 0)::float as "gastosHoy" FROM gastos WHERE fecha::date = $1::date;`,
      [fecha]
    );

    // Ventas del mes
    const vMesRes = await this.executor.query(
      `
      SELECT 
        COUNT(id) as "ventasMes",
        COALESCE(SUM(total), 0)::float as "montoVentasMes",
        COALESCE(SUM(subtotal), 0)::float as "subtotalMes",
        COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN total ELSE 0 END), 0)::float as "cobradoMes",
        COALESCE(SUM(costo_total_venta), 0)::float as "costoMes"
      FROM facturas
      WHERE anulada = false AND to_char(fecha, 'YYYY-MM') = $1;
      `,
      [prefijoMes]
    );

    // Gastos del mes
    const gMesRes = await this.executor.query(
      `SELECT COALESCE(SUM(monto), 0)::float as "gastosMes" FROM gastos WHERE to_char(fecha, 'YYYY-MM') = $1;`,
      [prefijoMes]
    );

    // Cuentas por cobrar (facturas a crédito EMITIDAS no saldadas)
    const cxcRes = await this.executor.query(
      `
      SELECT COALESCE(SUM(total), 0)::float as "porCobrar"
      FROM facturas
      WHERE anulada = false AND forma_pago = 'CREDITO' AND estado = 'EMITIDA';
      `
    );

    // Cuentas por pagar (compras a crédito no anuladas con saldo pendiente)
    const cxpRes = await this.executor.query(
      `
      SELECT COALESCE(SUM(saldo_pendiente), 0)::float as "cuentasPorPagar"
      FROM compras
      WHERE anulada = false AND condicion_pago = 'CREDITO' AND saldo_pendiente > 0.001;
      `
    );

    // Productos
    const prodRes = await this.executor.query(
      `
      SELECT 
        id, codigo, nombre, categoria, stock_actual as "stockActual", stock_minimo as "stockMinimo",
        unidad_medida as "unidadMedida", costo, precio
      FROM productos
      WHERE activo = true;
      `
    );

    // Conteo de entidades
    const countsRes = await this.executor.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM cotizaciones) as "totalCotizaciones",
        (SELECT COUNT(*) FROM facturas) as "totalFacturas",
        (SELECT COUNT(*) FROM clientes WHERE activo = true) as "totalClientes",
        (SELECT COUNT(*) FROM proveedores WHERE activo = true) as "totalProveedores";
      `
    );

    // Conteo solicitudes
    const solRes = await this.executor.query(
      `SELECT estado, COUNT(*)::int as cant FROM solicitudes GROUP BY estado;`
    );

    // Turno activo
    const cajaRes = await this.executor.query(
      `
      SELECT 
        id, numero, usuario, fecha_apertura as "fechaApertura", fecha_cierre as "fechaCierre",
        monto_inicial::float as "montoInicial", monto_final_real::float as "montoFinalReal",
        diferencia::float, total_ventas_efectivo::float as "totalVentasEfectivo",
        total_ventas_transferencia::float as "totalVentasTransferencia",
        total_ventas_tarjeta::float as "totalVentasTarjeta", total_ventas_credito::float as "totalVentasCredito",
        total_ingresos_extra::float as "totalIngresosExtra", total_egresos::float as "totalEgresos",
        estado, notas
      FROM turnos_caja
      WHERE estado = 'ABIERTO'
      ORDER BY fecha_apertura DESC LIMIT 1;
      `
    );

    // Compras recientes
    const cmpRecientesRes = await this.executor.query(
      `
      SELECT id, numero, fecha, proveedor as "proveedorNombre", total, estado_pago as "estadoPago"
      FROM compras
      WHERE anulada = false
      ORDER BY fecha DESC LIMIT 5;
      `
    );

    const vDia = vDiaRes.rows[0] || {};
    const gDia = gDiaRes.rows[0] || {};
    const vMes = vMesRes.rows[0] || {};
    const gMes = gMesRes.rows[0] || {};
    const cxc = cxcRes.rows[0] || {};
    const cxp = cxpRes.rows[0] || {};
    const counts = countsRes.rows[0] || {};

    const productos = prodRes.rows || [];
    let valorInventario = 0;
    let valorInventarioVenta = 0;
    const stockBajo: any[] = [];
    const sinExistencia: any[] = [];

    for (const p of productos) {
      const stock = Math.max(0, p.stockActual || 0);
      valorInventario += stock * (p.costo || 0);
      valorInventarioVenta += stock * (p.precio || 0);
      if (p.stockMinimo !== null && p.stockMinimo !== undefined && p.stockActual <= p.stockMinimo && p.stockActual > 0) {
        stockBajo.push(p);
      }
      if (p.stockActual <= 0) {
        sinExistencia.push(p);
      }
    }

    const ventasHoy = vDia.montoVentasHoy || 0;
    const subtotalDia = vDia.subtotalHoy || 0;
    const cobradoDia = vDia.cobradoHoy || 0;
    const costoHoy = vDia.costoHoy || 0;
    const gastosHoy = gDia.gastosHoy || 0;
    const utilidadBrutaDia = subtotalDia - costoHoy;
    const utilidadNetaDia = utilidadBrutaDia - gastosHoy;

    const ventasMes = vMes.montoVentasMes || 0;
    const subtotalMes = vMes.subtotalMes || 0;
    const cobradoMes = vMes.cobradoMes || 0;
    const costoMes = vMes.costoMes || 0;
    const gastosMes = gMes.gastosMes || 0;
    const utilidadBrutaMes = subtotalMes - costoMes;
    const utilidadNetaMes = utilidadBrutaMes - gastosMes;

    const solConteo = { PENDIENTE_DE_REVISION: 0, APROBADO: 0, ENTREGADO: 0 };
    for (const r of solRes.rows || []) {
      if (r.estado in solConteo) {
        (solConteo as any)[r.estado] = r.cant;
      }
    }

    const turno = cajaRes.rows[0] || null;

    return {
      fecha,
      ventas: ventasHoy,
      ventasDia: ventasHoy,
      ventasHoy,
      subtotalDia,
      cobrado: cobradoDia,
      cobradoDia,
      costoHoy,
      gastosHoy,
      utilidadBrutaDia,
      utilidadNetaDia,
      utilidad: utilidadNetaDia,
      ventasMes,
      subtotalMes,
      cobradoMes,
      costoMes,
      gastosMes,
      utilidadBrutaMes,
      utilidadNetaMes,
      porCobrar: cxc.porCobrar || 0,
      cuentasPorCobrar: cxc.porCobrar || 0,
      cuentasPorPagar: cxp.cuentasPorPagar || 0,
      valorInventario,
      valorInventarioVenta,
      productos: productos.length,
      cotizaciones: parseInt(counts.totalCotizaciones || "0", 10),
      facturas: parseInt(counts.totalFacturas || "0", 10),
      clientes: parseInt(counts.totalClientes || "0", 10),
      proveedores: parseInt(counts.totalProveedores || "0", 10),
      conteos: solConteo,
      stockBajo,
      sinExistencia,
      despachos: [],
      turno,
      comprasRecientes: cmpRecientesRes.rows || [],
    };
  }

  async total(dias: number = 1): Promise<TotalDia[]> {
    const fechaLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
    const res = await this.executor.query(
      `
      SELECT 
        p.id as "productoId", p.codigo, p.nombre, p.unidad_medida as "unidadMedida",
        COALESCE(SUM(k.salidas), 0)::float as total,
        ARRAY_AGG(DISTINCT k.destinatario) FILTER (WHERE k.destinatario != '') as destinatarios
      FROM kardex_movimientos k
      JOIN productos p ON p.id = k.producto_id
      WHERE k.fecha >= $1 AND k.tipo = 'SALIDA'
      GROUP BY p.id, p.codigo, p.nombre, p.unidad_medida
      ORDER BY total DESC;
    `,
      [fechaLimite]
    );

    return (res.rows || []).map((r) => ({
      productoId: r.productoId,
      codigo: r.codigo,
      nombre: r.nombre,
      unidadMedida: r.unidadMedida,
      total: r.total || 0,
      destinatarios: r.destinatarios || [],
    }));
  }

  async reporteVentasPeriodo(filtro: FiltroReporte = {}) {
    const conditions: string[] = ["anulada = false"];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.desde) {
      conditions.push(`fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await this.executor.query(
      `
      SELECT 
        id, numero, cliente, fecha, subtotal::float, descuento::float, iva::float,
        total::float, costo_total_venta::float as "costoTotalVenta", forma_pago as "formaPago",
        creado_por as "creadoPor"
      FROM facturas
      ${where}
      ORDER BY fecha DESC;
    `,
      params
    );

    const facturas = res.rows;
    const totalVentas = facturas.reduce((sum, f) => sum + f.total, 0);
    const totalCostos = facturas.reduce((sum, f) => sum + (f.costoTotalVenta || 0), 0);
    const utilidadBruta = totalVentas - totalCostos;

    return {
      facturas,
      resumen: {
        totalOperaciones: facturas.length,
        totalVentas,
        totalCostos,
        utilidadBruta,
      },
    };
  }

  async reporteVentasProducto(filtro: FiltroReporte = {}) {
    const conditions: string[] = ["f.anulada = false"];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.desde) {
      conditions.push(`f.fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`f.fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await this.executor.query(
      `
      SELECT 
        p.id as "productoId", p.codigo, p.nombre, p.categoria,
        COALESCE(SUM(fi.cantidad), 0)::float as "cantidadVendida",
        COALESCE(SUM(fi.cantidad * fi.precio - fi.descuento * fi.cantidad), 0)::float as "montoTotalVendido",
        COALESCE(SUM(fi.cantidad * fi.costo_unitario), 0)::float as "costoTotal",
        COALESCE(SUM(fi.cantidad * (fi.precio - fi.costo_unitario)), 0)::float as "utilidadBruta"
      FROM factura_items fi
      JOIN facturas f ON f.id = fi.factura_id
      JOIN productos p ON p.id = fi.producto_id
      ${where}
      GROUP BY p.id, p.codigo, p.nombre, p.categoria
      ORDER BY "montoTotalVendido" DESC;
    `,
      params
    );

    return res.rows;
  }

  async reporteVentasCajero(filtro: FiltroReporte = {}) {
    const conditions: string[] = ["anulada = false"];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.desde) {
      conditions.push(`fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await this.executor.query(
      `
      SELECT 
        creado_por as cajero,
        COUNT(id) as "totalOperaciones",
        COALESCE(SUM(total), 0)::float as "montoTotal"
      FROM facturas
      ${where}
      GROUP BY creado_por
      ORDER BY "montoTotal" DESC;
    `,
      params
    );

    return res.rows;
  }

  async reporteVentasMedioPago(filtro: FiltroReporte = {}) {
    const conditions: string[] = ["anulada = false"];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.desde) {
      conditions.push(`fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await this.executor.query(
      `
      SELECT 
        forma_pago as "formaPago",
        COUNT(id) as "totalOperaciones",
        COALESCE(SUM(total), 0)::float as "montoTotal"
      FROM facturas
      ${where}
      GROUP BY forma_pago
      ORDER BY "montoTotal" DESC;
    `,
      params
    );

    return res.rows;
  }

  async reporteComprasProveedor(filtro: FiltroReporte = {}) {
    const conditions: string[] = ["anulada = false"];
    const params: any[] = [];
    let pIdx = 1;

    if (filtro.desde) {
      conditions.push(`fecha >= $${pIdx++}`);
      params.push(filtro.desde);
    }
    if (filtro.hasta) {
      conditions.push(`fecha <= $${pIdx++}`);
      params.push(filtro.hasta);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const res = await this.executor.query(
      `
      SELECT 
        proveedor,
        COUNT(id) as "totalCompras",
        COALESCE(SUM(total), 0)::float as "montoTotal",
        COALESCE(SUM(saldo_pendiente), 0)::float as "saldoTotalPendiente"
      FROM compras
      ${where}
      GROUP BY proveedor
      ORDER BY "montoTotal" DESC;
    `,
      params
    );

    return res.rows;
  }

  async reporteDevoluciones(filtro: FiltroReporte = {}) {
    const devCliRes = await this.executor.query(`
      SELECT id, numero, factura_numero as "facturaNumero", cliente, fecha, total_reintegro::float as total, motivo
      FROM devoluciones_cliente
      ORDER BY fecha DESC;
    `);

    const devProvRes = await this.executor.query(`
      SELECT id, numero, proveedor, fecha, total::float as total, motivo
      FROM devoluciones_proveedor
      ORDER BY fecha DESC;
    `);

    return {
      devolucionesClientes: devCliRes.rows,
      devolucionesProveedores: devProvRes.rows,
    };
  }

  async reporteValoracionInventario() {
    const res = await this.executor.query(`
      SELECT 
        id, codigo, nombre, categoria, unidad_medida as "unidadMedida",
        stock_actual::float as "stockActual", costo::float, precio::float,
        (stock_actual * costo)::float as "valorCosto",
        (stock_actual * precio)::float as "valorVenta"
      FROM productos
      WHERE activo = true
      ORDER BY "valorCosto" DESC;
    `);

    const articulos = res.rows;
    const valorTotalCosto = articulos.reduce((s, a) => s + a.valorCosto, 0);
    const valorTotalVenta = articulos.reduce((s, a) => s + a.valorVenta, 0);

    return {
      articulos,
      resumen: {
        totalArticulos: articulos.length,
        valorTotalCosto,
        valorTotalVenta,
        margenEstimado: valorTotalVenta - valorTotalCosto,
      },
    };
  }

  async reporteCuentasPorPagar() {
    const res = await this.executor.query(`
      SELECT 
        id, numero, factura_proveedor as "facturaProveedor", proveedor, fecha,
        dias_credito as "diasCredito", fecha_vencimiento as "fechaVencimiento",
        total::float, saldo_pendiente::float as "saldoPendiente", estado_pago as "estadoPago"
      FROM compras
      WHERE anulada = false AND saldo_pendiente > 0
      ORDER BY fecha_vencimiento ASC NULLS LAST;
    `);

    const cuentas = res.rows;
    const totalSaldoPendiente = cuentas.reduce((s, c) => s + c.saldoPendiente, 0);

    return { cuentas, totalSaldoPendiente };
  }

  async reporteCuentasPorCobrar() {
    const res = await this.executor.query(`
      SELECT 
        id, nombre, identificacion, telefono,
        limite_credito::float as "limiteCredito", saldo_pendiente::float as "saldoPendiente",
        dias_credito as "diasCredito"
      FROM clientes
      WHERE activo = true AND saldo_pendiente > 0
      ORDER BY saldo_pendiente DESC;
    `);

    const clientes = res.rows;
    const totalPorCobrar = clientes.reduce((s, c) => s + c.saldoPendiente, 0);

    return { clientes, totalPorCobrar };
  }

  async reporteCajaTurnos(filtro: FiltroReporte = {}) {
    const res = await this.executor.query(`
      SELECT 
        id, numero, usuario, fecha_apertura as "fechaApertura", fecha_cierre as "fechaCierre",
        monto_inicial::float as "montoInicial", monto_final_real::float as "montoFinalReal",
        diferencia::float, total_ventas_efectivo::float as "totalVentasEfectivo",
        total_ventas_transferencia::float as "totalVentasTransferencia",
        total_ventas_tarjeta::float as "totalVentasTarjeta",
        total_ingresos_extra::float as "totalIngresosExtra",
        total_egresos::float as "totalEgresos", estado
      FROM turnos_caja
      ORDER BY fecha_apertura DESC
      LIMIT 50;
    `);

    return res.rows;
  }

  async reporteAuditoria(filtro: FiltroReporte = {}) {
    const res = await this.executor.query(`
      SELECT id, usuario, modulo, accion, entidad, entidad_id as "entidadId", detalles, creado_en as "creadoEn"
      FROM auditoria_logs
      ORDER BY creado_en DESC
      LIMIT 100;
    `);
    return res.rows;
  }

  async generarRespaldo() {
    const prods = await this.executor.query("SELECT * FROM productos;");
    const facts = await this.executor.query("SELECT * FROM facturas;");
    const cmps = await this.executor.query("SELECT * FROM compras;");
    const clis = await this.executor.query("SELECT * FROM clientes;");
    const provs = await this.executor.query("SELECT * FROM proveedores;");

    return {
      fecha: new Date().toISOString(),
      sistema: "Ferretería Emmanuel (PostgreSQL Neon)",
      conteos: {
        productos: prods.rows.length,
        facturas: facts.rows.length,
        compras: cmps.rows.length,
        clientes: clis.rows.length,
        proveedores: provs.rows.length,
      },
    };
  }
}
