import fs from "node:fs";
import path from "node:path";

/**
 * Script de inicialización de Base de Datos Virgen para Producción en Neon
 * Solo se ejecutará cuando el usuario proporcione la URL de producción y autorización expresa.
 */
export async function verificarRequisitosDespliegue(dbUrl?: string) {
  const schemaPath = path.resolve(process.cwd(), "sql/schema.sql");
  const indicesPath = path.resolve(process.cwd(), "sql/indices_rendimiento_fase3.sql");
  const initPath = path.resolve(process.cwd(), "sql/02_inicializacion_produccion_virgen.sql");

  const schemaExiste = fs.existsSync(schemaPath);
  const indicesExiste = fs.existsSync(indicesPath);
  const initExiste = fs.existsSync(initPath);

  if (!schemaExiste || !indicesExiste || !initExiste) {
    throw new Error("Archivos SQL de despliegue incompletos.");
  }

  return {
    listo: true,
    archivos: [schemaPath, indicesPath, initPath],
    dbConfigurada: Boolean(dbUrl && dbUrl.length > 10),
  };
}

async function main() {
  console.log("=== FERRETERÍA EMMANUEL: VERIFICACIÓN DE PAQUETE DE PRODUCCIÓN ===");
  const res = await verificarRequisitosDespliegue(process.env.DATABASE_URL);
  console.log("Archivos DDL e Inicialización Virgen:", res.listo ? "OK (Completos)" : "Faltan");
  console.log("Estado: Listo para ejecutar en Neon cuando el usuario lo autorice.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
