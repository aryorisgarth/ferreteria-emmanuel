const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/1e506398-5df2-43a6-9977-2fa51fd6170d');

async function probarInventario() {
  console.log('Iniciando Chromium para validar /inventario modularizado...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log('1. Autenticando en http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('✓ Login exitoso.');

  console.log('2. Navegando a /inventario...');
  await page.goto('http://localhost:3000/inventario', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Captura 1: Vista principal del catálogo de inventario con KPIs y tabla
  console.log('Captura 1: Catálogo principal...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'inventario-01-catalogo-principal.png') });

  // Abrir Modal Nuevo Artículo
  console.log('3. Abriendo Modal Nuevo Artículo...');
  await page.click('button:has-text("Nuevo Artículo")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'inventario-02-modal-nuevo-articulo.png') });

  // Cerrar modal
  console.log('Cerrando modal...');
  await page.click('button:has-text("Cancelar")');
  await page.waitForTimeout(500);

  // Cambiar a pestaña Ajustes
  console.log('4. Navegando a Pestaña Ajustes...');
  await page.click('button:has-text("Ajustes de Inventario")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'inventario-03-pestana-ajustes.png') });

  // Cambiar a pestaña Conteo Físico
  console.log('5. Navegando a Pestaña Conteo Físico...');
  await page.click('button:has-text("Conteo Físico")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'inventario-04-pestana-conteos.png') });

  await browser.close();
  console.log('✓ Pruebas de /inventario finalizadas con éxito.');
}

probarInventario().catch((err) => {
  console.error('Error en prueba de inventario:', err);
  process.exit(1);
});
