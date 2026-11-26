const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/1e506398-5df2-43a6-9977-2fa51fd6170d');

async function run() {
  console.log('Iniciando Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // 1. Autenticación como Admin en http://localhost:3000/
  console.log('1. Autenticando en http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('✓ Login exitoso.');

  // 2. Navegar a /caja
  console.log('2. Abriendo /caja...');
  await page.goto('http://localhost:3000/caja', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  // PRUEBA 1: POS inicialmente vacío (tabla vacía, sin catálogo permanente)
  console.log('Captura 1: POS inicialmente vacío...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-01-inicial-vacio.png'), fullPage: false });

  // PRUEBA 2: Abrir modal amplio de catálogo (clic en "Todas")
  console.log('Captura 2: Abrir catálogo...');
  await page.click('button:has-text("Todas")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-02-modal-catalogo-amplio.png'), fullPage: false });

  // PRUEBA 3: Selección de varios productos desde el modal sin cerrarlo
  console.log('Captura 3: Seleccionando productos en el modal...');
  const botonesAgregar = page.locator('button:has-text("Agregar")');
  const count = await botonesAgregar.count();
  console.log(`Botones Agregar encontrados: ${count}`);
  if (count > 0) {
    await botonesAgregar.nth(0).click();
    await page.waitForTimeout(250);
  }
  if (count > 1) {
    await botonesAgregar.nth(1).click();
    await page.waitForTimeout(250);
  }
  if (count > 2) {
    await botonesAgregar.nth(2).click();
    await page.waitForTimeout(250);
  }

  // Cerrar modal
  await page.click('button:has-text("Listo / Volver a Caja")');
  await page.waitForTimeout(600);

  // PRUEBA 4 y 5: Tabla izquierda actualizada y ticket derecho sincronizado
  console.log('Captura 4: Tabla izquierda y Ticket derecho sincronizados...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-03-articulos-y-ticket-sincronizado.png'), fullPage: false });

  // PRUEBA 6: Modificar cantidades en la tabla izquierda
  console.log('Modificando cantidades...');
  const btnSumar = page.locator('button[title="Sumar 1"]').first();
  if (await btnSumar.count() > 0) {
    await btnSumar.click();
    await page.waitForTimeout(250);
    await btnSumar.click();
    await page.waitForTimeout(250);
  }

  // PRUEBA 7: Eliminar un artículo de la tabla
  console.log('Eliminando un artículo...');
  const btnEliminar = page.locator('button[title="Eliminar artículo de la venta"]');
  if (await btnEliminar.count() > 1) {
    await btnEliminar.last().click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-04-cantidades-y-eliminacion.png'), fullPage: false });

  // PRUEBA 8: Cargar Cotización Autorizada [F7] (verificando fondo claro)
  console.log('Abriendo modal Cargar Cotización...');
  await page.click('button:has-text("Cargar Cotización [F7]")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-05-modal-cotizacion-fondo-claro.png'), fullPage: false });
  await page.click('button:has-text("Cerrar")');
  await page.waitForTimeout(300);

  // PRUEBA 9: Modal de Cobro
  console.log('Abriendo modal de cobro...');
  await page.click('button:has-text("Cobrar [F12]")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-06-modal-cobro.png'), fullPage: false });
  await page.click('button:has-text("Cancelar")');
  await page.waitForTimeout(300);

  // PRUEBA 10: Tablet (1024x768) y Móvil (390x844)
  console.log('Captura Tablet (1024x768)...');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-07-tablet-1024x768.png'), fullPage: false });

  console.log('Captura Móvil (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pos-final-08-movil-390x844.png'), fullPage: false });

  await browser.close();
  console.log('¡TODAS LAS PRUEBAS PLAYWRIGHT COMPLETADAS CON ÉXITO!');
}

run().catch((err) => {
  console.error('Error en validación Playwright:', err);
  process.exit(1);
});
