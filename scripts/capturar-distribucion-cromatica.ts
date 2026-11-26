import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("Iniciando captura exhaustiva de la Distribución Cromática Definitiva...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 860 },
  });
  const page = await context.newPage();

  const outputDir = path.join(process.cwd(), "capturas_distribucion_cromatica");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Iniciar sesión como Administrador
  console.log("1. Navegando a login (http://localhost:3000)...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  console.log("2. Seleccionando tarjeta Administrador...");
  await page.locator("text=Administrador").first().click();
  await page.waitForTimeout(300);

  console.log("3. Pulsando Ingresar...");
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso. URL:", page.url());

  // 2. Ir a Configuración -> Apariencia
  console.log("4. Navegando a Configuración -> Apariencia...");
  await page.goto("http://localhost:3000/configuracion?tab=apariencia");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Helper para seleccionar y fijar tema
  async function aplicarTema(nombreTema: string, idTema: string) {
    console.log(`Aplicando y fijando tema: ${nombreTema}...`);
    // Localizar tarjeta por su texto de nombre
    const card = page.locator(`text=${nombreTema}`).first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.waitForTimeout(500);

    // En la tarjeta o en el banner superior, hacer clic en guardar si está visible
    const fijarBtn = page.locator(`button:has-text("Fijar")`).first();
    if (await fijarBtn.isVisible()) {
      await fijarBtn.click();
      await page.waitForTimeout(500);
    }
    // Asegurar también en localStorage para persistencia en navegaciones
    await page.evaluate((id) => {
      localStorage.setItem("fe_theme_general", id);
      localStorage.setItem("fe_theme_administrador", id);
      localStorage.setItem("fe_theme_admin", id);
    }, idTema);
    await page.waitForTimeout(300);
  }

  // --- CAPTURA 1: Amarillo Emmanuel ---
  await aplicarTema("Amarillo Emmanuel", "emmanuel");
  const p1 = path.join(outputDir, "1-tema-amarillo-emmanuel.png");
  await page.screenshot({ path: p1, fullPage: true });
  console.log("✓ Captura 1 guardada:", p1);

  // --- CAPTURA 2: Azul Empresarial ---
  await aplicarTema("Azul Empresarial", "azul");
  const p2 = path.join(outputDir, "2-tema-azul-empresarial.png");
  await page.screenshot({ path: p2, fullPage: true });
  console.log("✓ Captura 2 guardada:", p2);

  // --- CAPTURA 3: Verde Esmeralda ---
  await aplicarTema("Verde Esmeralda", "esmeralda");
  const p3 = path.join(outputDir, "3-tema-verde-esmeralda.png");
  await page.screenshot({ path: p3, fullPage: true });
  console.log("✓ Captura 3 guardada:", p3);

  // --- CAPTURA 4: Rosa Elegante ---
  await aplicarTema("Rosa Elegante", "rosa");
  const p4 = path.join(outputDir, "4-tema-rosa-elegante.png");
  await page.screenshot({ path: p4, fullPage: true });
  console.log("✓ Captura 4 guardada:", p4);

  // --- CAPTURA 5: Lila Moderno ---
  await aplicarTema("Lila Moderno", "lila");
  const p5 = path.join(outputDir, "5-tema-lila-moderno.png");
  await page.screenshot({ path: p5, fullPage: true });
  console.log("✓ Captura 5 guardada:", p5);

  // --- CAPTURA 6: Naranja Comercial ---
  await aplicarTema("Naranja Comercial", "naranja");
  const p6 = path.join(outputDir, "6-tema-naranja-comercial.png");
  await page.screenshot({ path: p6, fullPage: true });
  console.log("✓ Captura 6 guardada:", p6);

  // =========================================================================
  // DETALLES EN FLUJOS COMERCIALES (POS Y TABLAS) PARA TEMAS PRIORITARIOS
  // =========================================================================

  // --- TEMA: ROSA ELEGANTE ---
  console.log("\n--- Preparando capturas de ROSA ELEGANTE en flujos de trabajo ---");
  await aplicarTema("Rosa Elegante", "rosa");
  
  // POS Rosa Elegante
  await page.goto("http://localhost:3000/caja");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  // Agregar un producto rápido al carrito si es posible haciendo clic en el primer botón de producto
  const primerItemPOS = page.locator('button:has-text("+"), button:has-text("Agregar")').first();
  if (await primerItemPOS.isVisible()) {
    await primerItemPOS.click();
    await page.waitForTimeout(300);
  }
  const p7 = path.join(outputDir, "7-pos-rosa-elegante.png");
  await page.screenshot({ path: p7, fullPage: false });
  console.log("✓ Captura 7 guardada (POS Rosa Elegante):", p7);

  // Tabla Clientes Rosa Elegante
  await page.goto("http://localhost:3000/clientes");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const p8 = path.join(outputDir, "8-clientes-rosa-elegante.png");
  await page.screenshot({ path: p8, fullPage: false });
  console.log("✓ Captura 8 guardada (Clientes Rosa Elegante):", p8);

  // --- TEMA: VERDE ESMERALDA ---
  console.log("\n--- Preparando capturas de VERDE ESMERALDA en flujos de trabajo ---");
  await page.goto("http://localhost:3000/configuracion?tab=apariencia");
  await page.waitForLoadState("networkidle");
  await aplicarTema("Verde Esmeralda", "esmeralda");

  // POS Verde Esmeralda
  await page.goto("http://localhost:3000/caja");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const p9 = path.join(outputDir, "9-pos-verde-esmeralda.png");
  await page.screenshot({ path: p9, fullPage: false });
  console.log("✓ Captura 9 guardada (POS Verde Esmeralda):", p9);

  // Tabla Inventario Verde Esmeralda
  await page.goto("http://localhost:3000/inventario");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const p10 = path.join(outputDir, "10-inventario-verde-esmeralda.png");
  await page.screenshot({ path: p10, fullPage: false });
  console.log("✓ Captura 10 guardada (Inventario Verde Esmeralda):", p10);

  // --- TEMA: AZUL EMPRESARIAL ---
  console.log("\n--- Preparando capturas de AZUL EMPRESARIAL en flujos de trabajo ---");
  await page.goto("http://localhost:3000/configuracion?tab=apariencia");
  await page.waitForLoadState("networkidle");
  await aplicarTema("Azul Empresarial", "azul");

  // POS Azul Empresarial
  await page.goto("http://localhost:3000/caja");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const p11 = path.join(outputDir, "11-pos-azul-empresarial.png");
  await page.screenshot({ path: p11, fullPage: false });
  console.log("✓ Captura 11 guardada (POS Azul Empresarial):", p11);

  // Tabla Clientes Azul Empresarial
  await page.goto("http://localhost:3000/clientes");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const p12 = path.join(outputDir, "12-clientes-azul-empresarial.png");
  await page.screenshot({ path: p12, fullPage: false });
  console.log("✓ Captura 12 guardada (Clientes Azul Empresarial):", p12);

  await browser.close();
  console.log("\n================================================================================");
  console.log("✓ TODAS LAS 12 CAPTURAS CROMÁTICAS GENERADAS CON ÉXITO EN:", outputDir);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error en ejecución de capturas:", err);
  process.exit(1);
});
