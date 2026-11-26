import * as api from "../src/lib/inventory/api";

async function probarMovimientos() {
  console.log("=== DIAGNÓSTICO DE DATOS PARA /movimientos ===");
  process.env.STORAGE_PROVIDER = "postgres";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test";

  try {
    console.log("1. Llamando a api.catalogo()...");
    const catalogo = await api.catalogo();
    console.log("   ✓ Catálogo obtenido:", catalogo.length, "artículos");
  } catch (err) {
    console.error("   ✗ Error en api.catalogo():", err);
  }

  try {
    console.log("2. Llamando a api.oficinas()...");
    const oficinas = await api.oficinas();
    console.log("   ✓ Oficinas obtenidas:", oficinas.length);
  } catch (err) {
    console.error("   ✗ Error en api.oficinas():", err);
  }

  try {
    console.log("3. Llamando a api.fecha()...");
    const fecha = await api.fecha();
    console.log("   ✓ Fecha obtenida:", fecha);
  } catch (err) {
    console.error("   ✗ Error en api.fecha():", err);
  }

  try {
    console.log("4. Llamando a api.solicitudes(1, 'APROBADO')...");
    const aprobadas = await api.solicitudes(1, "APROBADO");
    console.log("   ✓ Solicitudes aprobadas:", aprobadas.rows.length);
  } catch (err) {
    console.error("   ✗ Error en api.solicitudes('APROBADO'):", err);
  }

  try {
    console.log("5. Llamando a api.solicitudes(1, 'ENTREGADO')...");
    const entregadas = await api.solicitudes(1, "ENTREGADO");
    console.log("   ✓ Solicitudes entregadas:", entregadas.rows.length);
  } catch (err) {
    console.error("   ✗ Error en api.solicitudes('ENTREGADO'):", err);
  }

  console.log("=== FIN DIAGNÓSTICO ===");
}

probarMovimientos();
