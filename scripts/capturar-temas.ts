import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  console.log("Iniciando captura visual automatizada de temas...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
  });
  const page = await context.newPage();

  const outputDir = path.join(process.cwd(), "capturas_temas");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Iniciar sesión como admin
  console.log("Navegando a login...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  // Usar la tarjeta demo "Administrador"
  console.log("Seleccionando acceso Administrador...");
  await page.locator("text=Administrador").first().click();
  await page.waitForTimeout(300);

  // Enviar formulario
  console.log("Pulsando Ingresar al Sistema...");
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  console.log("✓ Sesión iniciada con éxito. URL actual:", page.url());

  // 2. Ir a Configuración -> Apariencia
  console.log("Navegando a Configuración -> Apariencia...");
  await page.goto("http://localhost:3000/configuracion?tab=apariencia");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Captura 1: Amarillo Emmanuel (Predeterminado)
  const pathEmmanuel = path.join(outputDir, "1-tema-amarillo-emmanuel.png");
  await page.screenshot({ path: pathEmmanuel, fullPage: true });
  console.log("✓ Captura 1 guardada (Amarillo Emmanuel):", pathEmmanuel);

  // Captura 2: Azul Empresarial
  console.log("Probando Azul Empresarial...");
  await page.locator("text=Azul Empresarial").first().click();
  await page.waitForTimeout(600);
  const pathAzul = path.join(outputDir, "2-tema-azul-empresarial.png");
  await page.screenshot({ path: pathAzul, fullPage: true });
  console.log("✓ Captura 2 guardada (Azul Empresarial):", pathAzul);

  // Captura 3: Verde Esmeralda
  console.log("Probando Verde Esmeralda...");
  await page.locator("text=Verde Esmeralda").first().click();
  await page.waitForTimeout(600);
  const pathEsmeralda = path.join(outputDir, "3-tema-verde-esmeralda.png");
  await page.screenshot({ path: pathEsmeralda, fullPage: true });
  console.log("✓ Captura 3 guardada (Verde Esmeralda):", pathEsmeralda);

  // Captura 4: Rosa Elegante
  console.log("Probando Rosa Elegante...");
  await page.locator("text=Rosa Elegante").first().click();
  await page.waitForTimeout(600);
  const pathRosa = path.join(outputDir, "4-tema-rosa-elegante.png");
  await page.screenshot({ path: pathRosa, fullPage: true });
  console.log("✓ Captura 4 guardada (Rosa Elegante):", pathRosa);

  // 3. Ir a Punto de Venta (POS) y verificar 3 formas de pago y selector de transferencia
  console.log("Navegando al POS (/caja)...");
  await page.goto("http://localhost:3000/caja");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Seleccionar Transferencia en el mostrador
  console.log("Seleccionando forma de pago Transferencia en POS...");
  await page.locator("text=Transferencia").first().click();
  await page.waitForTimeout(600);

  const pathPOS = path.join(outputDir, "5-pos-transferencia-politica-a.png");
  await page.screenshot({ path: pathPOS, fullPage: true });
  console.log("✓ Captura 5 guardada (POS Transferencia Política A):", pathPOS);

  await browser.close();
  console.log("================================================================================");
  console.log("✓ TODAS LAS CAPTURAS VISUALES GENERADAS EXITOSAMENTE EN:", outputDir);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Error al capturar temas:", err);
  process.exit(1);
});
