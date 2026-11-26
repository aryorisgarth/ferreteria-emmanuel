import fs from "node:fs";
import path from "node:path";

// 1. Cargar exclusivamente el archivo .env.test.local
const envPath = path.resolve(process.cwd(), ".env.test.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: No se encontró el archivo .env.test.local");
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

console.log("=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===");

function extractDatabaseName(connectionString: string): string | null {
  try {
    const url = new URL(connectionString);
    const pathname = url.pathname.replace(/^\//, "");
    return pathname.split("?")[0] || null;
  } catch {
    return null;
  }
}

function getHostName(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return url.hostname;
  } catch {
    return "";
  }
}

// 2. Verificar que DATABASE_URL y DATABASE_URL_POOLED apunten a emmanuel_test
const dbNameDirect = extractDatabaseName(dbUrl);
const dbNamePooled = extractDatabaseName(dbUrlPooled);

console.log(`DATABASE_URL definida: ${Boolean(dbUrl)}`);
console.log(`DATABASE_URL base de datos: ${dbNameDirect}`);
console.log(`DATABASE_URL_POOLED definida: ${Boolean(dbUrlPooled)}`);
console.log(`DATABASE_URL_POOLED base de datos: ${dbNamePooled}`);

if (dbNameDirect !== "emmanuel_test" || dbNamePooled !== "emmanuel_test") {
  console.error(
    "ERROR: Una o ambas variables no apuntan exactamente a la base 'emmanuel_test'."
  );
  process.exit(1);
}

console.log("-> Validación exitosa: Ambas variables apuntan a 'emmanuel_test'.\n");

// 3. Ejecutar consulta de lectura SELECT current_database(), current_user;
async function probarConexionNeon() {
  console.log("=== EJECUTANDO CONSULTA EN NEON POSTGRESQL ===");
  console.log("Consulta: SELECT current_database(), current_user;\n");

  const host = getHostName(dbUrl);
  // Neon Serverless HTTP API endpoint
  const endpoint = `https://${host}/sql`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": dbUrl,
      },
      body: JSON.stringify({
        query: "SELECT current_database(), current_user;",
        params: [],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Ocultar cualquier secreto si apareciera en el error
      const sanitizedErr = errBody.replace(/npg_[a-zA-Z0-9_-]+/g, "[REDACTED_PASSWORD]");
      console.error(`ERROR HTTP ${res.status}: ${sanitizedErr}`);
      process.exit(1);
    }

    const data: any = await res.json();
    const rows = data.rows || [];

    if (rows.length === 0) {
      console.error("ERROR: No se obtuvieron filas de la consulta.");
      process.exit(1);
    }

    const row = rows[0];
    const currentDb = row.current_database || row[0];
    const currentUser = row.current_user || row[1];

    console.log("=== RESULTADO DE LA CONSULTA ===");
    console.log(`Base de datos conectada (current_database): ${currentDb}`);
    console.log(`Usuario conectado (current_user):             ${currentUser}`);

    if (currentDb === "emmanuel_test") {
      console.log("\n-> CONFIRMACIÓN: La base de datos conectada es exactamente 'emmanuel_test'.");
    } else {
      console.error(`\n-> ADVERTENCIA: La base de datos retornada ('${currentDb}') no coincide con 'emmanuel_test'.`);
      process.exit(1);
    }
  } catch (err: any) {
    const safeMsg = (err.message || String(err)).replace(/npg_[a-zA-Z0-9_-]+/g, "[REDACTED_PASSWORD]");
    console.error(`ERROR de conexión: ${safeMsg}`);
    process.exit(1);
  }
}

probarConexionNeon();
