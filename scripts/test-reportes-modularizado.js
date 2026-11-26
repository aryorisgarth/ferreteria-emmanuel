const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/1e506398-5df2-43a6-9977-2fa51fd6170d');

async function probarReportes() {
  console.log('Iniciando Chromium para validar /reportes modularizado...');
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

  console.log('2. Navegando a /reportes...');
  await page.goto('http://localhost:3000/reportes', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Captura 1: Vista principal de reportes (Inventario General de Existencias)
  console.log('Captura 1: Inventario General...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reportes-01-inventario-general.png') });

  // Cambiar a reporte de Lista de Precios
  console.log('3. Seleccionando Lista Oficial de Precios...');
  await page.click('button:has-text("Lista Oficial de Precios")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reportes-02-lista-precios.png') });

  // Cambiar a área Ventas y seleccionar Ventas por Período
  console.log('4. Filtrando área Ventas...');
  await page.click('button:has-text("Ventas y Rentabilidad")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Ventas por Período")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reportes-03-ventas-periodo.png') });

  await browser.close();
  console.log('✓ Pruebas de /reportes finalizadas con éxito.');
}

probarReportes().catch((err) => {
  console.error('Error en prueba de reportes:', err);
  process.exit(1);
});
