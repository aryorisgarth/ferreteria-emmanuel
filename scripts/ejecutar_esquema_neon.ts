import fs from "node:fs";
import path from "node:path";

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && (i === 0 || sql[i - 1] !== "\\")) {
      inString = !inString;
    }
    if (char === ";" && !inString) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = "";
    } else {
      current += char;
    }
  }
  const trimmed = current.trim();
  if (trimmed) {
    statements.push(trimmed);
  }

  return statements.filter((s) => {
    const lines = s
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("--"));
    return lines.length > 0;
  });
}

async function main() {
  console.log("=== INICIANDO PREPARACIÓN DE BASE DE DATOS DE PRUEBAS ===");

  // 1. Cargar exclusivamente .env.test.local
  const envPath = path.resolve(process.cwd(), ".env.test.local");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR CRÍTICO: No se encontró el archivo .env.test.local.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const parsedVars: Record<string, string> = {};

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
    parsedVars[key] = val;
  }

  const dbUrl = parsedVars["DATABASE_URL"] || "";
  const dbUrlPooled = parsedVars["DATABASE_URL_POOLED"] || "";

  if (!dbUrl || !dbUrlPooled) {
    console.error("ERROR CRÍTICO: Variables DATABASE_URL o DATABASE_URL_POOLED no configuradas.");
    process.exit(1);
  }

  // 2. Comprobar nombres de base de datos
  function extractDatabaseName(urlStr: string): string | null {
    try {
      const u = new URL(urlStr);
      const p = u.pathname.replace(/^\//, "").split("?")[0];
      return p || null;
    } catch {
      return null;
    }
  }

  const dbName = extractDatabaseName(dbUrl);
  const dbNamePooled = extractDatabaseName(dbUrlPooled);

  if (dbName !== "emmanuel_test" || dbNamePooled !== "emmanuel_test") {
    console.error("ERROR CRÍTICO: Las variables no apuntan a 'emmanuel_test'. Se aborta la operación.");
    process.exit(1);
  }

  let host = "";
  try {
    host = new URL(dbUrl).hostname;
  } catch {
    console.error("ERROR: No se pudo obtener el host de DATABASE_URL.");
    process.exit(1);
  }

  const endpoint = `https://${host}/sql`;

  // Helper para consultas HTTP seguras a Neon
  async function runSql(sql: string): Promise<any> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": dbUrl,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const sanitized = errText.replace(/npg_[a-zA-Z0-9_-]+/g, "[REDACTED_PASSWORD]");
      throw new Error(`HTTP ${res.status}: ${sanitized}`);
    }

    return await res.json();
  }

  // 3. PASO CRÍTICO: Exigir que SELECT current_database() sea exactamente 'emmanuel_test'
  console.log("Verificando base de datos activa antes de ejecutar...");
  const checkRes = await runSql("SELECT current_database(), current_user;");
  const activeDb = checkRes.rows?.[0]?.current_database || checkRes.rows?.[0]?.[0];
  const activeUser = checkRes.rows?.[0]?.current_user || checkRes.rows?.[0]?.[1];

  console.log(`Base de datos activa en Neon: '${activeDb}'`);
  console.log(`Usuario autenticado:          '${activeUser}'`);

  if (activeDb !== "emmanuel_test") {
    console.error(`ERROR DE SEGURIDAD: La base conectada es '${activeDb}', NO 'emmanuel_test'. ABORTANDO DE INMEDIATO.`);
    process.exit(1);
  }

  console.log("-> Confirmación de seguridad aprobada: Conexión exclusiva con 'emmanuel_test'.\n");

  // 4. Leer y verificar sql/schema.sql
  const schemaPath = path.resolve(process.cwd(), "sql/schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error("ERROR: No se encontró el archivo sql/schema.sql");
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  // Verificar ausencia de instrucciones destructivas
  const upper = schemaContent.toUpperCase();
  if (upper.includes("DROP TABLE") || upper.includes("DROP DATABASE") || upper.includes("TRUNCATE")) {
    console.error("ERROR DE SEGURIDAD: El esquema contiene instrucciones destructivas (DROP/TRUNCATE). Abortando.");
    process.exit(1);
  }

  // Contar tablas declaradas en el archivo
  const tableMatches = [...schemaContent.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi)];
  const declaredTables = tableMatches.map((m) => m[1]);
  console.log(`Tablas declaradas en schema.sql: ${declaredTables.length}`);

  // Dividir en sentencias DDL individuales
  const statements = splitSqlStatements(schemaContent);
  console.log(`Sentencias SQL individuales a ejecutar: ${statements.length}`);

  // 5. Ejecutar cada sentencia secuencialmente en emmanuel_test
  console.log("\nEjecutando sentencias del esquema en 'emmanuel_test'...");
  let exitosas = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await runSql(stmt);
      exitosas++;
    } catch (err: any) {
      console.error(`ERROR en la sentencia #${i + 1}:`, err.message);
      console.error("Sentencia que falló:\n", stmt.substring(0, 200) + "...");
      process.exit(1);
    }
  }
  console.log(`-> ${exitosas} sentencias ejecutadas exitosamente.`);

  // 6. Verificar tablas efectivamente existentes en PostgreSQL
  console.log("\nConsultando information_schema en 'emmanuel_test'...");
  const tablesRes = await runSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `);

  const createdTables: string[] = (tablesRes.rows || []).map((r: any) => r.table_name || r[0]);
  console.log(`Total de tablas físicas existentes en 'emmanuel_test': ${createdTables.length}`);

  console.log("\nListado de tablas verificadas:");
  createdTables.forEach((t, i) => {
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${t}`);
  });

  // Validar que cada tabla declarada esté presente
  const missingTables = declaredTables.filter((t) => !createdTables.includes(t));
  if (missingTables.length > 0) {
    console.error("\nADVERTENCIA: Faltan las siguientes tablas declaradas:", missingTables);
    process.exit(1);
  }

  console.log(`\n=== RESULTADO FINAL: ÉXITO TOTAL ===`);
  console.log(`Se verificó que las ${declaredTables.length} tablas declaradas existen en 'emmanuel_test'.`);
}

main().catch((e) => {
  console.error("Error no controlado:", e);
  process.exit(1);
});
