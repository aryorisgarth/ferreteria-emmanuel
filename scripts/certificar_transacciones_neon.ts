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

async function certificar() {
  const { getPool, getTransactionalClient, closePool } = await import("@/lib/repositories/postgres/client");
  const { PostgresCommercialRepository } = await import("@/lib/repositories/postgres/postgres-commercial-repository");

  console.log("============================================================================");
  console.log("FERRETERÍA EMMANUEL — CERTIFICACIÓN DE TRANSACCIONES REALES EN NEON");
  console.log("============================================================================\n");

  const pool = getPool();

  // --- VALIDACIÓN 1: Base de datos emmanuel_test ---
  console.log("1. Verificando conexión exclusiva con 'emmanuel_test'...");
  const dbCheck = await pool.query("SELECT current_database(), current_user;");
  const activeDb = dbCheck.rows[0].current_database;
  const activeUser = dbCheck.rows[0].current_user;

  console.log(`   Base conectada: '${activeDb}'`);
  console.log(`   Usuario:        '${activeUser}'`);

  if (activeDb !== "emmanuel_test") {
    console.error("ERROR CRÍTICO: La base no es 'emmanuel_test'. Abortando inmediatamente.");
    process.exit(1);
  }
  console.log("   -> APROBADO: Conexión exclusiva con emmanuel_test.\n");

  const repo = new PostgresCommercialRepository();

  // Prefijo identificador para datos TEST
  const RUN_ID = Date.now().toString().slice(-6);
  const TEST_PROD_1 = `TEST_PROD_A_${RUN_ID}`;
  const TEST_PROD_ROLLBACK = `TEST_PROD_RB_${RUN_ID}`;
  const TEST_CLI_1 = `TEST_CLI_${RUN_ID}`;
  const TEST_TURNO_1 = `TEST_TRN_${RUN_ID}`;
  const IDEMP_KEY = `TEST_IDEMP_${RUN_ID}`;

  // --- VALIDACIÓN 2: Transacción Real con COMMIT ---
  console.log("2. Probando transacción real ACID con COMMIT...");
  await repo.runTransaction(async (txRepo) => {
    // Insertar producto TEST
    await (txRepo as any).executor.query(`
      INSERT INTO productos (
        id, codigo, nombre, unidad_medida, inventario_inicial, stock_actual, precio, costo, activo
      ) VALUES ($1, $2, $3, 'UNIDAD', 50, 50, 120.00, 80.00, true);
    `, [TEST_PROD_1, `COD_A_${RUN_ID}`, `Producto de Prueba A ${RUN_ID}`]);

    // Insertar cliente TEST
    await (txRepo as any).executor.query(`
      INSERT INTO clientes (
        id, nombre, telefono, direccion, tipo, activo
      ) VALUES ($1, $2, '+505 8888-0000', 'Dirección de Prueba TEST', 'PARTICULAR', true);
    `, [TEST_CLI_1, `Cliente TEST ${RUN_ID}`]);
  });

  // Verificar persistencia post-COMMIT
  const verifyCommit = await pool.query(
    "SELECT id, stock_actual::float as stock FROM productos WHERE id = $1;",
    [TEST_PROD_1]
  );
  if (verifyCommit.rows.length === 0 || verifyCommit.rows[0].stock !== 50) {
    throw new Error("Fallo en verificación de COMMIT: El producto TEST no persistió.");
  }
  console.log("   -> APROBADO: La transacción confirmó e hizo COMMIT real y persistente.\n");

  // --- VALIDACIÓN 3: Transacción Real con ROLLBACK ante Fallo ---
  console.log("3. Probando transacción real ACID con ROLLBACK ante error simulado...");
  let rollbackOcurrio = false;
  try {
    await repo.runTransaction(async (txRepo) => {
      // Modificar producto A
      await (txRepo as any).executor.query(
        "UPDATE productos SET stock_actual = 999 WHERE id = $1;",
        [TEST_PROD_1]
      );

      // Insertar nuevo producto que no debe persistir
      await (txRepo as any).executor.query(`
        INSERT INTO productos (
          id, codigo, nombre, unidad_medida, stock_actual, precio, costo, activo
        ) VALUES ($1, $2, 'NO DEBE EXISTIR', 'UNIDAD', 10, 50, 30, true);
      `, [TEST_PROD_ROLLBACK, `COD_RB_${RUN_ID}`]);

      // Provocar excepción controlada
      throw new Error("SIMULATED_TRANSACTION_FAILURE");
    });
  } catch (err: any) {
    if (err.message === "SIMULATED_TRANSACTION_FAILURE") {
      rollbackOcurrio = true;
    } else {
      throw err;
    }
  }

  if (!rollbackOcurrio) {
    throw new Error("No se capturó la excepción de prueba.");
  }

  // Verificar que el ROLLBACK revirtió TODO
  const verifyRollbackProd = await pool.query(
    "SELECT id FROM productos WHERE id = $1;",
    [TEST_PROD_ROLLBACK]
  );
  if (verifyRollbackProd.rows.length > 0) {
    throw new Error("CRÍTICO: El producto insertado durante la transacción fallida NO fue revertido.");
  }

  const verifyRollbackStock = await pool.query(
    "SELECT stock_actual::float as stock FROM productos WHERE id = $1;",
    [TEST_PROD_1]
  );
  if (verifyRollbackStock.rows[0].stock !== 50) {
    throw new Error(`CRÍTICO: El stock modificado no se revirtió a 50 (actual: ${verifyRollbackStock.rows[0].stock}).`);
  }
  console.log("   -> APROBADO: ROLLBACK real y efectivo; todos los cambios fallidos fueron revertidos.\n");

  // --- VALIDACIÓN 4: Bloqueo Pesimista SELECT ... FOR UPDATE ---
  console.log("4. Probando concurrencia y bloqueo pesimista (SELECT ... FOR UPDATE)...");
  const tx1 = await getTransactionalClient();
  const tx2 = await getTransactionalClient();

  try {
    // TX1 adquiere lock exclusivo sobre TEST_PROD_1
    await tx1.query("SELECT id FROM productos WHERE id = $1 FOR UPDATE;", [TEST_PROD_1]);
    console.log("   * Transacción 1 adquirió bloqueo exclusivo (FOR UPDATE) sobre el producto TEST.");

    // TX2 intenta adquirir lock inmediato sobre el mismo producto con NOWAIT
    let lockBloqueado = false;
    try {
      await tx2.query("SELECT id FROM productos WHERE id = $1 FOR UPDATE NOWAIT;", [TEST_PROD_1]);
    } catch (err: any) {
      if (err.code === "55P03" || err.message.includes("could not obtain lock")) {
        lockBloqueado = true;
        console.log("   * Transacción 2 fue bloqueada correctamente por PostgreSQL (55P03: lock_not_available).");
      } else {
        throw err;
      }
    }

    if (!lockBloqueado) {
      throw new Error("CRÍTICO: SELECT ... FOR UPDATE no bloqueó a la transacción concurrente.");
    }

    await tx1.commit();
    await tx2.rollback();
    console.log("   -> APROBADO: Bloqueo pesimista FOR UPDATE validado con aislamiento de concurrencia real.\n");
  } finally {
    tx1.release();
    tx2.release();
  }

  // --- VALIDACIÓN 5: Emisión de Factura Transaccional e Idempotencia Real ---
  console.log("5. Probando emisión de factura comercial transaccional e idempotencia...");
  // Crear turno de caja TEST
  await pool.query(`
    INSERT INTO turnos_caja (
      id, numero, usuario, fecha_apertura, monto_inicial, estado
    ) VALUES ($1, $2, 'cajero_test', NOW(), 1000.00, 'ABIERTO');
  `, [TEST_TURNO_1, `TRN-${RUN_ID}`]);

  // Emitir factura dentro de transacción real
  let facturaId1 = "";
  await repo.runTransaction(async (txRepo) => {
    facturaId1 = await txRepo.emitirFactura({
      cliente: `Cliente TEST ${RUN_ID}`,
      clienteId: TEST_CLI_1,
      creadoPor: "cajero_test",
      origen: "CAJA",
      formaPago: "EFECTIVO",
      items: [
        {
          productoId: TEST_PROD_1,
          cantidad: 5,
          precio: 120.00,
        },
      ],
      claveIdempotencia: IDEMP_KEY,
    });
  });

  console.log(`   * Factura emitida transaccionalmente con ID: ${facturaId1}`);

  // Verificar descuento de existencias (50 - 5 = 45)
  const stockVenta = await pool.query(
    "SELECT stock_actual::float as stock FROM productos WHERE id = $1;",
    [TEST_PROD_1]
  );
  if (stockVenta.rows[0].stock !== 45) {
    throw new Error(`Stock no descontado correctamente: esperado 45, actual ${stockVenta.rows[0].stock}`);
  }

  // Verificar Kárdex
  const kardexMov = await pool.query(
    "SELECT id, cantidad::float as cant, tipo FROM kardex_movimientos WHERE producto_id = $1;",
    [TEST_PROD_1]
  );
  if (kardexMov.rows.length === 0 || kardexMov.rows[0].cant !== 5) {
    throw new Error("Movimiento de Kárdex no registrado.");
  }

  // Probar Idempotencia: Reintentar exactamente la misma venta
  console.log("   * Reintentando misma operación con la misma clave de idempotencia...");
  let facturaId2 = "";
  await repo.runTransaction(async (txRepo) => {
    facturaId2 = await txRepo.emitirFactura({
      cliente: `Cliente TEST ${RUN_ID}`,
      clienteId: TEST_CLI_1,
      creadoPor: "cajero_test",
      origen: "CAJA",
      formaPago: "EFECTIVO",
      items: [
        {
          productoId: TEST_PROD_1,
          cantidad: 5,
          precio: 120.00,
        },
      ],
      claveIdempotencia: IDEMP_KEY,
    });
  });

  if (facturaId1 !== facturaId2) {
    throw new Error(`Idempotencia falló: se generó una factura diferente (${facturaId1} vs ${facturaId2})`);
  }

  // Confirmar que el stock NO se descontó una segunda vez (debe seguir en 45)
  const stockIdemp = await pool.query(
    "SELECT stock_actual::float as stock FROM productos WHERE id = $1;",
    [TEST_PROD_1]
  );
  if (stockIdemp.rows[0].stock !== 45) {
    throw new Error(`Doble descuento por falta de idempotencia: stock actual ${stockIdemp.rows[0].stock}`);
  }
  console.log("   -> APROBADO: Facturación atómica e Idempotencia garantizadas en base de datos.\n");

  // --- VALIDACIÓN 6: Limpieza Total de Registros TEST ---
  console.log("6. Limpiando todos los registros TEST de 'emmanuel_test'...");
  await pool.query("DELETE FROM factura_items WHERE factura_id = $1;", [facturaId1]);
  await pool.query("DELETE FROM facturas WHERE id = $1;", [facturaId1]);
  await pool.query("DELETE FROM kardex_movimientos WHERE producto_id = $1;", [TEST_PROD_1]);
  await pool.query("DELETE FROM movimientos_caja WHERE turno_caja_id = $1;", [TEST_TURNO_1]);
  await pool.query("DELETE FROM turnos_caja WHERE id = $1;", [TEST_TURNO_1]);
  await pool.query("DELETE FROM productos WHERE id = $1;", [TEST_PROD_1]);
  await pool.query("DELETE FROM clientes WHERE id = $1;", [TEST_CLI_1]);

  // Verificar conteo total de todas las tablas
  const cleanCheck = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM facturas) as facturas,
      (SELECT COUNT(*) FROM factura_items) as items,
      (SELECT COUNT(*) FROM productos) as productos,
      (SELECT COUNT(*) FROM clientes) as clientes,
      (SELECT COUNT(*) FROM turnos_caja) as turnos,
      (SELECT COUNT(*) FROM kardex_movimientos) as kardex;
  `);

  console.log("   Conteo final en emmanuel_test:", cleanCheck.rows[0]);
  const sum = Object.values(cleanCheck.rows[0]).reduce((a: any, b: any) => Number(a) + Number(b), 0);
  if (sum !== 0) {
    throw new Error("Quedaron registros residuales en emmanuel_test.");
  }

  console.log("   -> APROBADO: Base de datos emmanuel_test 100% limpia (0 registros residuales).\n");
  console.log("============================================================================");
  console.log("TODAS LAS PRUEBAS DE TRANSACCIONALIDAD Y CONCURRENCIA FUERON SUPERADAS");
  console.log("============================================================================");

  await closePool();
}

certificar().catch(async (e) => {
  console.error("ERROR EN CERTIFICACIÓN:", e);
  try {
    const { closePool } = await import("@/lib/repositories/postgres/client");
    await closePool();
  } catch {}
  process.exit(1);
});
