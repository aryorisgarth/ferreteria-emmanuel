import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Pool } from "pg";

const SALT = process.env.AUTH_SECRET || "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";

export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + SALT)
    .digest("hex");
}

export const REAL_DATA_DIR = path.resolve(process.cwd(), "data");

export interface ArchivoControl {
  path: string;
  size: number;
  hash: string;
}

export function obtenerControlArchivosReales(): Record<string, ArchivoControl> {
  const archivos = ["bodega.json", "configuracion.json", "usuarios.json"];
  const control: Record<string, ArchivoControl> = {};

  for (const nombre of archivos) {
    const ruta = path.join(REAL_DATA_DIR, nombre);
    if (fs.existsSync(ruta)) {
      const contenido = fs.readFileSync(ruta);
      control[nombre] = {
        path: ruta,
        size: contenido.length,
        hash: crypto.createHash("sha256").update(contenido).digest("hex"),
      };
    }
  }
  return control;
}

export function verificarInviolabilidadDatosReales(controlInicial: Record<string, ArchivoControl>) {
  for (const [nombre, ctrl] of Object.entries(controlInicial)) {
    if (!fs.existsSync(ctrl.path)) {
      throw new Error(`VIOLACIÓN CRÍTICA: El archivo real ${ctrl.path} fue eliminado.`);
    }
    const contenido = fs.readFileSync(ctrl.path);
    const hashActual = crypto.createHash("sha256").update(contenido).digest("hex");
    if (hashActual !== ctrl.hash) {
      throw new Error(`VIOLACIÓN CRÍTICA: El archivo real ${ctrl.path} fue alterado durante las pruebas E2E.`);
    }
  }
}

export function obtenerTestDbUrl(): string {
  const envPath = path.resolve(process.cwd(), ".env.test.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("ERROR: No se encontró .env.test.local para la suite E2E de PostgreSQL");
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  let dbUrl = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      dbUrl = trimmed.substring("DATABASE_URL=".length).trim().replace(/^['"]|['"]$/g, "");
      break;
    }
  }
  if (!dbUrl) throw new Error("ERROR: DATABASE_URL ausente en .env.test.local");
  return dbUrl;
}

export async function getTestPool(): Promise<Pool> {
  const dbUrl = obtenerTestDbUrl();
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });

  const res = await pool.query("SELECT current_database(), current_user;");
  const currentDb = res.rows[0].current_database;
  if (currentDb !== "emmanuel_test") {
    await pool.end();
    throw new Error(`BLOQUEO DE SEGURIDAD: Conectado a '${currentDb}', se exige estrictamente 'emmanuel_test'.`);
  }
  return pool;
}

export async function limpiarBaseTest(pool: Pool) {
  const check = await pool.query("SELECT current_database();");
  if (check.rows[0].current_database !== "emmanuel_test") {
    throw new Error("ABORTANDO: La base no es emmanuel_test.");
  }

  await pool.query(`
    TRUNCATE TABLE 
      auditoria_logs,
      acta_items,
      actas,
      solicitud_items,
      solicitudes,
      devolucion_cliente_items,
      devoluciones_cliente,
      factura_items,
      facturas,
      cotizacion_items,
      cotizaciones,
      movimientos_caja,
      turnos_caja,
      pagos_compra,
      devolucion_proveedor_items,
      devoluciones_proveedor,
      recepcion_compra_items,
      recepciones_compra,
      pedido_compra_items,
      pedidos_compra,
      compra_items,
      compras,
      gastos,
      ajustes_inventario,
      conteo_fisico_items,
      conteos_fisicos,
      kardex_movimientos,
      productos,
      clientes,
      proveedores,
      oficinas,
      usuarios_cuentas,
      configuracion_sistema
    CASCADE;
  `);
}

export async function inicializarDatosPostgresE2E(pool: Pool) {
  await limpiarBaseTest(pool);

  // 1. Configuración Institucional
  await pool.query(`
    INSERT INTO configuracion_sistema (
      id, nombre_empresa, ruc, direccion, telefono, correo, moneda, simbolo_moneda,
      iva_porcentaje, dias_credito_default, pie_factura, actualizado_en
    ) VALUES (
      'config_general', 'Ferretería Emmanuel', 'J0310000000000',
      'Managua, Nicaragua - De la rotonda 2c. al sur', '+505 2222-3344',
      'contacto@ferreteriaemmanuel.com', 'CORDOBAS', 'C$', 15.00, 30,
      '¡Gracias por su compra en Ferretería Emmanuel!', NOW()
    );
  `);

  // 2. Usuarios del sistema
  await pool.query(`
    INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo, creado_en)
    VALUES
      ('usr-admin-1', 'admin', 'Administrador Propietario 1', 'admin', $1, true, NOW()),
      ('usr-admin-2', 'propietario2', 'Segundo Propietario', 'admin', $2, true, NOW()),
      ('usr-cajero-1', 'cajero', 'Cajero Mostrador 1', 'cajero', $3, true, NOW()),
      ('usr-bodega-1', 'bodega', 'Encargado de Bodega', 'bodega', $4, true, NOW()),
      ('usr-vendedor-1', 'vendedor', 'Ventas y Cotizaciones', 'vendedor', $5, true, NOW());
  `, [
    hashPassword("admin123"),
    hashPassword("prop123"),
    hashPassword("caja123"),
    hashPassword("bodega123"),
    hashPassword("venta123"),
  ]);

  // 3. Dependencia u oficina institucional
  await pool.query(`
    INSERT INTO oficinas (id, nombre, tipo, creado_en)
    VALUES ('ofi-central', 'Oficina Central de Obras', 'OFICINA', NOW());
  `);

  // 4. Catálogo de Artículos de Prueba
  await pool.query(`
    INSERT INTO productos (id, codigo, nombre, categoria, marca, unidad_medida, stock_actual, stock_minimo, costo, precio, activo, creado_en)
    VALUES
      ('prod-e2e-cem', 'E2E-CEM', 'Cemento Canal 42.5kg', 'Construcción', 'Canal', 'BOLSA', 50, 5, 120.00, 200.00, true, NOW()),
      ('prod-e2e-var', 'E2E-VAR', 'Varilla de Hierro 3/8', 'Construcción', 'Sidenor', 'UNIDAD', 40, 10, 90.00, 150.00, true, NOW()),
      ('prod-e2e-pnt', 'E2E-PNT', 'Pintura Anticorrosiva Gris Galón', 'Pinturas', 'Corona', 'GALON', 2, 5, 300.00, 450.00, true, NOW()),
      ('prod-e2e-clv', 'E2E-CLV', 'Clavos 2.5 pulgadas', 'Ferretería General', 'Genérica', 'LIBRA', 0, 5, 15.00, 30.00, true, NOW());
  `);

  // 5. Movimientos iniciales de Kárdex
  await pool.query(`
    INSERT INTO kardex_movimientos (
      id, producto_id, fecha, tipo, origen, cantidad, entradas, stock_saldo,
      unidad_medida, numero_referencia, concepto, usuario, secuencia, costo_unitario, valor_entrada, saldo_valorado
    )
    VALUES
      ('kdx-1', 'prod-e2e-cem', NOW(), 'ENTRADA', 'MANUAL', 50, 50, 50, 'BOLSA', 'INI-01', 'Inventario Inicial E2E', 'admin', 1, 120.00, 6000.00, 6000.00),
      ('kdx-2', 'prod-e2e-var', NOW(), 'ENTRADA', 'MANUAL', 40, 40, 40, 'UNIDAD', 'INI-02', 'Inventario Inicial E2E', 'admin', 2, 90.00, 3600.00, 3600.00),
      ('kdx-3', 'prod-e2e-pnt', NOW(), 'ENTRADA', 'MANUAL', 2, 2, 2, 'GALON', 'INI-03', 'Inventario Inicial E2E', 'admin', 3, 300.00, 600.00, 600.00);
  `);

  // 6. Cliente y Proveedor
  await pool.query(`
    INSERT INTO clientes (id, nombre, identificacion, telefono, direccion, limite_credito, dias_credito, activo, creado_en)
    VALUES ('cli-e2e-1', 'Constructora Las Colinas S.A.', 'J031000008888', '2278-9900', 'Pista Jean Paul Genie', 100000.00, 30, true, NOW());
  `);

  await pool.query(`
    INSERT INTO proveedores (id, nombre, identificacion, telefono, direccion, dias_credito, activo, creado_en)
    VALUES ('prov-e2e-1', 'Distribuidora Holcim Nicaragua', 'J031000007777', '2255-4400', 'Carretera Norte Km 9', 30, true, NOW());
  `);
}
