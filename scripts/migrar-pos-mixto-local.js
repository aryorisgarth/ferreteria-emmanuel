const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test" });

async function main() {
  console.log("Aplicando esquema para pagos mixtos en PostgreSQL local aislado...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // 1. Actualizar restricción check en facturas para soportar MIXTO
    console.log("1. Actualizando restricción facturas_forma_pago_check...");
    await client.query(`
      ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_forma_pago_check;
      ALTER TABLE facturas ADD CONSTRAINT facturas_forma_pago_check
        CHECK (forma_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO', 'MIXTO'));
    `);

    // 2. Crear tabla factura_cobros para trazabilidad de pagos parciales y mixtos
    console.log("2. Creando tabla factura_cobros...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS factura_cobros (
        id text PRIMARY KEY,
        factura_id text NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
        metodo_pago text NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CREDITO')),
        monto numeric(14, 2) NOT NULL CHECK (monto > 0),
        estado text NOT NULL CHECK (estado IN ('CONFIRMADO', 'PENDIENTE_VERIFICACION', 'RECHAZADO', 'REEMBOLSADO')),
        banco_origen text,
        banco_destino text,
        referencia_bancaria text,
        monto_recibido numeric(14, 2),
        cambio numeric(14, 2),
        turno_caja_id text REFERENCES turnos_caja(id) ON DELETE SET NULL,
        movimiento_caja_id text,
        operacion_transferencia_id text REFERENCES operaciones_pendientes_transferencia(id) ON DELETE SET NULL,
        creado_por text NOT NULL,
        creado_en timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_factura_cobros_factura ON factura_cobros (factura_id);
      CREATE INDEX IF NOT EXISTS idx_factura_cobros_turno ON factura_cobros (turno_caja_id);
      CREATE INDEX IF NOT EXISTS idx_factura_cobros_estado ON factura_cobros (estado);
    `);

    // 3. Agregar columna cobro_mixto boolean a operaciones_pendientes_transferencia si no existe
    console.log("3. Verificando operaciones_pendientes_transferencia...");
    await client.query(`
      ALTER TABLE operaciones_pendientes_transferencia
        ADD COLUMN IF NOT EXISTS cobro_mixto boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS monto_efectivo_mixto numeric(14, 2) DEFAULT 0;
    `);

    await client.query("COMMIT;");
    console.log("✓ Esquema para pagos mixtos aplicado exitosamente en postgres local.");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Error al aplicar esquema:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
