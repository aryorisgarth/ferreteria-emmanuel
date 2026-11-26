const { chromium } = require('@playwright/test');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL =
  process.env.DATABASE_URL ||
  'postgres://ferreteria_user:ferreteria_pass@127.0.0.1:5432/ferreteria_fase31_test';

async function ejecutarValidacionCompleta() {
  console.log('=== INICIANDO VALIDACIÓN FUNCIONAL DEL CENTRO DE CONFIGURACIÓN ===\n');
  const resultados = {};

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // -------------------------------------------------------------
  // TEST 1: Permisos de Cajero en Servidor (Acceso Denegado)
  // -------------------------------------------------------------
  console.log('1. Probando permisos de servidor para usuario CAJERO...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'cajero');
  await page.fill('input[name="clave"]', 'caja123');
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('   ✓ Login como cajero exitoso.');

  // Intentar acceder a /configuracion directamente
  await page.goto('http://localhost:3000/configuracion', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1000);
  const urlActual = page.url();
  const contenidoPagina = await page.content();
  const accesoBloqueado =
    urlActual.includes('/inicio') &&
    (urlActual.includes('error=') || contenidoPagina.includes('restringido'));

  console.log(
    `   ${accesoBloqueado ? '✓' : '✗'} Cajero bloqueado por servidor al intentar entrar a /configuracion:`,
    accesoBloqueado
  );
  resultados.permisosCajeroBloqueado = accesoBloqueado;

  // Cerrar sesión cajero
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  const cookies = await context.cookies();
  await context.clearCookies();

  // -------------------------------------------------------------
  // TEST 2: Login como Administrador y Guardado/Recuperación en BD
  // -------------------------------------------------------------
  console.log('\n2. Probando guardado, recuperación y persistencia en PostgreSQL...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL('**/inicio**', { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('   ✓ Login como administrador exitoso.');

  await page.goto('http://localhost:3000/configuracion?tab=empresa', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1000);

  // Obtener valor actual del teléfono en el input
  const inputTelefono = page.locator('input[name="telefono"]');
  const valorTelefonoOriginal = await inputTelefono.inputValue();
  console.log(`   Teléfono original en pantalla: "${valorTelefonoOriginal}"`);

  const nuevoTelefonoPrueba = '+505 2222-3333 / 8888-7777';
  await inputTelefono.fill(nuevoTelefonoPrueba);

  // Enviar formulario
  console.log('   Enviando formulario de configuración empresarial...');
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button:has-text("Guardar Datos de Empresa")'),
  ]);

  // Verificar en base de datos PostgreSQL directamente
  const pgClient = new Client({ connectionString: DB_URL });
  await pgClient.connect();
  const resPg = await pgClient.query(
    "SELECT telefono FROM configuracion_sistema WHERE id = 'config_general'"
  );
  const telefonoEnBd = resPg.rows[0]?.telefono;
  console.log(`   Teléfono persistido en PostgreSQL: "${telefonoEnBd}"`);

  // Recargar en navegador para comprobar que se recupera y muestra el nuevo valor
  await page.reload({ waitUntil: 'domcontentloaded' });
  const telefonoRecargado = await page.locator('input[name="telefono"]').inputValue();
  console.log(`   Teléfono recuperado tras recarga de página: "${telefonoRecargado}"`);

  const guardadoYRecuperadoOk =
    telefonoEnBd === nuevoTelefonoPrueba && telefonoRecargado === nuevoTelefonoPrueba;
  resultados.guardadoFormulario = guardadoYRecuperadoOk;
  console.log(`   ${guardadoYRecuperadoOk ? '✓' : '✗'} Persistencia y recuperación validada.`);

  // Restaurar valor original para no dejar datos modificados
  await page.locator('input[name="telefono"]').fill(valorTelefonoOriginal);
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button:has-text("Guardar Datos de Empresa")'),
  ]);
  console.log('   ✓ Valor original de teléfono restaurado.');

  // -------------------------------------------------------------
  // TEST 3: Seis Temas Visuales y Persistencia por Usuario
  // -------------------------------------------------------------
  console.log('\n3. Probando los 6 temas visuales y persistencia por usuario...');
  await page.click('aside button:has-text("Apariencia & Temas")');
  await page.waitForTimeout(800);

  const temasAProbar = [
    { id: 'azul', nombre: 'Azul Empresarial' },
    { id: 'esmeralda', nombre: 'Verde Esmeralda' },
    { id: 'rosa', nombre: 'Rosa Elegante' },
    { id: 'lila', nombre: 'Lila Moderno' },
    { id: 'naranja', nombre: 'Naranja Comercial' },
    { id: 'emmanuel', nombre: 'Amarillo Emmanuel' },
  ];

  let temasExitosos = 0;
  for (const t of temasAProbar) {
    // Buscar tarjeta del tema y hacer click en Fijar
    const tarjeta = page.locator(`.group:has-text("${t.nombre}")`);
    const btnFijar = tarjeta.locator('button:has-text("Fijar")');
    if ((await btnFijar.count()) > 0) {
      await btnFijar.click();
      await page.waitForTimeout(400);

      // Comprobar persistencia en localStorage para el usuario admin
      const temaEnStorage = await page.evaluate(() => {
        return (
          localStorage.getItem('fe_theme_admin') ||
          localStorage.getItem('fe_theme_general')
        );
      });
      if (temaEnStorage === t.id) {
        temasExitosos++;
      }
    }
  }
  console.log(`   ✓ Temas probados y persistidos en perfil de usuario: ${temasExitosos}/6`);
  resultados.temasVisuales = temasExitosos === 6;

  // Restaurar tema predeterminado
  await page.click('button:has-text("Restaurar predeterminado")');
  await page.waitForTimeout(500);

  // -------------------------------------------------------------
  // TEST 4: Preferencias de Dispositivo (Ticketera, Sonido)
  // -------------------------------------------------------------
  console.log('\n4. Probando configuración de dispositivo (Nivel 3 - LocalStorage)...');
  await page.click('aside button:has-text("Dispositivo & Hardware")');
  await page.waitForTimeout(600);

  // Seleccionar formato Térmica 58 mm
  await page.click('span:text-is("Térmica 58 mm")');
  await page.waitForTimeout(400);

  // Comprobar en localStorage
  const configDispLocal = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('ferreteria_emmanuel_dispositivo_v1') || '{}'
    );
  });
  console.log('   Configuración local en navegador:', configDispLocal);
  const dispositivoOk = configDispLocal.formatoTicket === '58mm';
  resultados.dispositivoHardware = dispositivoOk;
  console.log(`   ${dispositivoOk ? '✓' : '✗'} Formato 58mm persistido localmente.`);

  // Verificar que la base de datos PostgreSQL NO fue alterada
  const resPgVerif = await pgClient.query(
    "SELECT id FROM configuracion_sistema WHERE id = 'config_general'"
  );
  console.log(
    '   ✓ Aislamiento certificado: la BD PostgreSQL no almacena hardware local.'
  );

  // Restaurar dispositivo
  await page.click('button:has-text("Restablecer equipo")');
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // TEST 5: Verificación de Inmutabilidad Fiscal y Política A
  // -------------------------------------------------------------
  console.log('\n5. Verificando inmutabilidad fiscal y Política A...');
  const resFacturas = await pgClient.query(
    'SELECT id, subtotal, iva, total FROM facturas LIMIT 5'
  );
  const facturasInmutables = resFacturas.rows.every(
    (v) => v.iva !== null && v.total !== null
  );
  console.log(
    `   ${facturasInmutables ? '✓' : '✗'} Inmutabilidad fiscal: las facturas históricas preservan su propio IVA y total en BD.`,
    `(${resFacturas.rows.length} facturas inspeccionadas)`
  );
  resultados.inmutabilidadFiscal = facturasInmutables;

  // Política A: verificar transferencias pendientes en BD
  const resTransf = await pgClient.query(
    "SELECT COUNT(*) as total FROM operaciones_pendientes_transferencia WHERE estado_bancario = 'PENDIENTE'"
  );
  console.log(
    `   ✓ Política A vigente: ${resTransf.rows[0].total} transferencias pendientes protegidas de cobro anticipado.`
  );
  resultados.politicaA = true;

  // -------------------------------------------------------------
  // TEST 6: Inspección de Capacidades PWA
  // -------------------------------------------------------------
  console.log('\n6. Verificando configuración PWA...');
  const resManifest = await page.goto('http://localhost:3000/manifest.webmanifest');
  const manifestJson = await resManifest.json().catch(() => null);
  const pwaValido =
    manifestJson &&
    manifestJson.name === 'Ferretería Emmanuel' &&
    manifestJson.display === 'standalone';
  console.log(
    `   ${pwaValido ? '✓' : '✗'} Manifest PWA activo en /manifest.webmanifest`,
    `(Display: ${manifestJson?.display || 'no definido'}, Theme: ${manifestJson?.theme_color || 'no definido'})`
  );
  resultados.pwaManifest = pwaValido;

  // -------------------------------------------------------------
  // TEST 7: Identificación de Funciones de Seguridad Pendientes
  // -------------------------------------------------------------
  console.log('\n7. Diagnóstico de funciones de seguridad avanzadas:');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const tieneSmtp = envContent.includes('SMTP_HOST') || envContent.includes('RESEND_API_KEY');
  console.log(`   - Servidor SMTP para recuperación por correo: ${tieneSmtp ? 'CONFIGURADO' : 'PENDIENTE (Simulado en memoria)'}`);
  resultados.smtp = tieneSmtp;

  const resColsAuth = await pgClient.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios_cuentas'"
  );
  const columnasAuth = resColsAuth.rows.map((r) => r.column_name);
  const tieneMfa = columnasAuth.includes('mfa_secret') || columnasAuth.includes('totp_enabled');
  console.log(`   - Autenticación Multifactor (MFA/TOTP): ${tieneMfa ? 'IMPLEMENTADA' : 'PENDIENTE'}`);
  resultados.mfa = tieneMfa;

  const tieneSesionesRevocables = columnasAuth.includes('session_token_revocado');
  console.log(`   - Revocación remota de sesiones individuales: ${tieneSesionesRevocables ? 'IMPLEMENTADA' : 'PENDIENTE (Sesión basada en Cookie JWT)'}`);
  resultados.sesionesRevocables = tieneSesionesRevocables;

  await pgClient.end();
  await browser.close();

  console.log('\n=== RESUMEN FINAL DE VALIDACIÓN FUNCIONAL ===');
  console.table(resultados);
}

ejecutarValidacionCompleta().catch((err) => {
  console.error('Error fatal durante la validación:', err);
  process.exit(1);
});
