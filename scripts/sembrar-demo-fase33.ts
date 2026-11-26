/**
 * ============================================================================
 * FERRETERÍA EMMANUEL — SEMBRADO DE DATOS SINTÉTICOS PARA DEMOSTRACIÓN MANUAL
 * Entorno: Exclusivamente PostgreSQL 16 Aislado (ferreteria_fase31_test)
 * ============================================================================
 */

import { getPool } from "../src/lib/repositories/postgres/client";
import { PostgresCommercialRepository } from "../src/lib/repositories/postgres/postgres-commercial-repository";
import { hashModerno } from "../src/lib/crypto-pass";

async function main() {
  process.env.DATABASE_URL = "postgres://ferreteria_user:ferreteria_pass@localhost:5432/ferreteria_fase31_test";
  process.env.AUTH_SECRET = "clave_secreta_super_segura_de_al_menos_32_caracteres_ferreteria_emmanuel";

  // Verificación de seguridad: Garantizar que no sea Neon
  if (process.env.DATABASE_URL.includes("neon.tech")) {
    throw new Error("ALERTA CRÍTICA: Intento de sembrar datos en Neon. Abortando inmediatamente.");
  }

  console.log("================================================================================");
  console.log("SEMBRANDO DATOS SINTÉTICOS EN POSTGRESQL AISLADO LOCAL (ferreteria_fase31_test)");
  console.log("================================================================================");

  const pool = getPool();
  const repo = new PostgresCommercialRepository(pool);

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      await client.query("SET session_replication_role = 'replica';");

      // Limpiar tablas para un entorno demo limpio y consistente
      await client.query(`
        TRUNCATE TABLE 
          movimientos_caja,
          turnos_caja,
          kardex_movimientos,
          operaciones_pendientes_transferencia,
          autorizaciones_operaciones,
          factura_items,
          facturas,
          cotizacion_items,
          cotizaciones,
          productos,
          clientes,
          usuarios_cuentas
        CASCADE;
      `);

      await client.query("SET session_replication_role = 'origin';");

      // 1. USUARIOS DEL SISTEMA
      console.log("1. Insertando usuarios de demostración (admin, cajero, vendedor, bodega)...");
      const hashAdmin = hashModerno("admin123");
      const hashCaja = hashModerno("caja123");
      const hashVendedor = hashModerno("venta123");
      const hashBodega = hashModerno("bodega123");

      await client.query(`
        INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo)
        VALUES 
          ('usr_admin_demo', 'admin', 'Don Emmanuel (Dueño)', 'admin', $1, true),
          ('usr_cajero_demo', 'cajero', 'María Gómez (Cajera Mostrador)', 'cajero', $2, true),
          ('usr_vendedor_demo', 'vendedor', 'Carlos Mendoza (Vendedor)', 'vendedor', $3, true),
          ('usr_bodega_demo', 'bodega', 'José Altamirano (Bodeguero)', 'bodega', $4, true);
      `, [hashAdmin, hashCaja, hashVendedor, hashBodega]);

      // 2. CLIENTES SINTÉTICOS
      console.log("2. Insertando clientes sintéticos...");
      await client.query(`
        INSERT INTO clientes (id, nombre, identificacion, telefono, direccion, limite_credito, saldo_pendiente, activo)
        VALUES 
          ('cli_contado', 'Cliente Ocasional (Contado)', '000-000000-0000A', '2222-0000', 'Mostrador Central', 0.00, 0.00, true),
          ('cli_corp_01', 'Constructora Santa Fe S.A.', 'J0310000123456', '8888-1234', 'Carretera Norte Km 9', 75000.00, 15000.00, true),
          ('cli_taller_02', 'Taller y Soldaduras San Jerónimo', 'J0310000789012', '8765-4321', 'Bo. Monseñor Lezcano', 15000.00, 3200.00, true),
          ('cli_inactivo_03', 'Servicios Industriales La Paz (Inactivo)', 'J0310000999999', '8999-0000', 'Tipitapa', 5000.00, 0.00, false);
      `);

      // 3. PRODUCTOS DEL CATÁLOGO
      console.log("3. Insertando catálogo de productos...");
      await client.query(`
        INSERT INTO productos (id, codigo, codigo_barras, nombre, marca, categoria, unidad_medida, precio, costo, stock_actual, stock_minimo, activo)
        VALUES 
          ('prod_cem', 'CEM-001', '743000123401', 'Cemento Canal Gris Especial 42.5kg', 'Canal', 'Materiales de Construcción', 'BOLSA', 380.00, 320.00, 150, 20, true),
          ('prod_var', 'VAR-002', '743000123402', 'Varilla Corrugada Grado 40 3/8"', 'Aceros de Nicaragua', 'Hierro y Acero', 'UNIDAD', 210.00, 175.00, 300, 50, true),
          ('prod_cal', 'CAL-003', '743000123403', 'Cal Hidratada El Guanacaste 20kg', 'El Guanacaste', 'Materiales de Construcción', 'BOLSA', 115.00, 85.00, 80, 15, true),
          ('prod_ant', 'PIN-004', '743000123404', 'Pintura Anticorrosiva Gris Corona 1 Galón', 'Corona', 'Pinturas y Químicos', 'GALON', 460.00, 340.00, 45, 10, true),
          ('prod_bro', 'BRO-005', '743000123405', 'Brocha Profesional para Pintar 3"', 'Atlas', 'Herramientas', 'UNIDAD', 95.00, 60.00, 60, 12, true),
          ('prod_mar', 'HER-006', '743000123406', 'Martillo Uña Curva Stanley 16oz Mango Fibra', 'Stanley', 'Herramientas', 'UNIDAD', 320.00, 230.00, 25, 5, true),
          ('prod_tub', 'FON-007', '743000123407', 'Tubo PVC Sanitario 2" x 6m Durman', 'Durman', 'Fontanería', 'TUBO', 245.00, 180.00, 70, 15, true),
          ('prod_int', 'ELE-008', '743000123408', 'Interruptor Simple Bticino Modus', 'Bticino', 'Electricidad', 'UNIDAD', 85.00, 52.00, 110, 20, true);
      `);

      // 4. TURNO DE CAJA ABIERTO PARA EL CAJERO
      console.log("4. Creando turno de caja ABIERTO para cajero (María Gómez)...");
      await client.query(`
        INSERT INTO turnos_caja (id, numero, usuario, fecha_apertura, monto_inicial, total_ventas_efectivo, estado)
        VALUES ('turno_demo_01', 'TC-2026-0001', 'cajero', NOW(), 1500.00, 0.00, 'ABIERTO');

        INSERT INTO movimientos_caja (id, turno_caja_id, fecha, tipo, monto, concepto, usuario)
        VALUES ('mov_init_caja', 'turno_demo_01', NOW(), 'INGRESO', 1500.00, 'Fondo de apertura para cambio', 'cajero');
      `);

      await client.query("COMMIT;");
      console.log("Estructura base sembrada con éxito.");
    } catch (e) {
      await client.query("ROLLBACK;");
      throw e;
    } finally {
      client.release();
    }

    // 5. COTIZACIONES DE PRUEBA MEDIANTE REPOSITORIO
    console.log("5. Creando cotización autorizada de prueba...");
    const cotId = await repo.crearCotizacion({
      cliente: "Constructora Santa Fe S.A.",
      clienteId: "cli_corp_01",
      creadoPor: "vendedor",
      notas: "Precios pactados con autorización de Don Emmanuel para proyecto Carretera Norte",
      items: [
        { productoId: "prod_cem", cantidad: 20, precio: 360.00, exentoIva: true }, // Catálogo C$ 380 -> Autorizado C$ 360
        { productoId: "prod_ant", cantidad: 5, precio: 400.00, exentoIva: false }, // Catálogo C$ 460 -> Autorizado C$ 400
      ],
    });

    // Promover cotización a AUTORIZADA
    await pool.query(`
      UPDATE cotizaciones 
      SET estado = 'AUTORIZADA'
      WHERE id = $1;
    `, [cotId]);

    // 6. OPERACIÓN DE TRANSFERENCIA BANCARIA PENDIENTE (POLÍTICA A)
    console.log("6. Registrando transferencia pendiente de verificación (Política A)...");
    const facId = await repo.emitirFactura({
      cliente: "Constructora Santa Fe S.A.",
      clienteId: "cli_corp_01",
      tipo: "CREDITO",
      formaPago: "TRANSFERENCIA",
      origen: "COTIZACION",
      descuento: 0,
      notas: "A la espera de confirmación bancaria en cuenta BAC por Don Emmanuel",
      creadoPor: "cajero",
      turnoCajaId: "turno_demo_01",
      referenciaBancaria: "BAC-DEP-DEMO-991823",
      bancoOrigen: "BAC",
      bancoDestino: "BANPRO",
      items: [
        {
          productoId: "prod_cem",
          codigo: "CEM-001",
          nombre: "Cemento Canal Gris Especial 42.5kg",
          cantidad: 10,
          precio: 380.00,
          costo: 320.00,
          subtotal: 3800.00,
          exentoIva: true,
        },
      ],
    } as any);

    console.log("================================================================================");
    console.log("✓ DEMO PREPARADO EXITOSAMENTE");
    console.log("  - Usuarios: admin (admin123), cajero (caja123), vendedor (venta123)");
    console.log("  - Turno de Caja: TC-2026-0001 (ABIERTO con C$ 1,500 inicial)");
    console.log("  - Cotización Autorizada: Lista para cargar en POS (F7)");
    console.log("  - Transferencia Pendiente: Lista para auditar en Cobranza (Política A)");
    console.log("================================================================================");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error al sembrar demo:", err);
  process.exit(1);
});
