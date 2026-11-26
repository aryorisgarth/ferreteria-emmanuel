import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { DB, Producto, Cliente, Proveedor, TurnoCaja, Factura, Compra, Movimiento } from "../src/lib/types";

function runSQLFile(sql: string): any {
  const tmpSql = path.join(process.cwd(), "scripts", "_temp_query.sql");
  fs.writeFileSync(tmpSql, sql);
  try {
    execSync(`docker cp "${tmpSql}" ferreteria-postgres:/tmp/_temp_query.sql`);
    const out = execSync(`docker exec ferreteria-postgres psql -U postgres -d ferreteria_emmanuel -t -A -f /tmp/_temp_query.sql`, { encoding: "utf8" }).trim();
    if (!out) return [];
    return JSON.parse(out);
  } catch (e) {
    console.warn("Query warning:", e);
    return [];
  } finally {
    if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);
  }
}

async function main() {
  console.log("Extrayendo datos de PostgreSQL (ferreteria-postgres)...");

  // 1. Productos
  const rawProductos = runSQLFile(`SELECT json_agg(p) FROM (SELECT * FROM productos ORDER BY codigo) p;`);
  const productos: Producto[] = (rawProductos || []).map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    marca: r.marca || "Genérica",
    unidadMedida: r.unidad_medida,
    inventarioInicial: Number(r.inventario_inicial || 0),
    stockActual: Number(r.stock_actual || 0),
    precio: Number(r.precio || 0),
    costo: Number(r.costo || 0),
    categoria: r.categoria || "Ferretería",
    stockMinimo: Number(r.stock_minimo || 5),
    activo: r.activo !== false,
  }));

  // 2. Oficinas
  const rawOficinas = runSQLFile(`SELECT json_agg(o) FROM (SELECT * FROM oficinas ORDER BY nombre) o;`);
  const oficinas = (rawOficinas || []).map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
  }));

  // 3. Clientes
  const rawClientes = runSQLFile(`SELECT json_agg(c) FROM (SELECT * FROM clientes ORDER BY nombre) c;`);
  const clientes: Cliente[] = (rawClientes || []).map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono || "",
    direccion: r.direccion || "",
    notas: r.notas || "",
    limiteCredito: Number(r.limite_credito || 0),
    saldoPendiente: 0,
  }));

  // 4. Proveedores
  const rawProveedores = runSQLFile(`SELECT json_agg(p) FROM (SELECT * FROM proveedores ORDER BY nombre) p;`);
  const proveedores: Proveedor[] = (rawProveedores || []).map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono || "",
    direccion: r.direccion || "",
    notas: r.notas || "",
  }));

  // 5. Turnos de Caja
  const rawTurnos = runSQLFile(`SELECT json_agg(t) FROM (SELECT * FROM turnos_caja ORDER BY fecha_apertura DESC) t;`);
  const turnosCaja: TurnoCaja[] = (rawTurnos || []).map((r: any) => ({
    id: r.id,
    numero: r.numero,
    usuario: r.usuario,
    fechaApertura: r.fecha_apertura,
    fechaCierre: r.fecha_cierre || null,
    montoInicial: Number(r.monto_inicial || 0),
    montoFinalReal: r.monto_final_real != null ? Number(r.monto_final_real) : null,
    diferencia: r.diferencia != null ? Number(r.diferencia) : null,
    totalVentasEfectivo: Number(r.total_ventas_efectivo || 0),
    totalVentasTransferencia: Number(r.total_ventas_transferencia || 0),
    totalVentasTarjeta: Number(r.total_ventas_tarjeta || 0),
    totalVentasCredito: Number(r.total_ventas_credito || 0),
    totalIngresosExtra: Number(r.total_ingresos_extra || 0),
    totalEgresos: Number(r.total_egresos || 0),
    estado: r.estado,
    notas: r.notas || "",
  }));

  // 6. Facturas
  const rawFacturas = runSQLFile(`
    SELECT json_agg(f) FROM (
      SELECT facturas.*, 
        coalesce((
          SELECT json_agg(fi) FROM factura_items fi WHERE fi.factura_id = facturas.id
        ), '[]'::json) as items
      FROM facturas ORDER BY created_at DESC
    ) f;
  `);
  const facturas: Factura[] = (rawFacturas || []).map((r: any) => ({
    id: r.id,
    numero: r.numero,
    cliente: r.cliente,
    clienteId: r.cliente_id || null,
    fecha: r.fecha,
    cotizacionId: r.cotizacion_id || null,
    notas: r.notas || "",
    creadoPor: r.creado_por,
    estado: r.estado,
    stockAplicado: r.stock_aplicado !== false,
    formaPago: r.forma_pago || "EFECTIVO",
    origen: "DIRECTA",
    items: (r.items || []).map((it: any) => ({
      id: it.id,
      productoId: it.producto_id,
      cantidad: Number(it.cantidad),
      precio: Number(it.precio),
      unidadMedida: it.unidad_medida,
      observacion: it.observacion || "",
    })),
  }));

  // 7. Compras
  const rawCompras = runSQLFile(`
    SELECT json_agg(c) FROM (
      SELECT compras.*,
        coalesce((
          SELECT json_agg(ci) FROM compra_items ci WHERE ci.compra_id = compras.id
        ), '[]'::json) as items
      FROM compras ORDER BY created_at DESC
    ) c;
  `);
  const compras: Compra[] = (rawCompras || []).map((r: any) => ({
    id: r.id,
    numero: r.numero,
    proveedorId: r.proveedor_id || null,
    proveedor: r.proveedor,
    fecha: r.fecha,
    notas: r.notas || "",
    creadoPor: r.creado_por,
    anulada: r.anulada === true,
    items: (r.items || []).map((it: any) => ({
      id: it.id,
      productoId: it.producto_id,
      cantidad: Number(it.cantidad),
      precio: Number(it.costo_unitario),
      unidadMedida: "UNIDAD",
      observacion: it.observacion || "",
    })),
  }));

  // 8. Kárdex Movimientos
  const rawKardex = runSQLFile(`SELECT json_agg(k) FROM (SELECT * FROM kardex_movimientos ORDER BY created_at ASC) k;`);
  const movimientos: Movimiento[] = (rawKardex || []).map((r: any) => ({
    id: r.id,
    productoId: r.producto_id,
    fecha: r.fecha,
    tipo: r.tipo_movimiento,
    cantidad: Number(r.cantidad),
    entradas: Number(r.entradas),
    salidas: Number(r.salidas),
    stockSaldo: Number(r.stock_saldo),
    unidadMedida: r.unidad_medida,
    destinatario: r.destinatario || "",
    oficinaId: r.oficina_id || null,
    actaId: r.acta_id || null,
    actaItemId: r.acta_item_id || null,
    solicitudId: r.solicitud_id || null,
    solicitudItemId: r.solicitud_item_id || null,
    numeroReferencia: r.numero_referencia || "",
    concepto: r.concepto,
    usuario: r.usuario_nombre,
    esAuditoria: r.es_auditoria === true,
    estadoAuditoria: r.estado_auditoria || "NORMAL",
    origen: r.origen,
    idempotencyKey: r.idempotency_key || null,
    secuencia: Number(r.secuencia || 0),
    createdAt: r.created_at,
  }));

  const db: DB = {
    productos,
    oficinas,
    solicitudes: [],
    actas: [],
    movimientos,
    cotizaciones: [],
    facturas,
    clientes,
    proveedores,
    compras,
    gastos: [],
    turnosCaja,
    movimientosCaja: [],
    categorias: [
      "Construcción",
      "Herramientas",
      "Pintura",
      "Eléctrico",
      "Plomería",
      "Seguridad",
      "Ferretería",
      "Otros",
    ],
    folios: {
      solicitud: 0,
      acta: 0,
      excel: 0,
      cotizacion: 0,
      factura: facturas.length,
      compra: compras.length,
    },
  };

  const target = path.join(process.cwd(), "data", "bodega.json");
  fs.writeFileSync(target, JSON.stringify(db, null, 2));

  console.log(`✓ Sincronización exitosa con data/bodega.json:`);
  console.log(`  - Productos: ${productos.length}`);
  console.log(`  - Clientes: ${clientes.length}`);
  console.log(`  - Proveedores: ${proveedores.length}`);
  console.log(`  - Turnos de caja: ${turnosCaja.length}`);
  console.log(`  - Facturas: ${facturas.length}`);
  console.log(`  - Compras: ${compras.length}`);
  console.log(`  - Movimientos Kárdex: ${movimientos.length}`);
}

main().catch((err) => {
  console.error("Error al sincronizar:", err);
  process.exit(1);
});
