import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  const outputDir = path.join(process.cwd(), "capturas_fase_e");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log("Accediendo al sistema local...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  // 1. Cotización membretada oficial
  console.log("Obteniendo cotización para imprimir...");
  await page.goto("http://localhost:3000/cotizaciones", { waitUntil: "domcontentloaded" });
  const enlaceCotizacion = await page.locator('a[href^="/cotizaciones/cot_"]').first().getAttribute("href");
  console.log("Enlace cotización encontrado:", enlaceCotizacion);
  if (enlaceCotizacion) {
    await page.goto(`http://localhost:3000${enlaceCotizacion}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, "fasee-12-impresion-cotizacion.png"), fullPage: true });
    console.log("✓ Guardado: fasee-12-impresion-cotizacion.png");
    await page.emulateMedia({ media: "screen" });
  }

  // 2. Factura membretada oficial
  console.log("Obteniendo factura para imprimir...");
  await page.goto("http://localhost:3000/facturas", { waitUntil: "domcontentloaded" });
  const enlaceFactura = await page.locator('a[href^="/facturas/fac_"]').first().getAttribute("href");
  console.log("Enlace factura encontrado:", enlaceFactura);
  if (enlaceFactura) {
    await page.goto(`http://localhost:3000${enlaceFactura}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, "fasee-13-impresion-factura.png"), fullPage: true });
    console.log("✓ Guardado: fasee-13-impresion-factura.png");
    await page.emulateMedia({ media: "screen" });
  }

  await browser.close();
}

main().catch(console.error);
