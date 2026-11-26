import Module from "node:module";

// Interceptar server-only para scripts de prueba ejecutados fuera de Next.js
const originalRequire = (Module as any).prototype.require;
(Module as any).prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

import fs from "node:fs";
import path from "node:path";

// 1. Cargar estrictamente .env.test.local
const envPath = path.resolve(process.cwd(), ".env.test.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR CRÍTICO: No se encontró .env.test.local");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
for (const rawLine of envContent.split("\n")) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

interface TestResult {
  modulo: string;
  descripcion: string;
  resultado: "APROBADO" | "FALLIDO";
  detalles: string;
}

async function ejecutarPruebaIntegral() {
  const { getPool, closePool, query } = await import("@/lib/repositories/postgres/client");
  const { PostgresCommercialRepository } = await import("@/lib/repositories/postgres/postgres-commercial-repository");
  const { PostgresAuthRepository } = await import("@/lib/repositories/postgres/postgres-auth-repository");
  const { PostgresConfigRepository } = await import("@/lib/repositories/postgres/postgres-config-repository");
  const { getStorageProvider, getCommercialRepository, getAuthRepository, getConfigRepository } = await import("@/lib/repositories");

  console.log("============================================================================");
  console.log("FERRETERÍA EMMANUEL — PRUEBA INTEGRAL DE MÓDULOS EN NEON POSTGRESQL");
  console.log("============================================================================\n");

  const resultados: TestResult[] = [];
  const pool = getPool();

  const RUN_TAG = `TEST_${Date.now().toString().slice(-6)}`;

  // --- 1. VERIFICACIÓN DE CONEXIÓN Y BASE DE DATOS ---
  console.log("1. Verificando aislamiento y nombre de base de datos...");
  const dbCheck = await query("SELECT current_database(), current_user;");
  const currentDb = dbCheck.rows[0].current_database;
  const currentUser = dbCheck.rows[0].current_user;

  console.log(`   Base de datos conectada: '${currentDb}'`);
  console.log(`   Usuario autenticado:      '${currentUser}'`);

  if (currentDb !== "emmanuel_test") {
    console.error(`ERROR FATAL: Conectado a '${currentDb}', se exige 'emmanuel_test'. Abortando.`);
    process.exit(1);
  }

  resultados.push({
    modulo: "Conexión y Aislamiento",
    descripcion: "Verificación de current_database() == emmanuel_test",
    resultado: "APROBADO",
    detalles: `Base conectada: ${currentDb}, Usuario: ${currentUser}`,
  });

  // --- 2. VERIFICACIÓN DE PROVEEDOR DE REPOSITORIOS ---
  console.log("2. Verificando selección de repositorios...");
  const provider = getStorageProvider();
  console.log(`   STORAGE_PROVIDER activo: '${provider}'`);
  const commRepo = getCommercialRepository();
  const authRepo = getAuthRepository();
  const confRepo = getConfigRepository();

  const esPostgresComm = commRepo instanceof PostgresCommercialRepository;
  const esPostgresAuth = authRepo instanceof PostgresAuthRepository;
  const esPostgresConf = confRepo instanceof PostgresConfigRepository;

  if (provider === "postgres" && esPostgresComm && esPostgresAuth && esPostgresConf) {
    resultados.push({
      modulo: "Inyección de Repositorios",
      descripcion: "Uso de PostgresCommercialRepository, PostgresAuthRepository y PostgresConfigRepository",
      resultado: "APROBADO",
      detalles: "Todas las factorías resuelven los repositorios PostgreSQL de forma nativa.",
    });
  } else {
    resultados.push({
      modulo: "Inyección de Repositorios",
      descripcion: "Uso de repositorios PostgreSQL",
      resultado: "FALLIDO",
      detalles: `Provider=${provider}, Comm=${esPostgresComm}, Auth=${esPostgresAuth}, Conf=${esPostgresConf}`,
    });
  }

  // --- 3. MÓDULO CONFIGURACIÓN DEL SISTEMA ---
  console.log("3. Probando módulo de Configuración del Sistema...");
  try {
    const configInicial = await confRepo.obtener();
    await confRepo.guardar({
      ...configInicial,
      empresa: {
        ...configInicial.empresa,
        nombre: `Ferretería Emmanuel (${RUN_TAG})`,
        ruc: "J0310000999999",
      },
      ventas: {
        ...configInicial.ventas,
        diasCreditoMaximo: 45,
      },
    });

    const configGuardada = await confRepo.obtener();
    if (
      configGuardada.empresa.nombre === `Ferretería Emmanuel (${RUN_TAG})` &&
      configGuardada.ventas.diasCreditoMaximo === 45
    ) {
      resultados.push({
        modulo: "Configuración del Sistema",
        descripcion: "Lectura y actualización en configuracion_sistema",
        resultado: "APROBADO",
        detalles: "Configuración guardada y recuperada correctamente desde PostgreSQL.",
      });
    } else {
      throw new Error("La configuración guardada no coincide con los valores actualizados.");
    }
  } catch (err: any) {
    resultados.push({
      modulo: "Configuración del Sistema",
      descripcion: "Persistencia de parámetros institucionales",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 4. MÓDULO USUARIOS Y AUTENTICACIÓN ---
  console.log("4. Probando módulo de Usuarios y Autenticación...");
  const USER_ID = `usr_${RUN_TAG}`;
  const USERNAME = `cajero_${RUN_TAG.toLowerCase()}`;
  try {
    await authRepo.crearOActualizarUsuario({
      id: USER_ID,
      usuario: USERNAME,
      nombre: `Cajero de Pruebas ${RUN_TAG}`,
      rol: "CAJERO",
      clave: "$scrypt$hash_de_prueba",
      activo: true,
    });

    const userBuscado = await authRepo.buscarPorUsuario(USERNAME);
    if (!userBuscado || userBuscado.id !== USER_ID || userBuscado.rol !== "CAJERO") {
      throw new Error("No se pudo recuperar el usuario creado por nombre de usuario.");
    }

    // Actualizar rol y estado
    await authRepo.crearOActualizarUsuario({
      id: USER_ID,
      usuario: USERNAME,
      nombre: `Cajero Promovido ${RUN_TAG}`,
      rol: "ADMINISTRADOR",
      activo: false,
    });

    const userActualizado = await authRepo.buscarPorId(USER_ID);
    if (!userActualizado || userActualizado.rol !== "ADMINISTRADOR" || userActualizado.activo !== false) {
      throw new Error("Fallo al actualizar rol o estado del usuario en PostgreSQL.");
    }

    resultados.push({
      modulo: "Usuarios y Autenticación",
      descripcion: "CRUD de usuarios en usuarios_cuentas",
      resultado: "APROBADO",
      detalles: "Creación, búsqueda por usuario/id y actualización de roles probadas con éxito.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Usuarios y Autenticación",
      descripcion: "Gestión de cuentas y credenciales",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 5. MÓDULO CATÁLOGO E INVENTARIO ---
  console.log("5. Probando módulo de Inventario y Productos...");
  const PROD_ID_1 = `prod_1_${RUN_TAG}`;
  const PROD_ID_2 = `prod_2_${RUN_TAG}`;
  try {
    // Inserción de 2 productos de prueba
    await query(`
      INSERT INTO productos (
        id, codigo, codigo_barras, nombre, marca, unidad_medida,
        inventario_inicial, stock_actual, precio, costo, categoria, activo
      ) VALUES 
        ($1, $2, '7410001', 'Martillo Tubular 16oz TEST', 'Truper', 'UNIDAD', 20, 20, 250.00, 180.00, 'Herramientas', true),
        ($3, $4, '7410002', 'Cemento Portland 42.5kg TEST', 'Canal', 'BOLSA', 100, 100, 380.00, 310.00, 'Construcción', true);
    `, [PROD_ID_1, `MART_${RUN_TAG}`, PROD_ID_2, `CEM_${RUN_TAG}`]);

    // Verificar consulta
    const resProds = await query("SELECT id, stock_actual::float as stock FROM productos WHERE id IN ($1, $2);", [PROD_ID_1, PROD_ID_2]);
    if (resProds.rows.length !== 2) throw new Error("No se insertaron los 2 productos de inventario.");

    // Probar restricción CHECK de no negatividad: intentar poner stock_actual = -5
    let rechazoStockNegativo = false;
    try {
      await query("UPDATE productos SET stock_actual = -5 WHERE id = $1;", [PROD_ID_1]);
    } catch (err: any) {
      if (err.code === "23514" || err.message.includes("check")) {
        rechazoStockNegativo = true;
      }
    }

    if (!rechazoStockNegativo) {
      throw new Error("La restricción CHECK (stock_actual >= 0) no bloqueó la asignación de stock negativo.");
    }

    resultados.push({
      modulo: "Inventario y Productos",
      descripcion: "Catálogo, existencias y restricción CHECK de stock no negativo",
      resultado: "APROBADO",
      detalles: "Inserción, consulta y bloqueo garantizado de existencias negativas (23514).",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Inventario y Productos",
      descripcion: "Catálogo de productos",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 6. MÓDULO CLIENTES Y PROVEEDORES ---
  console.log("6. Probando módulo de Clientes y Proveedores...");
  const CLI_ID = `cli_${RUN_TAG}`;
  const PROV_ID = `prov_${RUN_TAG}`;
  try {
    await query(`
      INSERT INTO clientes (
        id, nombre, telefono, direccion, identificacion, email, tipo, limite_credito, saldo_pendiente, activo
      ) VALUES ($1, $2, '+505 8888-1234', 'Managua, Nicaragua', '001-010190-0001A', 'cliente.test@emmanuel.com', 'EMPRESA', 50000.00, 0.00, true);
    `, [CLI_ID, `Constructora del Norte ${RUN_TAG}`]);

    await query(`
      INSERT INTO proveedores (
        id, nombre, telefono, direccion, identificacion, email, tipo, dias_credito, limite_credito, activo
      ) VALUES ($1, $2, '+505 2222-9999', 'Carretera Norte km 5', 'J031000055555', 'ventas@ferreteriamayorista.ni', 'EMPRESA', 30, 200000.00, true);
    `, [PROV_ID, `Distribuidora Industrial ${RUN_TAG}`]);

    const resCli = await query("SELECT nombre, limite_credito::float as lim FROM clientes WHERE id = $1;", [CLI_ID]);
    const resProv = await query("SELECT nombre, dias_credito FROM proveedores WHERE id = $1;", [PROV_ID]);

    if (resCli.rows[0].lim !== 50000.00 || resProv.rows[0].dias_credito !== 30) {
      throw new Error("Datos de cliente o proveedor no coinciden.");
    }

    resultados.push({
      modulo: "Clientes y Proveedores",
      descripcion: "Altas, términos de crédito y contactos",
      resultado: "APROBADO",
      detalles: "Registros en tablas 'clientes' y 'proveedores' validados con crédito y condiciones.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Clientes y Proveedores",
      descripcion: "Padrón comercial",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 7. MÓDULO COTIZACIONES ---
  console.log("7. Probando módulo de Cotizaciones...");
  const COT_ID = `cot_${RUN_TAG}`;
  try {
    await query(`
      INSERT INTO cotizaciones (
        id, numero, cliente, cliente_id, fecha, fecha_vencimiento, estado, creado_por, subtotal, iva, total
      ) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '15 days', 'EMITIDA', $5, 500.00, 75.00, 575.00);
    `, [COT_ID, `COT-${RUN_TAG}`, `Constructora del Norte ${RUN_TAG}`, CLI_ID, USERNAME]);

    await query(`
      INSERT INTO cotizacion_items (
        id, cotizacion_id, producto_id, cantidad, precio, unidad_medida, costo_unitario, descuento, exento_iva
      ) VALUES ($1, $2, $3, 2, 250.00, 'UNIDAD', 180.00, 0, false);
    `, [`coti_${RUN_TAG}`, COT_ID, PROD_ID_1]);

    const resCot = await query("SELECT total::float as tot FROM cotizaciones WHERE id = $1;", [COT_ID]);
    if (resCot.rows[0].tot !== 575.00) throw new Error("Total de cotización erróneo.");

    resultados.push({
      modulo: "Cotizaciones",
      descripcion: "Creación de cotización con líneas y vencimiento",
      resultado: "APROBADO",
      detalles: "Cabecera y detalle de cotización almacenados con cálculo de impuestos.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Cotizaciones",
      descripcion: "Gestión de propuestas",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 8. MÓDULO COMPRAS Y CUENTAS POR PAGAR ---
  console.log("8. Probando módulo de Compras y Cuentas por Pagar...");
  const COMPRA_ID = `cmp_${RUN_TAG}`;
  const PAGO_ID = `pgo_${RUN_TAG}`;
  try {
    // Registrar compra a crédito
    await query(`
      INSERT INTO compras (
        id, numero, factura_proveedor, proveedor_id, proveedor, fecha, creado_por,
        condicion_pago, forma_pago, dias_credito, saldo_pendiente, estado_pago,
        subtotal, iva, total, stock_aplicado
      ) VALUES (
        $1, $2, 'FAC-PROV-9988', $3, $4, NOW(), $5,
        'CREDITO', 'TRANSFERENCIA', 30, 31000.00, 'PENDIENTE',
        31000.00, 0.00, 31000.00, true
      );
    `, [COMPRA_ID, `CMP-${RUN_TAG}`, PROV_ID, `Distribuidora Industrial ${RUN_TAG}`, USERNAME]);

    // Línea de compra: 100 bolsas de cemento
    await query(`
      INSERT INTO compra_items (
        id, compra_id, producto_id, cantidad, precio, unidad_medida, costo_unitario, exento_iva
      ) VALUES ($1, $2, $3, 100, 310.00, 'BOLSA', 310.00, true);
    `, [`cmpi_${RUN_TAG}`, COMPRA_ID, PROD_ID_2]);

    // Registrar abono parcial de C$ 11,000.00
    await query(`
      INSERT INTO pagos_compra (
        id, numero, compra_id, proveedor_id, fecha, monto, forma_pago, referencia, creado_por
      ) VALUES ($1, $2, $3, $4, NOW(), 11000.00, 'TRANSFERENCIA', 'TRANSF-BAC-887766', $5);
    `, [PAGO_ID, `PAG-${RUN_TAG}`, COMPRA_ID, PROV_ID, USERNAME]);

    // Actualizar saldo de la compra a C$ 20,000.00
    await query(`
      UPDATE compras SET saldo_pendiente = saldo_pendiente - 11000.00, estado_pago = 'PARCIAL' WHERE id = $1;
    `, [COMPRA_ID]);

    const resCmp = await query("SELECT saldo_pendiente::float as saldo, estado_pago FROM compras WHERE id = $1;", [COMPRA_ID]);
    if (resCmp.rows[0].saldo !== 20000.00 || resCmp.rows[0].estado_pago !== "PARCIAL") {
      throw new Error("El saldo pendiente de la compra no se calculó adecuadamente.");
    }

    resultados.push({
      modulo: "Compras y Cuentas por Pagar",
      descripcion: "Compra a crédito, detalle de artículos y abono parcial",
      resultado: "APROBADO",
      detalles: "Registro en 'compras', 'compra_items' y 'pagos_compra' con amortización de saldo.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Compras y Cuentas por Pagar",
      descripcion: "Circuito de abastecimiento",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 9. MÓDULO CAJA Y TURNOS ---
  console.log("9. Probando módulo de Caja y Turnos...");
  const TURNO_ID = `trn_${RUN_TAG}`;
  const MOV_CAJA_ID = `mcaj_${RUN_TAG}`;
  try {
    await query(`
      INSERT INTO turnos_caja (
        id, numero, usuario, fecha_apertura, monto_inicial, total_ventas_efectivo, estado
      ) VALUES ($1, $2, $3, NOW(), 1500.00, 0.00, 'ABIERTO');
    `, [TURNO_ID, `TUR-${RUN_TAG}`, USERNAME]);

    await query(`
      INSERT INTO movimientos_caja (
        id, turno_caja_id, tipo, monto, concepto, fecha, usuario
      ) VALUES ($1, $2, 'INGRESO', 300.00, 'Fondo de cambio extra TEST', NOW(), $3);
    `, [MOV_CAJA_ID, TURNO_ID, USERNAME]);

    const resTrn = await query("SELECT monto_inicial::float as ini, estado FROM turnos_caja WHERE id = $1;", [TURNO_ID]);
    if (resTrn.rows[0].ini !== 1500.00 || resTrn.rows[0].estado !== "ABIERTO") {
      throw new Error("El turno de caja no se abrió correctamente.");
    }

    resultados.push({
      modulo: "Caja y Turnos",
      descripcion: "Apertura de turno y movimientos de efectivo",
      resultado: "APROBADO",
      detalles: "Turno y movimientos de caja vinculados mediante clave foránea.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Caja y Turnos",
      descripcion: "Gestión de mostrador",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 10. MÓDULO VENTAS Y FACTURACIÓN TRANSACCIONAL ---
  console.log("10. Probando módulo de Facturación Comercial con Bloqueo e Idempotencia...");
  let FACTURA_ID = "";
  const IDEMP_KEY = `IDEMP_${RUN_TAG}`;
  try {
    // Ejecutar mediante runTransaction() nativo de PostgresCommercialRepository
    await commRepo.runTransaction(async (txRepo) => {
      FACTURA_ID = await txRepo.emitirFactura({
        cliente: `Constructora del Norte ${RUN_TAG}`,
        clienteId: CLI_ID,
        cotizacionId: COT_ID,
        creadoPor: USERNAME,
        origen: "CAJA",
        formaPago: "EFECTIVO",
        montoRecibido: 1000.00,
        items: [
          {
            productoId: PROD_ID_1,
            cantidad: 2,
            precio: 250.00, // 2 * 250 = 500 + 15% IVA = 575
          },
        ],
        claveIdempotencia: IDEMP_KEY,
      });
    });

    // Validar descuento de stock: de 20 a 18
    const resStock = await query("SELECT stock_actual::float as stock FROM productos WHERE id = $1;", [PROD_ID_1]);
    if (resStock.rows[0].stock !== 18) throw new Error(`Stock no descontado: esperado 18, actual ${resStock.rows[0].stock}`);

    // Validar Kárdex
    const resKardex = await query("SELECT id, salidas::float as sal, tipo FROM kardex_movimientos WHERE producto_id = $1;", [PROD_ID_1]);
    if (resKardex.rows.length === 0 || resKardex.rows[0].sal !== 2) throw new Error("Movimiento de Kárdex de venta ausente.");

    // Validar Cotización convertida a FACTURADA
    const resCotConv = await query("SELECT estado, factura_id FROM cotizaciones WHERE id = $1;", [COT_ID]);
    if (resCotConv.rows[0].estado !== "FACTURADA" || resCotConv.rows[0].factura_id !== FACTURA_ID) {
      throw new Error("La cotización no transicionó a FACTURADA.");
    }

    // Validar Idempotencia
    let facturaIdReintento = "";
    await commRepo.runTransaction(async (txRepo) => {
      facturaIdReintento = await txRepo.emitirFactura({
        cliente: `Constructora del Norte ${RUN_TAG}`,
        clienteId: CLI_ID,
        cotizacionId: COT_ID,
        creadoPor: USERNAME,
        origen: "CAJA",
        formaPago: "EFECTIVO",
        montoRecibido: 1000.00,
        items: [{ productoId: PROD_ID_1, cantidad: 2, precio: 250.00 }],
        claveIdempotencia: IDEMP_KEY,
      });
    });

    if (facturaIdReintento !== FACTURA_ID) throw new Error("Fallo de idempotencia: generó una segunda factura.");
    const resStockIdemp = await query("SELECT stock_actual::float as stock FROM productos WHERE id = $1;", [PROD_ID_1]);
    if (resStockIdemp.rows[0].stock !== 18) throw new Error("Doble descuento de stock en reintento de venta idéntico.");

    resultados.push({
      modulo: "Ventas y POS Transaccional",
      descripcion: "Emisión de factura, Kárdex, stock, caja y clave de idempotencia única",
      resultado: "APROBADO",
      detalles: "Operación atómica confirmada en PostgreSQL. Cero doble descuento en reintentos.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Ventas y POS Transaccional",
      descripcion: "Facturación comercial",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 11. MÓDULO SOLICITUDES Y ACTAS DE BODEGA ---
  console.log("11. Probando módulo de Requisiciones y Actas de Bodega...");
  const OFI_ID = `ofi_${RUN_TAG}`;
  const SOL_ID = `sol_${RUN_TAG}`;
  const ACTA_ID = `acta_${RUN_TAG}`;
  try {
    await query(`
      INSERT INTO oficinas (id, nombre, tipo) VALUES ($1, $2, 'DEPENDENCIA');
    `, [OFI_ID, `Dirección de Obras Públicas ${RUN_TAG}`]);

    await query(`
      INSERT INTO solicitudes (
        id, numero, estado, solicitante, oficina_id, destinatario, observaciones, fecha, creado_por
      ) VALUES ($1, $2, 'APROBADO', 'Ing. Carlos Mendoza', $3, 'Bodega de Mantenimiento', 'Para bacheo este', NOW(), $4);
    `, [SOL_ID, `REQ-${RUN_TAG}`, OFI_ID, USERNAME]);

    await query(`
      INSERT INTO solicitud_items (id, solicitud_id, producto_id, cantidad, unidad_medida)
      VALUES ($1, $2, $3, 10, 'BOLSA');
    `, [`soli_${RUN_TAG}`, SOL_ID, PROD_ID_2]);

    await query(`
      INSERT INTO actas (
        id, numero, solicitud_id, oficina_id, destinatario, fecha, concepto, ejecutada
      ) VALUES ($1, $2, $3, $4, 'Ing. Carlos Mendoza', NOW(), 'Entrega formal de materiales', true);
    `, [ACTA_ID, `ACT-${RUN_TAG}`, SOL_ID, OFI_ID]);

    await query(`
      INSERT INTO acta_items (id, acta_id, producto_id, cantidad, unidad_medida, observacion)
      VALUES ($1, $2, $3, 10, 'BOLSA', 'Conforme en obra');
    `, [`actai_${RUN_TAG}`, ACTA_ID, PROD_ID_2]);

    const resActa = await query("SELECT ejecutada FROM actas WHERE id = $1;", [ACTA_ID]);
    if (!resActa.rows[0].ejecutada) throw new Error("Acta de entrega no registrada como ejecutada.");

    resultados.push({
      modulo: "Bodega Institucional (Solicitudes y Actas)",
      descripcion: "Flujo de requisición, aprobación y acta de entrega formal",
      resultado: "APROBADO",
      detalles: "Tablas 'oficinas', 'solicitudes', 'solicitud_items', 'actas' y 'acta_items' vinculadas.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Bodega Institucional (Solicitudes y Actas)",
      descripcion: "Requisiciones institucionales",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 12. MÓDULO REPORTES Y AUDITORÍA ---
  console.log("12. Probando módulo de Reportes Consolidados y Auditoría JSONB...");
  const AUDIT_ID = `aud_${RUN_TAG}`;
  try {
    // Inserción de log de auditoría
    await query(`
      INSERT INTO auditoria_logs (
        id, usuario, modulo, accion, entidad, entidad_id, detalles, creado_en
      ) VALUES ($1, $2, 'VENTAS', 'EMITIR_FACTURA', 'facturas', $3, $4::jsonb, NOW());
    `, [
      AUDIT_ID,
      USERNAME,
      FACTURA_ID,
      JSON.stringify({
        total: 575.00,
        cliente: `Constructora del Norte ${RUN_TAG}`,
        itemsCount: 1,
        ip: "127.0.0.1",
      }),
    ]);

    // Consultar reporte de ventas del día por agregación SQL
    const repVentas = await query(`
      SELECT 
        COUNT(id) as total_facturas,
        COALESCE(SUM(total), 0)::float as total_monto,
        COALESCE(SUM(iva), 0)::float as total_iva
      FROM facturas
      WHERE fecha >= CURRENT_DATE;
    `);

    // Consultar valoración de inventario
    const repInventario = await query(`
      SELECT 
        COUNT(id) as total_articulos,
        COALESCE(SUM(stock_actual * costo), 0)::float as valor_total_costo
      FROM productos;
    `);

    // Consultar log de auditoría
    const auditRes = await query("SELECT modulo, detalles->>'total' as total_log FROM auditoria_logs WHERE id = $1;", [AUDIT_ID]);

    if (
      repVentas.rows[0].total_monto < 575.00 ||
      repInventario.rows[0].valor_total_costo <= 0 ||
      auditRes.rows[0].total_log !== "575"
    ) {
      throw new Error("Los reportes consolidados o el log de auditoría JSONB fallaron en su cálculo.");
    }

    resultados.push({
      modulo: "Reportes y Auditoría",
      descripcion: "Agregaciones SQL y registro estructurado JSONB en auditoria_logs",
      resultado: "APROBADO",
      detalles: "Cálculos matemáticos de balance, valoración de existencias y trazabilidad JSONB verificados.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Reportes y Auditoría",
      descripcion: "Reportes financieros e inventario",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 13. COMPROBACIÓN DE PERSISTENCIA ENTRE NUEVAS CONEXIONES ---
  console.log("13. Comprobando persistencia real tras cerrar y reabrir conexión...");
  try {
    await closePool(); // Cerrar el pool actual por completo
    const nuevoPool = getPool(); // Abrir nueva conexión fresca
    const checkFresh = await nuevoPool.query("SELECT id, stock_actual::float as stock FROM productos WHERE id = $1;", [PROD_ID_1]);

    if (checkFresh.rows.length === 0 || checkFresh.rows[0].stock !== 18) {
      throw new Error("Los datos no persistieron tras reiniciar la conexión a PostgreSQL.");
    }

    resultados.push({
      modulo: "Persistencia Real en Neon",
      descripcion: "Recuperación de datos tras desconexión completa y nuevo pool TCP",
      resultado: "APROBADO",
      detalles: "Persistencia física en almacenamiento remoto de Neon confirmada.",
    });
  } catch (err: any) {
    resultados.push({
      modulo: "Persistencia Real en Neon",
      descripcion: "Durabilidad de transacciones",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  // --- 14. LIMPIEZA TOTAL DE DATOS FICTICIOS RESPETANDO RELACIONES ---
  console.log("\n14. Ejecutando limpieza relacional completa de datos ficticios...");
  const p = getPool();
  try {
    // Orden estricto de eliminación para no violar Foreign Keys
    await p.query("DELETE FROM auditoria_logs WHERE id = $1;", [AUDIT_ID]);
    await p.query("DELETE FROM acta_items WHERE acta_id = $1;", [ACTA_ID]);
    await p.query("DELETE FROM actas WHERE id = $1;", [ACTA_ID]);
    await p.query("DELETE FROM solicitud_items WHERE solicitud_id = $1;", [SOL_ID]);
    await p.query("DELETE FROM solicitudes WHERE id = $1;", [SOL_ID]);
    await p.query("DELETE FROM oficinas WHERE id = $1;", [OFI_ID]);

    if (FACTURA_ID) {
      await p.query("DELETE FROM factura_items WHERE factura_id = $1;", [FACTURA_ID]);
      await p.query("DELETE FROM facturas WHERE id = $1;", [FACTURA_ID]);
    }

    await p.query("DELETE FROM cotizacion_items WHERE cotizacion_id = $1;", [COT_ID]);
    await p.query("DELETE FROM cotizaciones WHERE id = $1;", [COT_ID]);

    await p.query("DELETE FROM pagos_compra WHERE id = $1;", [PAGO_ID]);
    await p.query("DELETE FROM compra_items WHERE compra_id = $1;", [COMPRA_ID]);
    await p.query("DELETE FROM compras WHERE id = $1;", [COMPRA_ID]);

    await p.query("DELETE FROM kardex_movimientos WHERE producto_id IN ($1, $2);", [PROD_ID_1, PROD_ID_2]);
    await p.query("DELETE FROM movimientos_caja WHERE turno_caja_id = $1;", [TURNO_ID]);
    await p.query("DELETE FROM turnos_caja WHERE id = $1;", [TURNO_ID]);

    await p.query("DELETE FROM productos WHERE id IN ($1, $2);", [PROD_ID_1, PROD_ID_2]);
    await p.query("DELETE FROM clientes WHERE id = $1;", [CLI_ID]);
    await p.query("DELETE FROM proveedores WHERE id = $1;", [PROV_ID]);
    await p.query("DELETE FROM usuarios_cuentas WHERE id = $1;", [USER_ID]);

    // Restaurar nombre original de la empresa en configuracion_sistema
    await p.query("UPDATE configuracion_sistema SET nombre_empresa = 'Ferretería Emmanuel' WHERE id = 'config_general';");

    // Verificar conteos en 0
    const conCheck = await p.query(`
      SELECT 
        (SELECT COUNT(*) FROM productos) as productos,
        (SELECT COUNT(*) FROM facturas) as facturas,
        (SELECT COUNT(*) FROM compras) as compras,
        (SELECT COUNT(*) FROM cotizaciones) as cotizaciones,
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM proveedores) as proveedores,
        (SELECT COUNT(*) FROM turnos_caja) as turnos,
        (SELECT COUNT(*) FROM solicitudes) as solicitudes,
        (SELECT COUNT(*) FROM actas) as actas,
        (SELECT COUNT(*) FROM kardex_movimientos) as kardex,
        (SELECT COUNT(*) FROM auditoria_logs) as auditoria;
    `);

    const counts = conCheck.rows[0];
    const residualTotal = Object.values(counts).reduce((acc: number, val: any) => acc + Number(val), 0);

    if (residualTotal === 0) {
      resultados.push({
        modulo: "Limpieza Relacional de Datos",
        descripcion: "Purgado ordenado de registros TEST sin violar restricciones de clave foránea",
        resultado: "APROBADO",
        detalles: "Conteo residual verificado: 0 registros en todas las tablas transaccionales.",
      });
    } else {
      throw new Error(`Quedaron ${residualTotal} registros residuales en la base de datos: ${JSON.stringify(counts)}`);
    }
  } catch (err: any) {
    resultados.push({
      modulo: "Limpieza Relacional de Datos",
      descripcion: "Eliminación de datos TEST",
      resultado: "FALLIDO",
      detalles: err.message,
    });
  }

  await closePool();

  console.log("\n============================================================================");
  console.log("RESUMEN DE RESULTADOS DE LA PRUEBA INTEGRAL");
  console.log("============================================================================\n");
  resultados.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.resultado}] ${r.modulo}: ${r.descripcion}`);
    console.log(`   -> ${r.detalles}`);
  });

  const totalAprobadas = resultados.filter((r) => r.resultado === "APROBADO").length;
  const totalFallidas = resultados.filter((r) => r.resultado === "FALLIDO").length;
  console.log(`\nTotal Pruebas: ${resultados.length} | Aprobadas: ${totalAprobadas} | Fallidas: ${totalFallidas}`);
}

ejecutarPruebaIntegral().catch(async (e) => {
  console.error("ERROR NO CONTROLADO EN PRUEBA INTEGRAL:", e);
  try {
    const { closePool } = await import("@/lib/repositories/postgres/client");
    await closePool();
  } catch {}
  process.exit(1);
});
