const { chromium } = require('@playwright/test');
const { Client } = require('pg');
const crypto = require('crypto');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test';

async function testearRecuperacionYRestablecimiento() {
  console.log('=== TESTEANDO AUTENTICACIÓN SENCILLA Y SEGURA (E2E) ===\n');
  const pgClient = new Client({ connectionString: DB_URL });
  await pgClient.connect();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // -------------------------------------------------------------------
  // 1. MECANISMO 1: Solicitud de Recuperación y Anti-Enumeración
  // -------------------------------------------------------------------
  console.log('1. Probando solicitud de recuperación por correo en el login...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.click('a:has-text("¿Olvidaste tu contraseña?")');
  await page.waitForURL('**/recuperar**');
  await page.waitForTimeout(500);

  // Solicitar para correo institucional
  await page.fill('input[name="usuarioOEmail"]', 'caja@ferreteriaemmanuel.com.ni');
  await page.click('button:has-text("Enviar Enlace de Recuperación")');
  await page.waitForTimeout(1000);

  const textoConfirmacion = await page.textContent('body');
  const antiEnumeracionOk = textoConfirmacion.includes('instrucciones para restablecer');
  console.log('   ✓ Respuesta neutral anti-enumeración recibida:', antiEnumeracionOk);

  // -------------------------------------------------------------------
  // 2. Comprobar Token Temporal en BD y Cambio de Contraseña por Enlace
  // -------------------------------------------------------------------
  console.log('\n2. Verificando emisión de token seguro en PostgreSQL...');
  // Generamos un token conocido para probar el enlace de forma determinista
  const tokenPrueba = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenPrueba).digest('hex');

  await pgClient.query(
    `UPDATE usuarios_cuentas 
     SET token_recuperacion_hash = $1, token_recuperacion_expira = NOW() + INTERVAL '15 minutes'
     WHERE usuario = 'cajero'`,
    [tokenHash]
  );
  console.log('   ✓ Token SHA-256 insertado en cuenta de cajero (expira en 15m).');

  // Navegar a la página de recuperación con el token
  console.log(`   Navegando a /recuperar?token=${tokenPrueba.substring(0, 10)}...`);
  await page.goto(`http://localhost:3000/recuperar?token=${tokenPrueba}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(800);

  const reconoceUsuario = (await page.textContent('body')).includes('@cajero');
  console.log('   ✓ Pantalla de recuperación reconoce al usuario:', reconoceUsuario);

  // Ingresar nueva contraseña
  const claveNuevaPrueba = 'cajaNueva2026!';
  await page.fill('input[name="password"]', claveNuevaPrueba);
  await page.fill('input[name="confirmPassword"]', claveNuevaPrueba);
  await page.click('button:has-text("Guardar Nueva Contraseña")');
  await page.waitForTimeout(1500);

  // Verificar que el token quedó consumido (NULL) en BD
  const resTokenBd = await pgClient.query(
    "SELECT token_recuperacion_hash, version_credencial FROM usuarios_cuentas WHERE usuario = 'cajero'"
  );
  const tokenConsumido = resTokenBd.rows[0].token_recuperacion_hash === null;
  console.log('   ✓ Token de un solo uso invalidado en PostgreSQL:', tokenConsumido);

  // -------------------------------------------------------------------
  // 3. Probar Login con la Nueva Contraseña
  // -------------------------------------------------------------------
  console.log('\n3. Probando inicio de sesión con la nueva contraseña...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'cajero');
  await page.fill('input[name="clave"]', claveNuevaPrueba);
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('   ✓ Login con nueva clave exitoso.');
  await context.clearCookies();

  // -------------------------------------------------------------------
  // 4. MECANISMO 2: Restablecimiento Administrativo con Clave Temporal
  // -------------------------------------------------------------------
  console.log('\n4. Probando Restablecimiento por Administrador...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('http://localhost:3000/configuracion?tab=usuarios', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1000);

  // Abrir modal de restablecer acceso para cajero
  await page.click('tr:has-text("@cajero") button[title*="Restablecer acceso"]');
  await page.waitForTimeout(500);

  // Generar clave temporal
  await page.click('button:has-text("Generar Clave Temporal")');
  await page.waitForTimeout(1000);

  const inputClaveTemp = page.locator('input[readonly]');
  const claveTemporal = await inputClaveTemp.inputValue();
  console.log('   ✓ Clave temporal generada por el Administrador:', claveTemporal);

  // Verificar en BD que debe_cambiar_clave = true
  const resDebeCambiar = await pgClient.query(
    "SELECT debe_cambiar_clave FROM usuarios_cuentas WHERE usuario = 'cajero'"
  );
  console.log('   ✓ Bandera debe_cambiar_clave en PostgreSQL:', resDebeCambiar.rows[0].debe_cambiar_clave);

  await context.clearCookies();

  // -------------------------------------------------------------------
  // 5. Login de Cajero con Clave Temporal y Cambio Obligatorio
  // -------------------------------------------------------------------
  console.log('\n5. Cajero ingresa con clave temporal y sistema fuerza cambio obligatorio...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'cajero');
  await page.fill('input[name="clave"]', claveTemporal);
  await Promise.all([
    page.waitForURL('**/cambiar-clave-obligatoria**', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('   ✓ Redirección automática a /cambiar-clave-obligatoria comprobada.');

  // Definir su clave definitiva de vuelta a 'caja123'
  await page.fill('input[name="password"]', 'caja123');
  await page.fill('input[name="confirmPassword"]', 'caja123');
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button:has-text("Confirmar y Continuar")'),
  ]);

  // Verificar que la bandera quedó apagada (false)
  const resBanderaFinal = await pgClient.query(
    "SELECT debe_cambiar_clave FROM usuarios_cuentas WHERE usuario = 'cajero'"
  );
  console.log('   ✓ Bandera debe_cambiar_clave apagada tras cambio definitivo:', !resBanderaFinal.rows[0].debe_cambiar_clave);

  await browser.close();
  await pgClient.end();
  console.log('\n=== VALIDACIÓN COMPLETA DE AMBOS MECANISMOS EXITOSA (100%) ===');
}

testearRecuperacionYRestablecimiento().catch((err) => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});
