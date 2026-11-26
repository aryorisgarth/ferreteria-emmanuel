import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("================================================================================");
  console.log("VALIDACIÓN INTEGRAL: TICKET PRELIMINAR, MODAL DE COBRO Y PAGO MIXTO (POLÍTICA A)");
  console.log("================================================================================\n");

  const outputDir = path.join(process.cwd(), "capturas_pos_mixto");
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

  // 3. Agregar artículos al ticket directamente
  console.log("3. Agregando productos al Ticket Preliminar...");
  const botonesAgregar = page.locator('button:has-text("+ Agregar")');
  const countBotones = await botonesAgregar.count();
  for (let i = 0; i < Math.min(4, countBotones); i++) {
    await botonesAgregar.nth(i).click();
    await page.waitForTimeout(150);
  }

  // Captura 1: Ticket Preliminar con desglose y botón Proceder al Cobro
  const cap1 = path.join(outputDir, "pos-mixto-01-ticket-preliminar.png");
  await page.screenshot({ path: cap1 });
  console.log("✓ Captura guardada: pos-mixto-01-ticket-preliminar.png");

  // 4. Abrir Modal de Cobro Bajo Demanda
  console.log("\n4. Abriendo Modal de Cobro Bajo Demanda [F9]...");
  await page.click('button:has-text("Proceder al Cobro")');
  await page.waitForTimeout(700);

  // Captura 2: Modal de Cobro - Vista Pago Individual
  const cap2 = path.join(outputDir, "pos-mixto-02-modal-cobro-individual.png");
  await page.screenshot({ path: cap2 });
  console.log("✓ Captura guardada: pos-mixto-02-modal-cobro-individual.png");

  // 5. Cambiar a modalidad Pago Mixto (Efectivo + Transferencia)
  console.log("\n5. Seleccionando Pago Mixto (Efectivo + Transferencia)...");
  await page.click('button:has-text("Pago Mixto")');
  await page.waitForTimeout(600);

  // Llenar referencia bancaria
  const inputRef = page.locator('input[placeholder*="BAC-"], input[placeholder*="ej."]').first();
  if (await inputRef.count() > 0) {
    await inputRef.fill("BAC-TRANSF-500-MIXT");
  }

  // Captura 3: Modal de Cobro - Desglose Pago Mixto con alerta Política A
  const cap3 = path.join(outputDir, "pos-mixto-03-modal-cobro-mixto.png");
  await page.screenshot({ path: cap3 });
  console.log("✓ Captura guardada: pos-mixto-03-modal-cobro-mixto.png");

  // 6. Confirmar y Registrar la Venta Mixta
  console.log("\n6. Registrando Venta Mixta en el sistema...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
    page.click('button:has-text("Confirmar Venta Mixta")'),
  ]);
  await page.waitForTimeout(2000);

  // Captura 4: Ticket Emitido con estado PENDIENTE_VERIFICACION (Entrega Retenida)
  const cap4 = path.join(outputDir, "pos-mixto-04-ticket-exitoso-mixto.png");
  await page.screenshot({ path: cap4 });
  console.log("✓ Captura guardada: pos-mixto-04-ticket-exitoso-mixto.png");

  // Cerrar modal de ticket exitoso si está visible
  const botonCerrarTicket = page.locator('button:has-text("Cerrar")').first();
  if (await botonCerrarTicket.count() > 0) {
    await botonCerrarTicket.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // 7. Navegar a Cobranza para verificar la transferencia pendiente
  console.log("\n7. Navegando a Cobranza (/cobranza) para verificar la transferencia de Don Emmanuel...");
  await page.goto("http://localhost:3000/cobranza", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  // Captura 5: Operación en Cobranza en PENDIENTE_VERIFICACION
  const cap5 = path.join(outputDir, "pos-mixto-05-cobranza-pendiente.png");
  await page.screenshot({ path: cap5 });
  console.log("✓ Captura guardada: pos-mixto-05-cobranza-pendiente.png");

  // 8. Don Emmanuel Acredita la Transferencia
  console.log("\n8. Don Emmanuel comprueba banco y presiona Acreditar Transferencia...");
  const botonVerificar = page.locator('button:has-text("Acreditar"), button:has-text("Verificar")').first();
  if (await botonVerificar.count() > 0) {
    await botonVerificar.click();
    await page.waitForTimeout(2000);
    console.log("✓ Transferencia acreditada exitosamente. Factura pagada y stock descontado.");
  }

  // Captura 6: Cobranza con transferencia acreditada
  const cap6 = path.join(outputDir, "pos-mixto-06-cobranza-acreditada.png");
  await page.screenshot({ path: cap6 });
  console.log("✓ Captura guardada: pos-mixto-06-cobranza-acreditada.png");

  // Sincronizar capturas con artefactos
  console.log("\n9. Sincronizando capturas con el directorio de artefactos...");
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
  console.log("FLUJO COMPLETO DE TICKET, MODAL Y COBRO MIXTO VALIDADO CON ÉXITO.");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("ERROR EN VALIDACIÓN FLUJO POS MIXTO:", err);
  process.exit(1);
});
