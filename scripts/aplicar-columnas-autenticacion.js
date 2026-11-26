const { Client } = require('pg');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test';

async function migrar() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('Aplicando columnas de autenticacion en usuarios_cuentas...');

  await client.query(`
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS correo text;
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS debe_cambiar_clave boolean DEFAULT false;
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS token_recuperacion_hash text;
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS token_recuperacion_expira timestamp with time zone;
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS version_credencial integer DEFAULT 1;

    UPDATE usuarios_cuentas SET correo = 'admin@ferreteriaemmanuel.com.ni' WHERE usuario = 'admin' AND (correo IS NULL OR correo = '');
    UPDATE usuarios_cuentas SET correo = 'caja@ferreteriaemmanuel.com.ni' WHERE usuario = 'cajero' AND (correo IS NULL OR correo = '');
    UPDATE usuarios_cuentas SET correo = 'bodega@ferreteriaemmanuel.com.ni' WHERE usuario = 'bodega' AND (correo IS NULL OR correo = '');
    UPDATE usuarios_cuentas SET correo = 'ventas@ferreteriaemmanuel.com.ni' WHERE usuario = 'vendedor' AND (correo IS NULL OR correo = '');
  `);

  console.log('✓ Columnas añadidas y correos actualizados exitosamente.');

  const res = await client.query(
    'SELECT usuario, rol, correo, debe_cambiar_clave, version_credencial FROM usuarios_cuentas'
  );
  console.table(res.rows);

  await client.end();
}

migrar().catch((err) => {
  console.error('Error al aplicar columnas:', err);
  process.exit(1);
});
