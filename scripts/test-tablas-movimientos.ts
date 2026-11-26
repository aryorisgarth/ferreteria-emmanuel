import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: "postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test",
  });

  try {
    console.log("Probando conexión a Postgres...");
    const client = await pool.connect();
    console.log("Conectado con éxito.");

    // 1. Verificar oficinas
    try {
      const ofis = await client.query("SELECT * FROM oficinas;");
      console.log("Oficinas encontradas:", ofis.rows.length, ofis.rows);
    } catch (e: any) {
      console.error("ERROR en tabla oficinas:", e.message);
    }

    // 2. Verificar solicitudes
    try {
      const sols = await client.query("SELECT * FROM solicitudes;");
      console.log("Solicitudes encontradas:", sols.rows.length);
    } catch (e: any) {
      console.error("ERROR en tabla solicitudes:", e.message);
    }

    // 3. Verificar productos
    try {
      const prods = await client.query("SELECT COUNT(*) FROM productos;");
      console.log("Productos:", prods.rows[0].count);
    } catch (e: any) {
      console.error("ERROR en tabla productos:", e.message);
    }

    client.release();
  } catch (err: any) {
    console.error("Error general:", err.message);
  } finally {
    await pool.end();
  }
}

main();
