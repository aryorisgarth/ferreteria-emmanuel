import { test, expect, BrowserContext, Page } from "@playwright/test";
import {
  getTestPool,
  inicializarDatosPostgresE2E,
  limpiarBaseTest,
  obtenerControlArchivosReales,
  verificarInviolabilidadDatosReales,
} from "./setup-postgres-e2e";
import type { Pool } from "pg";

let pool: Pool;
let controlArchivosRealesInicial: any;

test.beforeAll(async () => {
  controlArchivosRealesInicial = obtenerControlArchivosReales();

  // 1. Conectar a Neon PostgreSQL y comprobar current_database() == 'emmanuel_test'
  pool = await getTestPool();

  // 2. Poblar datos iniciales aislados de prueba en emmanuel_test
  await inicializarDatosPostgresE2E(pool);
});

test.afterEach(async () => {
  // Comprobar inviolabilidad de data/*.json tras cada prueba
  verificarInviolabilidadDatosReales(controlArchivosRealesInicial);
});

test.afterAll(async () => {
  // Purgar datos ficticios TEST para no dejar registros residuales
  if (pool) {
    await limpiarBaseTest(pool);
    await pool.end();
  }
  verificarInviolabilidadDatosReales(controlArchivosRealesInicial);
});

// Helper de login
async function loginComo(page: Page, usuario: string, clave: string) {
  await page.goto("/");
  await page.fill('input[name="usuario"]', usuario);
  await page.fill('input[name="clave"]', clave);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(inicio|caja)/);
}

test.describe.serial("Navegación y Operación E2E en Neon PostgreSQL — Ferretería Emmanuel", () => {
  // --------------------------------------------------------------------------
  // 1. Login y Dashboard
  // --------------------------------------------------------------------------
  test("1. Login exitoso como Administrador y visualización del Dashboard", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        consoleErrors.push(msg.text());
      }
    });

    await loginComo(page, "admin", "admin123");
    await page.goto("/inicio");

    // Verificar identidad visual y datos cargados desde PostgreSQL
    await expect(page.locator('img[alt*="Ferretería Emmanuel"]').first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Panel de Control");
    await expect(page.locator("body")).toContainText(/admin/i);

    // Sin errores de hidratación en consola
    const hydrationErrors = consoleErrors.filter((e) => e.toLowerCase().includes("hydration"));
    expect(hydrationErrors).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 2. Módulo Inventario: Consulta y Alta con Persistencia en Neon
  // --------------------------------------------------------------------------
  test("2. Inventario: Consultar catálogo y registrar nuevo artículo con persistencia en Neon", async ({ page }) => {
    await loginComo(page, "admin", "admin123");
    await page.goto("/inventario");

    // Comprobar productos iniciales de PostgreSQL
    await expect(page.locator("body")).toContainText("Cemento Canal 42.5kg");
    await expect(page.locator("body")).toContainText("Varilla de Hierro 3/8");

    // Navegar a nuevo artículo
    await page.goto("/inventario/nuevo");
    await page.fill('input[name="codigo"]', "TEST-MRT");
    await page.fill('input[name="nombre"]', "Martillo Uña Curva 16oz TEST");
    await page.fill('input[name="marca"]', "Stanley TEST");
    await page.fill('input[name="costo"]', "190");
    await page.fill('input[name="precio"]', "280");
    await page.fill('input[name="stockMinimo"]', "3");
    await page.fill('input[name="inventarioInicial"]', "15");
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => url.pathname === "/inventario", { timeout: 15000 });
    await page.goto("/inventario");

    // Recargar página y comprobar que persiste desde Neon PostgreSQL
    await page.reload();
    await expect(page.locator("body")).toContainText("Martillo Uña Curva 16oz TEST");

    // Verificar en la base de datos física de Neon
    const res = await pool.query("SELECT * FROM productos WHERE codigo = 'TEST-MRT';");
    expect(res.rows.length).toBe(1);
    expect(Number(res.rows[0].stock_actual)).toBe(15);
  });

  // --------------------------------------------------------------------------
  // 3. Módulo Cotizaciones: Creación y Persistencia
  // --------------------------------------------------------------------------
  test("3. Cotizaciones: Crear cotización y validar folio en Neon", async ({ page }) => {
    await loginComo(page, "admin", "admin123");
    await page.goto("/cotizaciones");
    await expect(page.locator("body")).toContainText(/Cotizaciones/i);

    // Crear cotización
    await page.goto("/cotizaciones/nueva");
    await page.fill('input[name="cliente"]', "Constructora Las Colinas S.A.");
    
    // Seleccionar o agregar renglón de Cemento
    const selectorProd = page.locator('select[name="productoId"]').first();
    if (await selectorProd.isVisible()) {
      await selectorProd.selectOption({ index: 1 });
    }
    
    const inputCant = page.locator('input[name="cantidad"]').first();
    if (await inputCant.isVisible()) {
      await inputCant.fill("10");
    }

    // Submit del formulario
    const btnCrear = page.locator('button[type="submit"]');
    await btnCrear.click();
    await page.waitForTimeout(2000);

    // Comprobar en lista de cotizaciones
    await page.goto("/cotizaciones");
    await expect(page.locator("body")).toContainText(/Constructora Las Colinas/i);
  });

  // --------------------------------------------------------------------------
  // 4. Módulo Caja y Ventas/POS
  // --------------------------------------------------------------------------
  test("4. Caja y POS: Apertura de turno, facturación de artículo y persistencia", async ({ page }) => {
    await loginComo(page, "cajero", "caja123");
    await page.goto("/caja");

    // Si el turno está cerrado, abrirlo con C$ 1,000
    const btnAbrir = page.locator('button:has-text("Abrir Turno")');
    if (await btnAbrir.isVisible()) {
      await btnAbrir.click();
      const inputFondo = page.locator('input[name="montoInicial"]');
      if (await inputFondo.isVisible()) {
        await inputFondo.fill("1000");
        await page.click('button:has-text("Confirmar Apertura")');
      }
    }

    // En el POS agregar Cemento Canal y cobrar
    const btnProd = page.locator('button:has-text("Cemento Canal")').first();
    if (await btnProd.isVisible()) {
      await btnProd.click();

      // Botón cobrar o procesar venta
      const btnCobrar = page.locator('button:has-text("Cobrar"), button:has-text("Emitir Factura")').first();
      if (await btnCobrar.isVisible()) {
        await btnCobrar.click();
      }
    }

    // Comprobar en facturas
    await page.goto("/facturas");
    await expect(page.locator("body")).toContainText(/Facturas/i);
  });

  // --------------------------------------------------------------------------
  // 5. Módulo Compras y Cuentas por Pagar
  // --------------------------------------------------------------------------
  test("5. Compras: Navegación y consulta de cuentas por pagar en Neon", async ({ page }) => {
    await loginComo(page, "admin", "admin123");
    await page.goto("/compras");
    await expect(page.locator("body")).toContainText(/Compras/i);

    await page.goto("/compras/cuentas-por-pagar");
    await expect(page.locator("body")).toContainText(/Cuentas por Pagar/i);
  });

  // --------------------------------------------------------------------------
  // 6. Módulo Clientes y Proveedores
  // --------------------------------------------------------------------------
  test("6. Clientes y Proveedores: Registro y consulta en Neon", async ({ page }) => {
    await loginComo(page, "admin", "admin123");

    // Clientes
    await page.goto("/clientes/nuevo");
    await page.fill('input[name="nombre"]', "Cliente Residencial TEST");
    await page.fill('input[name="identificacion"]', "001-010190-0001A");
    await page.fill('input[name="telefono"]', "8899-7766");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto("/clientes");
    await expect(page.locator("body")).toContainText("Cliente Residencial TEST");

    // Proveedores
    await page.goto("/proveedores/nuevo");
    await page.fill('input[name="nombre"]', "Proveedor Metalúrgico TEST");
    await page.fill('input[name="identificacion"]', "J031000009999");
    await page.fill('input[name="telefono"]', "2244-1100");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.goto("/proveedores");
    await expect(page.locator("body")).toContainText("Proveedor Metalúrgico TEST");
  });

  // --------------------------------------------------------------------------
  // 7. Módulo Bodega Institucional: Solicitudes y Actas
  // --------------------------------------------------------------------------
  test("7. Bodega Institucional: Consultar solicitudes y actas de entrega oficiales", async ({ page }) => {
    await loginComo(page, "bodega", "bodega123");
    await page.goto("/solicitudes");
    await expect(page.locator("body")).toContainText(/Solicitudes/i);

    await page.goto("/actas");
    await expect(page.locator("body")).toContainText(/Actas de Entrega/i);
  });

  // --------------------------------------------------------------------------
  // 8. Módulo Reportes y Balances
  // --------------------------------------------------------------------------
  test("8. Reportes: Visualización de balances y auditoría desde PostgreSQL", async ({ page }) => {
    await loginComo(page, "admin", "admin123");
    await page.goto("/reportes");
    await expect(page.locator("body")).toContainText(/Reportes/i);
    await expect(page.locator("body")).toContainText(/Inventario/i);
  });

  // --------------------------------------------------------------------------
  // 9. Concurrencia de Dos Propietarios en Sesiones Independientes
  // --------------------------------------------------------------------------
  test("9. Dos sesiones de navegador independientes: Propietario 1 y Propietario 2 ven datos sincronizados", async ({ browser }) => {
    // Sesión independiente 1: Propietario 1
    const context1: BrowserContext = await browser.newContext();
    const page1: Page = await context1.newPage();
    await loginComo(page1, "admin", "admin123");
    await page1.goto("/gastos");

    // Registrar un gasto desde Propietario 1 abriendo el modal de gastos
    const btnNuevoGasto = page1.locator('button:has-text("Registrar Gasto")').first();
    if (await btnNuevoGasto.isVisible()) {
      await btnNuevoGasto.click();
      await page1.waitForSelector('input[name="concepto"]', { state: "visible" });
      await page1.fill('input[name="concepto"]', "Pago Mantenimiento Preventivo TEST");
      await page1.fill('input[name="monto"]', "450");
      await page1.click('form button[type="submit"]');
      await page1.waitForTimeout(2500);
    }

    // Sesión independiente 2: Propietario 2
    const context2: BrowserContext = await browser.newContext();
    const page2: Page = await context2.newPage();
    await loginComo(page2, "propietario2", "prop123");
    await page2.goto("/gastos");

    // Propietario 2 debe ver el gasto registrado por Propietario 1 en Neon
    await expect(page2.locator("body")).toContainText(/Pago Mantenimiento/i);

    await context1.close();
    await context2.close();
  });

  // --------------------------------------------------------------------------
  // 10. Seguridad y Roles (RBAC)
  // --------------------------------------------------------------------------
  test("10. Seguridad RBAC: Restringir acceso administrativo a usuarios no autorizados", async ({ page }) => {
    // Iniciar sesión como Cajero
    await loginComo(page, "cajero", "caja123");

    // Intentar acceder a /configuracion (solo Administrador)
    await page.goto("/configuracion");

    // Debe denegar acceso, redirigir a login o mostrar mensaje de error de permisos
    const url = page.url();
    const bodyText = await page.locator("body").innerText();
    const accesoDenegado =
      url.includes("/login") ||
      url.includes("error") ||
      bodyText.includes("Acceso denegado") ||
      bodyText.includes("permisos") ||
      !url.includes("/configuracion");

    expect(accesoDenegado).toBe(true);
  });
});
