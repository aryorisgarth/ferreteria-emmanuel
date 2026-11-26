import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("Iniciando captura visual automatizada de la FASE D (Extensión Progresiva)...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 860 },
  });
  const page = await context.newPage();

  const outputDir = path.join(process.cwd(), "capturas_fase_d");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Iniciar sesión como Administrador
  console.log("1. Accediendo al sistema local...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");
  await page.locator("text=Administrador").first().click();
  await page.waitForTimeout(300);
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  // Helper para captura uniforme
  async function capturarPantalla(url: string, nombreArchivo: string, descripcion: string) {
    console.log(`Navegando a ${descripcion} (${url})...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);
    const dest = path.join(outputDir, nombreArchivo);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`✓ Captura guardada: ${nombreArchivo}`);
  }

  // 1. Cotizaciones
  await capturarPantalla(
    "http://localhost:3000/cotizaciones",
    "fased-1-cotizaciones-plano.png",
    "Módulo Cotizaciones de Clientes"
  );

  // 2. Facturación y Ventas
  await capturarPantalla(
    "http://localhost:3000/facturas",
    "fased-2-facturas-plano.png",
    "Módulo Facturación y Ventas"
  );

  // 3. Kárdex de Inventario y Auditoría
  await capturarPantalla(
    "http://localhost:3000/kardex",
    "fased-3-kardex-auditoria.png",
    "Módulo Kárdex de Existencias"
  );

  // 4. Catálogo e Inventario de Mercadería
  await capturarPantalla(
    "http://localhost:3000/inventario",
    "fased-4-inventario-catalogo.png",
    "Módulo Inventario de Mercadería"
  );

  // 5. Clientes
  await capturarPantalla(
    "http://localhost:3000/clientes",
    "fased-5-clientes-empresarial.png",
    "Módulo Directorio de Clientes"
  );

  // 6. Proveedores
  await capturarPantalla(
    "http://localhost:3000/proveedores",
    "fased-6-proveedores-empresarial.png",
    "Módulo Proveedores y Distribuidores"
  );

  // 7. Consolidado del Día (Arqueo y Despachos)
  await capturarPantalla(
    "http://localhost:3000/total-del-dia",
    "fased-7-total-del-dia.png",
    "Módulo Consolidado de Despachos del Día"
  );

  // 8. Centro Oficial de Reportes
  await capturarPantalla(
    "http://localhost:3000/reportes",
    "fased-8-centro-reportes.png",
    "Módulo Centro de Reportes y Documentos"
  );

  await browser.close();
  console.log("\n================================================================================");
  console.log("✓ TODAS LAS 8 CAPTURAS DE FASE D GENERADAS CON ÉXITO EN:", outputDir);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error en capturas de Fase D:", err);
  process.exit(1);
});
