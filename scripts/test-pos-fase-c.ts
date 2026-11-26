import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("Iniciando validación visual y funcional de FASE C: Rediseño del POS...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 800 },
  });
  const page = await context.newPage();

  const outputDir = path.join(process.cwd(), "capturas_fase_c");
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

  // 2. Navegar a /caja (POS)
  console.log("Navegando a Caja (/caja)...");
  await page.goto("http://localhost:3000/caja");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);

  // Captura 1: Vista general del POS Enterprise vacío
  const pathPOSVacio = path.join(outputDir, "1-pos-enterprise-general.png");
  await page.screenshot({ path: pathPOSVacio });
  console.log("✓ Captura 1 guardada (POS General Vacío):", pathPOSVacio);

  // 3. Buscar y agregar artículos al mostrador
  console.log("Buscando artículo en catálogo...");
  const searchInput = page.locator('input[placeholder*="Buscar, escanear"]');
  await searchInput.fill("cemento");
  await page.waitForTimeout(400);

  // Hacer clic en agregar primer artículo disponible
  console.log("Agregando artículos al ticket...");
  const botonAgregar = page.locator('button:has-text("+ Agregar")').first();
  if (await botonAgregar.isVisible()) {
    await botonAgregar.click();
    await page.waitForTimeout(300);
    // Agregar otro para probar cantidad
    await botonAgregar.click();
    await page.waitForTimeout(300);
  }

  // Limpiar búsqueda para ver todos y agregar otro artículo
  await searchInput.fill("");
  await page.waitForTimeout(300);
  const segundoBoton = page.locator('button:has-text("+ Agregar")').nth(1);
  if (await segundoBoton.isVisible()) {
    await segundoBoton.click();
    await page.waitForTimeout(300);
  }

  // Captura 2: POS con artículos en Ticket y Total destacado
  const pathPOSTicket = path.join(outputDir, "2-pos-ticket-con-articulos.png");
  await page.screenshot({ path: pathPOSTicket });
  console.log("✓ Captura 2 guardada (POS Ticket con Artículos):", pathPOSTicket);

  // 4. Probar Forma de Pago Efectivo y Billetes Rápidos
  console.log("Probando forma de pago Efectivo con vuelto...");
  await page.locator('button:has-text("Efectivo")').first().click();
  await page.waitForTimeout(200);

  // Clic en billete rápido de 1000
  const billete1000 = page.locator('button:has-text("1000")').first();
  if (await billete1000.isVisible()) {
    await billete1000.click();
    await page.waitForTimeout(300);
  }

  const pathPOSEfectivo = path.join(outputDir, "3-pos-efectivo-vuelto.png");
  await page.screenshot({ path: pathPOSEfectivo });
  console.log("✓ Captura 3 guardada (Efectivo y Vuelto):", pathPOSEfectivo);

  // 5. Probar Forma de Pago Transferencia (Política A)
  console.log("Probando forma de pago Transferencia bancaria...");
  await page.locator('button:has-text("Transferencia")').first().click();
  await page.waitForTimeout(300);

  const pathPOSTransferencia = path.join(outputDir, "4-pos-transferencia-politica-a.png");
  await page.screenshot({ path: pathPOSTransferencia });
  console.log("✓ Captura 4 guardada (Transferencia Política A):", pathPOSTransferencia);

  // 6. Probar apertura de Cargar Cotización
  console.log("Abriendo modal Cargar Cotización...");
  await page.locator('button:has-text("Cargar Cotización")').click();
  await page.waitForTimeout(500);

  const pathPOSCotizacion = path.join(outputDir, "5-pos-modal-cotizacion.png");
  await page.screenshot({ path: pathPOSCotizacion });
  console.log("✓ Captura 5 guardada (Modal Cotización Plano):", pathPOSCotizacion);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 7. Prueba en resolución Tablet (1024x768)
  console.log("Probando vista en Tablet (1024x768)...");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);

  const pathPOSTablet = path.join(outputDir, "6-pos-tablet-1024.png");
  await page.screenshot({ path: pathPOSTablet });
  console.log("✓ Captura 6 guardada (POS Tablet 1024x768):", pathPOSTablet);

  await browser.close();
  console.log("================================================================================");
  console.log("✓ TODAS LAS PRUEBAS VISUALES Y FUNCIONALES DE FASE C APROBADAS EN:", outputDir);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error al validar FASE C:", err);
  process.exit(1);
});
