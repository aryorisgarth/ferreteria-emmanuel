const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/1e506398-5df2-43a6-9977-2fa51fd6170d');

async function probarCotizacion() {
  console.log('Iniciando Chromium para validar /cotizaciones/nueva modularizado...');
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

  console.log('2. Navegando a /cotizaciones/nueva...');
  await page.goto('http://localhost:3000/cotizaciones/nueva', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Captura 1: Formulario Nueva Cotización cargado
  console.log('Captura 1: Formulario Nueva Cotización...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cotizacion-01-formulario-nueva.png') });

  // Abrir Modal Nuevo Cliente
  console.log('3. Abriendo Modal Nuevo Cliente en Cotización...');
  await page.click('button:has-text("+ Nuevo Cliente")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cotizacion-02-modal-nuevo-cliente.png') });

  // Cerrar modal
  console.log('Cerrando modal cliente...');
  await page.click('button:has-text("Cancelar")');
  await page.waitForTimeout(400);

  // Probar buscador reactivo de artículos
  console.log('4. Probando buscador de artículos...');
  await page.fill('input[placeholder="Buscar artículo para agregar..."]', 'Tubo');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cotizacion-03-buscador-reactivo.png') });

  await browser.close();
  console.log('✓ Pruebas de /cotizaciones/nueva finalizadas con éxito.');
}

probarCotizacion().catch((err) => {
  console.error('Error en prueba de cotización:', err);
  process.exit(1);
});
