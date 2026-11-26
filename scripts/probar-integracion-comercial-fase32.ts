/**
 * FERRETERÍA EMMANUEL — PRUEBA DE INTEGRACIÓN COMERCIAL TRANSACCIONAL (FASE 3.2)
 * Entorno: PostgreSQL 16 Aislado (ferreteria_fase31_test)
 */

import { PostgresCommercialRepository } from "../src/lib/repositories/postgres/postgres-commercial-repository";
import { getPool } from "../src/lib/repositories/postgres/client";

async function main() {
  console.log("=== INICIANDO VALIDACIÓN DE INTEGRACIÓN COMERCIAL FASE 3.2 ===");

  // Asignar variables de entorno para apuntar a PostgreSQL 16 local aislado
  process.env.DATABASE_URL = "postgres://ferreteria_user:ferreteria_pass@localhost:5432/ferreteria_fase31_test";
  const pool = getPool();
  const repo = new PostgresCommercialRepository(pool);

  try {
    // 0. Setup y limpieza de datos sintéticos
    console.log("\n--- PASO 0: Limpieza preventiva de fixtures ---");
    await pool.query(`
      BEGIN;
      SET session_replication_role = 'replica';
      DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'TEST-F32-%';
      DELETE FROM kardex_movimientos WHERE numero_referencia LIKE 'FAC-TEST-F32-%';
      DELETE FROM factura_items WHERE factura_id LIKE 'fac_test_f32_%';
      DELETE FROM facturas WHERE id LIKE 'fac_test_f32_%';
      DELETE FROM cotizacion_items WHERE cotizacion_id LIKE 'cot_test_f32_%';
      DELETE FROM cotizaciones WHERE id LIKE 'cot_test_f32_%';
      DELETE FROM productos WHERE id LIKE 'prod_test_f32_%';
      DELETE FROM clientes WHERE id = 'cli_test_f32_01';
      SET session_replication_role = 'origin';

      INSERT INTO clientes (id, nombre, telefono, activo, limite_credito)
      VALUES ('cli_test_f32_01', 'Constructora Emmanuel F32 S.A.', '8888-9999', true, 50000.00);

      INSERT INTO productos (id, codigo, nombre, unidad_medida, precio, costo, stock_actual, activo)
      VALUES 
        ('prod_test_f32_grav', 'F32-GRAV', 'Hierro Corrugado 3/8 (Gravado)', 'VARILLA', 200.00, 150.00, 50, true),
        ('prod_test_f32_exen', 'F32-EXEN', 'Abono Orgánico (Exento)', 'SACO', 80.00, 50.00, 100, true);

      DELETE FROM turnos_caja WHERE usuario = 'cajero_mostrador';
      INSERT INTO turnos_caja (id, numero, usuario, fecha_apertura, monto_inicial, total_ventas_efectivo, estado)
      VALUES ('turno_f32_01', 'TC-2026-0001', 'cajero_mostrador', NOW(), 1000.00, 0.00, 'ABIERTO');
      COMMIT;
    `);
    console.log("Fixtures iniciales creados.");

    // 1. Crear Cotización
    console.log("\n--- PASO 1: Creación de cotización con versiones y saldos ---");
    const cotId = await repo.crearCotizacion({
      cliente: "Constructora Emmanuel F32 S.A.",
      clienteId: "cli_test_f32_01",
      creadoPor: "vendedor_central",
      notas: "Cotización para obra de prueba Fase 3.2",
      items: [
        { productoId: "prod_test_f32_grav", cantidad: 10, precio: 190.00, exentoIva: false },
        { productoId: "prod_test_f32_exen", cantidad: 5, precio: 75.00, exentoIva: true },
      ],
    });

    // Promover formalmente a AUTORIZADA
    await pool.query(`UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = $1`, [cotId]);

    const cotConsultada = await repo.cotizacion(cotId);
    console.log(`Cotización creada y autorizada: ${cotConsultada.numero} (ID: ${cotId}, Estado: ${cotConsultada.estado})`);
    if (cotConsultada.items.length !== 2) throw new Error("La cotización no cargó los 2 ítems.");
    if (cotConsultada.items[0].cantidadPendiente !== 10) throw new Error("Cantidad pendiente incorrecta en ítem gravado.");

    // 2. Facturación Parcial (4 unidades del ítem gravado)
    console.log("\n--- PASO 2: Facturación parcial (4 unidades de 10) ---");
    const itemGrav = cotConsultada.items.find((i: any) => i.productoId === "prod_test_f32_grav");
    const facturaParcialId = await repo.emitirFactura({
      cliente: "Constructora Emmanuel F32 S.A.",
      clienteId: "cli_test_f32_01",
      cotizacionId: cotId,
      creadoPor: "cajero_mostrador",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [
        {
          productoId: "prod_test_f32_grav",
          cantidad: 4,
          precio: itemGrav.precio,
          cotizacionItemId: itemGrav.id,
          exentoIva: false,
        },
      ],
    });

    const cotTrasParcial = await repo.cotizacion(cotId);
    console.log(`Factura parcial emitida: ${facturaParcialId}. Nuevo estado cotización: ${cotTrasParcial.estado}`);
    if (cotTrasParcial.estado !== "PARCIALMENTE_FACTURADA") {
      throw new Error(`Estado esperado PARCIALMENTE_FACTURADA, pero se obtuvo: ${cotTrasParcial.estado}`);
    }

    const itemGravPost = cotTrasParcial.items.find((i: any) => i.productoId === "prod_test_f32_grav");
    console.log(`Ítem gravado tras parcial: Facturada=${itemGravPost.cantidadFacturada}, Pendiente=${itemGravPost.cantidadPendiente}`);
    if (Number(itemGravPost.cantidadFacturada) !== 4 || Number(itemGravPost.cantidadPendiente) !== 6) {
      throw new Error("El balance de cantidades en cotizacion_items no coincide.");
    }

    // Comprobar decremento de stock en catálogo
    const prodGrav = await repo.producto("prod_test_f32_grav");
    if (!prodGrav) throw new Error("Producto no encontrado");
    console.log(`Stock actual de ${prodGrav.nombre}: ${prodGrav.stockActual} (Inicial: 50, Descuento: 4)`);
    if (prodGrav.stockActual !== 46) {
      throw new Error(`Stock incorrecto: esperado 46, obtenido ${prodGrav.stockActual}`);
    }

    // 3. Intento de Sobrefacturación (Intentar facturar 8 unidades cuando solo quedan 6)
    console.log("\n--- PASO 3: Validación contra sobrefacturación (8 unidades > 6 pendientes) ---");
    let errorSobrefacturacion = false;
    try {
      await repo.emitirFactura({
        cliente: "Constructora Emmanuel F32 S.A.",
        clienteId: "cli_test_f32_01",
        cotizacionId: cotId,
        creadoPor: "cajero_mostrador",
        formaPago: "EFECTIVO",
        items: [
          {
            productoId: "prod_test_f32_grav",
            cantidad: 8,
            precio: itemGrav.precio,
            cotizacionItemId: itemGrav.id,
          },
        ],
      });
    } catch (err: any) {
      errorSobrefacturacion = true;
      console.log(`Rechazo controlado exitoso: ${err.message}`);
    }
    if (!errorSobrefacturacion) {
      throw new Error("ERROR CRÍTICO: La sobrefacturación debió haber sido rechazada.");
    }

    // 4. Facturación del resto total (6 gravados + 5 exentos)
    console.log("\n--- PASO 4: Facturación del saldo total restante ---");
    const itemExen = cotConsultada.items.find((i: any) => i.productoId === "prod_test_f32_exen");
    const facturaFinalId = await repo.emitirFactura({
      cliente: "Constructora Emmanuel F32 S.A.",
      clienteId: "cli_test_f32_01",
      cotizacionId: cotId,
      creadoPor: "cajero_mostrador",
      formaPago: "EFECTIVO",
      items: [
        {
          productoId: "prod_test_f32_grav",
          cantidad: 6,
          precio: itemGrav.precio,
          cotizacionItemId: itemGrav.id,
        },
        {
          productoId: "prod_test_f32_exen",
          cantidad: 5,
          precio: itemExen.precio,
          cotizacionItemId: itemExen.id,
          exentoIva: true,
        },
      ],
    });

    const cotTrasFinal = await repo.cotizacion(cotId);
    console.log(`Factura final emitida: ${facturaFinalId}. Estado final cotización: ${cotTrasFinal.estado}`);
    if (cotTrasFinal.estado !== "FACTURADA") {
      throw new Error(`Estado esperado FACTURADA, pero se obtuvo: ${cotTrasFinal.estado}`);
    }

    // 5. Intento de facturar cotización totalmente cerrada
    console.log("\n--- PASO 5: Rechazo de facturación en cotización ya cerrada (FACTURADA) ---");
    let errorCerrada = false;
    try {
      await repo.emitirFactura({
        cliente: "Constructora Emmanuel F32 S.A.",
        clienteId: "cli_test_f32_01",
        cotizacionId: cotId,
        creadoPor: "cajero_mostrador",
        formaPago: "EFECTIVO",
        items: [{ productoId: "prod_test_f32_grav", cantidad: 1, precio: 190.00 }],
      });
    } catch (err: any) {
      errorCerrada = true;
      console.log(`Rechazo controlado exitoso: ${err.message}`);
    }
    if (!errorCerrada) {
      throw new Error("ERROR: Debió rechazarse la facturación sobre una cotización ya cerrada.");
    }

    // 6. Modalidad TRANSFERENCIA (Política A)
    console.log("\n--- PASO 6: Facturación por Transferencia Bancaria (Política A) ---");
    const refUnica = `BAC-REF-${Date.now()}`;
    const facTransfId = await repo.emitirFactura({
      cliente: "Constructora Emmanuel F32 S.A.",
      clienteId: "cli_test_f32_01",
      creadoPor: "cajero_mostrador",
      formaPago: "TRANSFERENCIA",
      items: [{ productoId: "prod_test_f32_exen", cantidad: 2, precio: 80.00, exentoIva: true }],
      referenciaBancaria: refUnica,
      bancoOrigen: "BAC",
      bancoDestino: "BANPRO",
    } as any);

    // Verificar en operaciones_pendientes_transferencia
    const opTransfRes = await pool.query(
      `SELECT id, referencia_bancaria, estado_bancario, estado_comercial FROM operaciones_pendientes_transferencia WHERE factura_id = $1`,
      [facTransfId]
    );
    if (opTransfRes.rows.length === 0) {
      throw new Error("No se registró la operación en operaciones_pendientes_transferencia.");
    }
    console.log(`Operación de transferencia registrada: ID=${opTransfRes.rows[0].id}, Estado=${opTransfRes.rows[0].estado_bancario}`);

    // Intentar reutilizar la misma referencia en el mismo banco
    let errorReusoVoucher = false;
    try {
      await repo.emitirFactura({
        cliente: "Cliente Reuso Voucher",
        clienteId: "cli_test_f32_01",
        creadoPor: "cajero_mostrador",
        formaPago: "TRANSFERENCIA",
        items: [{ productoId: "prod_test_f32_exen", cantidad: 1, precio: 80.00 }],
        referenciaBancaria: refUnica,
        bancoOrigen: "BAC",
        bancoDestino: "BANPRO",
      } as any);
    } catch (err: any) {
      errorReusoVoucher = true;
      console.log(`Rechazo por voucher bancario duplicado: ${err.message}`);
    }
    if (!errorReusoVoucher) {
      throw new Error("ERROR: La referencia bancaria duplicada debió ser rechazada.");
    }

    // 7. Venta normal en mostrador (POS normal sin cotización)
    console.log("\n--- PASO 7: Venta normal de mostrador en POS (Sin cotización) ---");
    const facNormalId = await repo.emitirFactura({
      cliente: "Público General Mostrador",
      creadoPor: "cajero_mostrador",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: "prod_test_f32_grav", cantidad: 2, precio: 200.00 }],
    });
    console.log(`Venta normal procesada correctamente: ${facNormalId}`);

    console.log("\n========================================================");
    console.log(">>> TODAS LAS VALIDACIONES DE INTEGRACIÓN COMERCIAL FASE 3.2 APROBADAS AL 100 % <<<");
    console.log("========================================================");
  } finally {
    // Limpieza final
    await pool.query(`
      BEGIN;
      SET session_replication_role = 'replica';
      DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'optx_%' OR cliente_nombre LIKE '%Emmanuel F32%';
      DELETE FROM kardex_movimientos WHERE destinatario LIKE '%Emmanuel F32%' OR destinatario = 'Público General Mostrador';
      DELETE FROM factura_items WHERE factura_id IN (SELECT id FROM facturas WHERE cliente LIKE '%Emmanuel F32%' OR cliente = 'Público General Mostrador');
      DELETE FROM facturas WHERE cliente LIKE '%Emmanuel F32%' OR cliente = 'Público General Mostrador';
      DELETE FROM cotizacion_items WHERE cotizacion_id IN (SELECT id FROM cotizaciones WHERE cliente LIKE '%Emmanuel F32%');
      DELETE FROM cotizaciones WHERE cliente LIKE '%Emmanuel F32%';
      DELETE FROM turnos_caja WHERE usuario = 'cajero_mostrador';
      DELETE FROM productos WHERE id LIKE 'prod_test_f32_%';
      DELETE FROM clientes WHERE id = 'cli_test_f32_01';
      SET session_replication_role = 'origin';
      COMMIT;
    `);
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error en la validación:", err);
  process.exit(1);
});
