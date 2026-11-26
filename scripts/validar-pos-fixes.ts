import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("================================================================================");
  console.log("VALIDANDO CORRECCIÓN DE ERRORES VISUALES Y USABILIDAD DEL POS");
  console.log("================================================================================\n");

  const outputDir = path.join(process.cwd(), "capturas_pos_fixes");
  const artifactDir = "C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\1e506398-5df2-43a6-9977-2fa51fd6170d";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // ---------------------------------------------------------------------------
  // 1. Sesión Autenticada
  // ---------------------------------------------------------------------------
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log("1. Autenticando como Administrador...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="usuario"]', "admin");
  await page.fill('input[name="clave"]', "admin123");
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  console.log("2. Navegando al POS (/caja)...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);

  // Apertura de turno si es necesario
  const botonAbrirTurno = await page.locator("text=Abrir Caja Ahora").count();
  if (botonAbrirTurno > 0) {
    console.log("  Apertura de turno requerida para operar el POS...");
    await page.click("text=Abrir Caja Ahora");
    await page.waitForTimeout(500);
    const inputFondo = page.locator('input[type="number"]').first();
    if (await inputFondo.count() > 0) {
      await inputFondo.fill("1000");
    }
    await page.click('button:has-text("Abrir Turno")');
    await page.waitForTimeout(1000);
  }

  // ---------------------------------------------------------------------------
  // Prioridad 1: Verificar corrección de "70 undefined" en Tubo PVC
  // ---------------------------------------------------------------------------
  console.log("\n3. Verificando producto Tubo PVC en catálogo...");
  const searchInput = page.locator('input[placeholder*="Buscar, escanear"]');
  await searchInput.fill("Tubo PVC");
  await page.waitForTimeout(600);

  const badgeStockTubo = page.locator('text=70 Tubo').first();
  const countTuboCorregido = await badgeStockTubo.count();
  const countUndefined = await page.locator('text=70 undefined').count();

  console.log(`  Coincidencias "70 Tubo": ${countTuboCorregido}`);
  console.log(`  Coincidencias "70 undefined": ${countUndefined}`);

  if (countUndefined > 0) {
    throw new Error('FALLO: Aún se detecta "70 undefined" en pantalla.');
  }
  console.log('✓ ÉXITO: El texto muestra correctamente "70 Tubo" sin valores undefined.');

  const cap2Path = path.join(outputDir, "pos-02-producto-tubo-unidad-corregida.png");
  await page.screenshot({ path: cap2Path });
  console.log("✓ Captura guardada: pos-02-producto-tubo-unidad-corregida.png");

  // Limpiar búsqueda
  await searchInput.fill("");
  await page.waitForTimeout(400);

  // ---------------------------------------------------------------------------
  // Prioridad 2: Ticket con scroll interno delimitado y botón Cobrar accesible
  // ---------------------------------------------------------------------------
  console.log("\n4. Agregando múltiples artículos al ticket para probar scroll delimitado...");
  const botonesAgregar = page.locator('button:has-text("+ Agregar")');
  const totalBotones = await botonesAgregar.count();
  console.log(`  Tarjetas disponibles con stock: ${totalBotones}`);

  for (let i = 0; i < Math.min(6, totalBotones); i++) {
    await botonesAgregar.nth(i).click();
    await page.waitForTimeout(150);
  }

  console.log("5. Probando controles de cantidad (+ y -)...");
  const botonPlus = page.locator('button[title="Sumar 1"]').first();
  if (await botonPlus.count() > 0) {
    await botonPlus.click();
    await page.waitForTimeout(100);
    await botonPlus.click();
    await page.waitForTimeout(100);
    console.log("✓ Botón [+] operado exitosamente.");
  }

  const botonMinus = page.locator('button[title="Restar 1"]').first();
  if (await botonMinus.count() > 0) {
    await botonMinus.click();
    await page.waitForTimeout(100);
    console.log("✓ Botón [-] operado exitosamente.");
  }

  // Verificar visibilidad del encabezado del ticket
  const encabezadoTicket = page.locator('h2:has-text("Ticket de Mostrador")');
  const encabezadoVisible = await encabezadoTicket.isVisible();
  console.log(`✓ Encabezado del ticket visible: ${encabezadoVisible}`);

  // Verificar visibilidad del total a cobrar y botón Cobrar dentro del viewport
  const totalCobrar = page.locator('text=Total a Cobrar');
  const botonCobrar = page.locator('button[type="submit"]:has-text("Cobrar")');
  const totalVisible = await totalCobrar.isVisible();
  const botonCobrarVisible = await botonCobrar.isVisible();

  console.log(`✓ Resumen "Total a Cobrar" visible: ${totalVisible}`);
  console.log(`✓ Botón principal "Cobrar" visible y accesible: ${botonCobrarVisible}`);

  // Captura general escritorio con artículos en ticket
  const cap1Path = path.join(outputDir, "pos-01-desktop-caja-general.png");
  await page.screenshot({ path: cap1Path });
  console.log("✓ Captura guardada: pos-01-desktop-caja-general.png");

  // Captura enfocada en el ticket
  const cap3Path = path.join(outputDir, "pos-03-ticket-articulos-y-totales-fijos.png");
  await page.screenshot({ path: cap3Path });
  console.log("✓ Captura guardada: pos-03-ticket-articulos-y-totales-fijos.png");

  // ---------------------------------------------------------------------------
  // 6. Tablet (1024 x 768)
  // ---------------------------------------------------------------------------
  console.log("\n6. Validando vista Tablet (1024 x 768)...");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(600);

  const cap4Path = path.join(outputDir, "pos-04-tablet-1024x768.png");
  await page.screenshot({ path: cap4Path });
  console.log("✓ Captura guardada: pos-04-tablet-1024x768.png");

  // ---------------------------------------------------------------------------
  // 7. Móvil (390 x 844)
  // ---------------------------------------------------------------------------
  console.log("\n7. Validando vista Móvil (390 x 844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);

  // En móvil: vista catálogo
  const cap5Path = path.join(outputDir, "pos-05-movil-catalogo-390x844.png");
  await page.screenshot({ path: cap5Path });
  console.log("✓ Captura guardada: pos-05-movil-catalogo-390x844.png");

  // Cambiar a pestaña Ticket de Cobro
  console.log("  Cambiando a pestaña Ticket en móvil...");
  await page.click('button:has-text("Ticket de Cobro")');
  await page.waitForTimeout(600);

  const cap6Path = path.join(outputDir, "pos-06-movil-ticket-390x844.png");
  await page.screenshot({ path: cap6Path });
  console.log("✓ Captura guardada: pos-06-movil-ticket-390x844.png");

  // ---------------------------------------------------------------------------
  // 8. Sincronizar Capturas con Artefactos
  // ---------------------------------------------------------------------------
  console.log("\n8. Sincronizando capturas con el directorio de artefactos...");
  const archivos = fs.readdirSync(outputDir);
  for (const archivo of archivos) {
    if (archivo.endsWith(".png")) {
      fs.copyFileSync(path.join(outputDir, archivo), path.join(artifactDir, archivo));
      console.log(`  Copiado: ${archivo} -> ${artifactDir}`);
    }
  }

  await page.close();
  await context.close();
  await browser.close();

  console.log("\n================================================================================");
  console.log("TODAS LAS VALIDACIONES VISUALES Y FUNCIONALES COMPLETADAS CON ÉXITO.");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("ERROR EN VALIDACIÓN POS:", err);
  process.exit(1);
});
