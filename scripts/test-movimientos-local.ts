import * as local from "../src/lib/inventory/local";

async function probarLocal() {
  console.log("=== PRUEBA DE MOVIMIENTOS EN MODO JSON LOCAL ===");
  try {
    const catalogo = local.catalogo();
    console.log("Catálogo:", catalogo.length);
    const oficinas = local.oficinas();
    console.log("Oficinas:", oficinas.length);
    const fecha = local.fecha();
    console.log("Fecha:", fecha);
    const aprobadas = local.solicitudes(1, "APROBADO");
    console.log("Aprobadas:", aprobadas.rows.length, "Total:", aprobadas.total);
    const entregadas = local.solicitudes(1, "ENTREGADO");
    console.log("Entregadas:", entregadas.rows.length, "Total:", entregadas.total);
    console.log("TODO FUNCIONA PERFECTO EN LOCAL JSON.");
  } catch (err: any) {
    console.error("Error en local:", err);
  }
}

probarLocal();
