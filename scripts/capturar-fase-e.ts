import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("================================================================================");
  console.log("INICIANDO AUDITORÍA VISUAL Y CAPTURA MULTI-DISPOSITIVO - FASE E");
  console.log("Escritorio | Tablet Landscape | Tablet Portrait | Móvil | Impresión | A11y");
  console.log("================================================================================\n");

  const outputDir = path.join(process.cwd(), "capturas_fase_e");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // 1. Iniciar sesión como Administrador
  console.log("1. Accediendo al sistema local...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await page.waitForTimeout(200);
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso como Administrador.");

  // Helper para captura uniforme
  async function capturar(nombreArchivo: string, descripcion: string) {
    await page.waitForTimeout(600);
    const dest = path.join(outputDir, nombreArchivo);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`✓ Captura guardada: ${nombreArchivo} (${descripcion})`);
  }

  // =========================================================================
  // BLOQUE 1: ESCRITORIO (1366 x 768)
  // =========================================================================
  console.log("\n--- BLOQUE 1: ESCRITORIO (1366 x 768) ---");
  await page.setViewportSize({ width: 1366, height: 768 });

  // 1.1 POS en Escritorio
  console.log("1.1 Navegando al POS en Escritorio...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  // Agregar productos de prueba para ticket activo
  const btnAgregar = page.locator('button:has-text("Agregar")');
  if (await btnAgregar.count() > 0) {
    await btnAgregar.first().click();
    await page.waitForTimeout(300);
    if (await btnAgregar.count() > 1) {
      await btnAgregar.nth(1).click();
      await page.waitForTimeout(300);
    }
  }
  await capturar("fasee-01-desktop-pos.png", "Punto de Venta POS en Escritorio");

  // 1.2 Inventario en Escritorio
  console.log("1.2 Navegando a Inventario...");
  await page.goto("http://localhost:3000/inventario", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-02-desktop-inventario.png", "Catálogo de Inventario en Escritorio");

  // 1.3 Facturación en Escritorio
  console.log("1.3 Navegando a Facturación...");
  await page.goto("http://localhost:3000/facturas", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-03-desktop-facturas.png", "Historial de Facturación en Escritorio");

  // =========================================================================
  // BLOQUE 2: TABLET HORIZONTAL (1024 x 768)
  // =========================================================================
  console.log("\n--- BLOQUE 2: TABLET HORIZONTAL (1024 x 768) ---");
  await page.setViewportSize({ width: 1024, height: 768 });

  // 2.1 POS en Tablet Landscape
  console.log("2.1 Navegando al POS en Tablet Landscape...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-04-tablet-pos-landscape.png", "POS en Tablet Horizontal (1024x768)");

  // 2.2 Clientes en Tablet Landscape
  console.log("2.2 Navegando a Clientes en Tablet...");
  await page.goto("http://localhost:3000/clientes", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-05-tablet-clientes.png", "Directorio de Clientes en Tablet Horizontal");

  // =========================================================================
  // BLOQUE 3: TABLET VERTICAL (768 x 1024)
  // =========================================================================
  console.log("\n--- BLOQUE 3: TABLET VERTICAL (768 x 1024) ---");
  await page.setViewportSize({ width: 768, height: 1024 });

  // 3.1 POS en Tablet Portrait (Catálogo de productos)
  console.log("3.1 POS Tablet Portrait - Pestaña Catálogo...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-06-tablet-pos-portrait.png", "POS Tablet Vertical (Catálogo)");

  // 3.2 POS en Tablet Portrait (Conmutando a Pestaña Ticket)
  console.log("3.2 POS Tablet Portrait - Pestaña Ticket...");
  const tabTicket = page.locator('button:has-text("Ticket de Venta")');
  if (await tabTicket.count() > 0) {
    await tabTicket.click();
    await page.waitForTimeout(400);
  }
  await capturar("fasee-07-tablet-pos-ticket.png", "POS Tablet Vertical (Ticket)");

  // 3.3 Cotizaciones en Tablet Portrait
  console.log("3.3 Cotizaciones en Tablet Portrait...");
  await page.goto("http://localhost:3000/cotizaciones", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-08-tablet-cotizaciones.png", "Cotizaciones en Tablet Vertical");

  // =========================================================================
  // BLOQUE 4: MÓVIL (390 x 844 - iPhone / Android Moderno)
  // =========================================================================
  console.log("\n--- BLOQUE 4: MÓVIL (390 x 844) ---");
  await page.setViewportSize({ width: 390, height: 844 });

  // 4.1 Menú Móvil Desplegado (Drawer)
  console.log("4.1 Menú Móvil Drawer...");
  await page.goto("http://localhost:3000/inicio", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  // Buscar el botón de hamburguesa en el header
  const btnMenuHamburguesa = page.locator('header button').last();
  await btnMenuHamburguesa.click();
  await page.waitForTimeout(500);
  await capturar("fasee-09-movil-navegacion-drawer.png", "Menú Móvil Drawer Desplegado");

  // 4.2 POS Móvil
  console.log("4.2 POS en Móvil...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-10-movil-pos.png", "Terminal POS en Móvil");

  // 4.3 Inventario en Móvil
  console.log("4.3 Inventario en Móvil...");
  await page.goto("http://localhost:3000/inventario", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await capturar("fasee-11-movil-inventario.png", "Inventario en Móvil (Tarjetas responsivas)");

  // =========================================================================
  // BLOQUE 5: DOCUMENTOS OFICIALES E IMPRESIÓN (@media print)
  // =========================================================================
  console.log("\n--- BLOQUE 5: IMPRESIÓN Y FORMATO DOCUMENTAL (@media print) ---");
  await page.setViewportSize({ width: 1280, height: 900 });

  // 5.1 Cotización Membretada Oficial
  console.log("5.1 Obteniendo cotización para vista de impresión...");
  await page.goto("http://localhost:3000/cotizaciones", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const enlaceCotizacion = await page.locator('a[href^="/cotizaciones/"]').first().getAttribute("href");
  if (enlaceCotizacion && enlaceCotizacion !== "/cotizaciones/nueva") {
    console.log(`Navegando a cotización: ${enlaceCotizacion}`);
    await page.goto(`http://localhost:3000${enlaceCotizacion}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(600);
    const dest = path.join(outputDir, "fasee-12-impresion-cotizacion.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log("✓ Guardado: fasee-12-impresion-cotizacion.png");
    await page.emulateMedia({ media: "screen" });
  }

  // 5.2 Factura Membretada Oficial
  console.log("5.2 Obteniendo factura para vista de impresión...");
  await page.goto("http://localhost:3000/facturas", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const enlaceFactura = await page.locator('a[href^="/facturas/"]').first().getAttribute("href");
  if (enlaceFactura && enlaceFactura !== "/facturas/nueva") {
    console.log(`Navegando a factura: ${enlaceFactura}`);
    await page.goto(`http://localhost:3000${enlaceFactura}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(600);
    const dest = path.join(outputDir, "fasee-13-impresion-factura.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log("✓ Guardado: fasee-13-impresion-factura.png");
    await page.emulateMedia({ media: "screen" });
  }

  // 5.3 Kárdex de Auditoría Apaisado (/kardex/imprimir)
  console.log("5.3 Capturando Kárdex de Existencias oficial para imprimir...");
  await page.goto("http://localhost:3000/kardex/imprimir", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(600);
  const destKardex = path.join(outputDir, "fasee-14-impresion-kardex-apaisado.png");
  await page.screenshot({ path: destKardex, fullPage: true });
  console.log("✓ Guardado: fasee-14-impresion-kardex-apaisado.png");
  await page.emulateMedia({ media: "screen" });

  // 5.4 Inventario Oficial para Conteo Físico (/inventario/imprimir)
  console.log("5.4 Capturando Hoja de Inventario para Conteo Físico...");
  await page.goto("http://localhost:3000/inventario/imprimir", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(600);
  const destInv = path.join(outputDir, "fasee-15-impresion-inventario-conteo.png");
  await page.screenshot({ path: destInv, fullPage: true });
  console.log("✓ Guardado: fasee-15-impresion-inventario-conteo.png");
  await page.emulateMedia({ media: "screen" });

  // =========================================================================
  // BLOQUE 6: ACCESIBILIDAD Y FOCO TECLADO (WCAG AA/AAA)
  // =========================================================================
  console.log("\n--- BLOQUE 6: ACCESIBILIDAD Y FOCO TECLADO (WCAG AA/AAA) ---");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // Enfocar input de búsqueda con teclado
  const inputBusqueda = page.locator('input[placeholder*="Buscar"]').first();
  await inputBusqueda.focus();
  await page.waitForTimeout(300);
  await capturar("fasee-16-a11y-focus-visible.png", "Anillo de Foco Accesible (Focus-Visible)");

  await browser.close();

  console.log("\n================================================================================");
  console.log("✓ AUDITORÍA FASE E FINALIZADA CON ÉXITO");
  console.log("Total de capturas guardadas en:", outputDir);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Error en auditoría visual Fase E:", err);
  process.exit(1);
});
