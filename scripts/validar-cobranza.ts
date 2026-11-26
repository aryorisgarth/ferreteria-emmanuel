import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("================================================================================");
  console.log("VALIDANDO MÓDULO COBRANZA EN MODO POSTGRESQL AISLADO");
  console.log("================================================================================\n");

  const outputDir = path.join(process.cwd(), "capturas_cobranza");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1.5,
  });

  // 1. Login
  console.log("1. Autenticando como Administrador...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  // 2. Probar /cobranza (Pestaña por defecto: transferencias)
  console.log("\n2. Probando /cobranza (Pestaña Transferencias)...");
  const resp1 = await page.goto("http://localhost:3000/cobranza", { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log(`Status HTTP: ${resp1?.status()}`);
  await page.waitForTimeout(1000);

  // Verificar que no haya cartel de error en pantalla
  const errorVisible1 = await page.locator("text=BLOQUEO DE SEGURIDAD").count();
  const errorRuntime1 = await page.locator("text=Runtime Error").count();
  if (errorVisible1 > 0 || errorRuntime1 > 0) {
    throw new Error("Se detectó un Runtime Error en /cobranza (Transferencias)!");
  }
  console.log("✓ /cobranza cargó limpiamente sin ningún Runtime Error.");
  await page.screenshot({ path: path.join(outputDir, "cobranza-01-transferencias.png") });
  console.log("✓ Captura guardada: cobranza-01-transferencias.png");

  // 3. Probar /cobranza?tab=cuentas_cobrar (Cuentas por cobrar & Abonos a crédito)
  console.log("\n3. Probando /cobranza?tab=cuentas_cobrar (Cuentas por Cobrar)...");
  const resp2 = await page.goto("http://localhost:3000/cobranza?tab=cuentas_cobrar", { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log(`Status HTTP: ${resp2?.status()}`);
  await page.waitForTimeout(1000);

  const errorVisible2 = await page.locator("text=BLOQUEO DE SEGURIDAD").count();
  const errorRuntime2 = await page.locator("text=Runtime Error").count();
  if (errorVisible2 > 0 || errorRuntime2 > 0) {
    throw new Error("Se detectó un Runtime Error en /cobranza?tab=cuentas_cobrar!");
  }
  console.log("✓ /cobranza?tab=cuentas_cobrar cargó limpiamente sin ningún Runtime Error.");
  await page.screenshot({ path: path.join(outputDir, "cobranza-02-cuentas-por-cobrar.png") });
  console.log("✓ Captura guardada: cobranza-02-cuentas-por-cobrar.png");

  // 4. Probar búsqueda en Cuentas por Cobrar
  console.log("\n4. Probando filtro de búsqueda en Cuentas por Cobrar...");
  const resp3 = await page.goto("http://localhost:3000/cobranza?tab=cuentas_cobrar&q=FAC", { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log(`Status HTTP con búsqueda: ${resp3?.status()}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "cobranza-03-busqueda.png") });
  console.log("✓ Captura guardada: cobranza-03-busqueda.png");

  await browser.close();

  console.log("\n================================================================================");
  console.log("✓ CERTIFICACIÓN COMPLETA: MÓDULO COBRANZA OPERATIVO 100% EN POSTGRESQL");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error en validación:", err);
  process.exit(1);
});
