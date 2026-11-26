import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("================================================================================");
  console.log("VALIDACIÓN DEL NUEVO DISEÑO SOLICITADO PARA CAJA Y TICKET DE VENTA");
  console.log("================================================================================\n");

  const outputDir = path.join(process.cwd(), "capturas_pos_solicitado");
  const artifactDir = "C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\1e506398-5df2-43a6-9977-2fa51fd6170d";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // 1. Autenticación como Administrador
  console.log("1. Autenticando en el sistema...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="usuario"]', "admin");
  await page.fill('input[name="clave"]', "admin123");
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  // 2. Navegación a Caja
  console.log("2. Abriendo módulo Caja (/caja)...");
  await page.goto("http://localhost:3000/caja", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);

  // Apertura de turno si es necesario
  const botonAbrirTurno = await page.locator("text=Abrir Caja Ahora").count();
  if (botonAbrirTurno > 0) {
    console.log("  Apertura de turno de caja...");
    await page.click("text=Abrir Caja Ahora");
    await page.waitForTimeout(500);
    const inputFondo = page.locator('input[type="number"]').first();
    if (await inputFondo.count() > 0) {
      await inputFondo.fill("1000");
    }
    await page.click('button:has-text("Abrir Turno")');
    await page.waitForTimeout(1000);
  }

  // Captura 1: Vista general limpia sin título 'Caja y Mostrador', sin bloque de fondo inicial saturado, con cuadro en blanco
  console.log("3. Guardando captura 1: Pantalla completa al tope sin títulos excesivos...");
  const cap1 = path.join(outputDir, "pos-nuevo-01-pantalla-limpia.png");
  await page.screenshot({ path: cap1 });
  console.log("✓ Captura guardada: pos-nuevo-01-pantalla-limpia.png");

  // 4. Probar Modal de Categorías
  console.log("4. Abriendo Modal de Categorías...");
  const botonCategoriasModal = page.locator('button:has-text("Categorías")').first();
  if (await botonCategoriasModal.count() > 0) {
    await botonCategoriasModal.click();
    await page.waitForTimeout(500);
    const capModalCat = path.join(outputDir, "pos-nuevo-02-modal-categorias.png");
    await page.screenshot({ path: capModalCat });
    console.log("✓ Captura guardada: pos-nuevo-02-modal-categorias.png");

    // Seleccionar una categoría en el modal
    const catItem = page.locator('button:has-text("Herramientas"), button:has-text("Fontanería")').first();
    if (await catItem.count() > 0) {
      await catItem.click();
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press("Escape");
    }
  }

  // 5. Agregar artículos desde la lista y desde el selector desplegable
  console.log("5. Agregando artículos al ticket...");
  const botonesAgregar = page.locator('button:has-text("+ Agregar")');
  const countBotones = await botonesAgregar.count();
  for (let i = 0; i < Math.min(3, countBotones); i++) {
    await botonesAgregar.nth(i).click();
    await page.waitForTimeout(200);
  }

  // Captura 3: Ticket real con artículos y forma de pago Efectivo visible
  const cap3 = path.join(outputDir, "pos-nuevo-03-ticket-efectivo.png");
  await page.screenshot({ path: cap3 });
  console.log("✓ Captura guardada: pos-nuevo-03-ticket-efectivo.png");

  // 6. Cambiar a Forma de Pago Transferencia directamente en el ticket
  console.log("6. Seleccionando Transferencia con datos de Voucher en el ticket...");
  await page.click('button:has-text("Transf.")');
  await page.waitForTimeout(300);
  const inputVoucher = page.locator('input[type="text"][name="referenciaBancaria"], input[placeholder*="BAC-"]').first();
  if (await inputVoucher.count() > 0) {
    await inputVoucher.fill("BAC-TRANSF-10293");
  }
  const cap4 = path.join(outputDir, "pos-nuevo-04-ticket-transferencia.png");
  await page.screenshot({ path: cap4 });
  console.log("✓ Captura guardada: pos-nuevo-04-ticket-transferencia.png");

  // 7. Cambiar a Forma de Pago Mixto directamente en el ticket
  console.log("7. Seleccionando Pago Mixto en el ticket...");
  await page.click('button:has-text("Mixto")');
  await page.waitForTimeout(300);
  const cap5 = path.join(outputDir, "pos-nuevo-05-ticket-mixto.png");
  await page.screenshot({ path: cap5 });
  console.log("✓ Captura guardada: pos-nuevo-05-ticket-mixto.png");

  // Sincronizar capturas con artefactos
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
  console.log("VALIDACIÓN COMPLETADA CON ÉXITO.");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("ERROR EN VALIDACIÓN:", err);
  process.exit(1);
});
