const { Client } = require('pg');
const c = new Client({ connectionString: 'postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test' });

async function main() {
  await c.connect();
  const res = await c.query("SELECT id, codigo, nombre, unidad_medida FROM productos WHERE nombre ILIKE '%Tubo%' OR nombre ILIKE '%Durman%' LIMIT 10;");
  console.table(res.rows);

  const resUnidades = await c.query("SELECT DISTINCT unidad_medida FROM productos ORDER BY unidad_medida;");
  console.log("Unidades distintas en BD:");
  console.table(resUnidades.rows);

  await c.end();
}

main().catch(err => {
  console.error(err);
  c.end();
});
