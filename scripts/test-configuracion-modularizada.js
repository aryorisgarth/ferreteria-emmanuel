const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = path.resolve(
  'C:/Users/ADMIN/.gemini/antigravity/brain/1e506398-5df2-43a6-9977-2fa51fd6170d'
);

async function probarConfiguracion() {
  console.log('Iniciando Chromium para validar /configuracion adaptativo...');
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

  console.log('2. Navegando a /configuracion...');
  await page.goto('http://localhost:3000/configuracion', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(1500);

  // Captura 1: Escritorio - Empresa & RUC
  console.log('Captura 1: Escritorio - Empresa & RUC...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'configuracion-01-empresa-desktop.png'),
  });

  // Captura 2: Escritorio - Caja & Medios de Pago
  console.log('Captura 2: Caja & Medios de Pago (Política A)...');
  await page.click('aside button:has-text("Caja & Medios de Pago")');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'configuracion-02-caja-desktop.png'),
  });

  // Captura 3: Escritorio - Dispositivo & Hardware
  console.log('Captura 3: Dispositivo & Hardware...');
  await page.click('aside button:has-text("Dispositivo & Hardware")');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'configuracion-03-dispositivo-desktop.png'),
  });

  // Captura 4: Escritorio - Apariencia & Temas
  console.log('Captura 4: Apariencia & Temas...');
  await page.click('aside button:has-text("Apariencia & Temas")');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'configuracion-04-temas-desktop.png'),
  });

  // Captura 5: Móvil 390x844
  console.log('Captura 5: Vista Móvil 390x844...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'configuracion-05-movil.png'),
  });

  await browser.close();
  console.log('✓ Pruebas de /configuracion finalizadas con éxito.');
}

probarConfiguracion().catch((err) => {
  console.error('Error en prueba de configuracion:', err);
  process.exit(1);
});
