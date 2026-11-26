import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("Iniciando captura visual de FASE B (Enterprise Shell & Navigation)...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  const outputDir = path.join(process.cwd(), "capturas_fase_b");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Iniciar sesión como Administrador
  console.log("Navegando al login...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  await page.locator("text=Administrador").first().click();
  await page.waitForTimeout(200);

  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Sesión iniciada con éxito en:", page.url());
  await page.waitForTimeout(600);

  // 2. Captura de pantalla en /inicio con el nuevo Shell Enterprise
  const pathInicio = path.join(outputDir, "1-shell-enterprise-inicio.png");
  await page.screenshot({ path: pathInicio });
  console.log("✓ Captura 1 guardada:", pathInicio);

  // 3. Abrir el menú desplegable "Ventas" para mostrar los módulos agrupados
  console.log("Abriendo menú de navegación Ventas...");
  await page.locator("button:has-text('Ventas')").first().click();
  await page.waitForTimeout(400);

  const pathMenuVentas = path.join(outputDir, "2-menu-desplegable-ventas.png");
  await page.screenshot({ path: pathMenuVentas });
  console.log("✓ Captura 2 guardada:", pathMenuVentas);

  // 4. Navegar a Clientes para ver las nuevas tablas y componentes planos
  console.log("Navegando a Clientes...");
  await page.goto("http://localhost:3000/clientes");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const pathClientes = path.join(outputDir, "3-modulo-clientes-plano.png");
  await page.screenshot({ path: pathClientes });
  console.log("✓ Captura 3 guardada:", pathClientes);

  // 5. Navegar a Inventario
  console.log("Navegando a Inventario...");
  await page.goto("http://localhost:3000/inventario");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const pathInventario = path.join(outputDir, "4-modulo-inventario-plano.png");
  await page.screenshot({ path: pathInventario });
  console.log("✓ Captura 4 guardada:", pathInventario);

  await browser.close();
  console.log("================================================================================");
  console.log("✓ TODAS LAS CAPTURAS DE FASE B GENERADAS EXITOSAMENTE EN:", outputDir);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error al capturar FASE B:", err);
  process.exit(1);
});
