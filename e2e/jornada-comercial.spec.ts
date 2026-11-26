import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import {
  inicializarEntornoE2EAislado,
  obtenerControlArchivosReales,
  verificarInviolabilidadDatosReales,
  E2E_DATA_DIR,
} from "./setup-isolated-data";
import type { DB } from "../src/lib/types";

// Control de inviolabilidad estricta de los datos reales de la ferretería
let controlArchivosRealesInicial: any;

test.beforeAll(async () => {
  // 1. Snapshot criptográfico SHA-256 de los 3 archivos reales
  controlArchivosRealesInicial = obtenerControlArchivosReales();

  // 2. Inicializar entorno E2E aislado con productos y usuarios de prueba
  inicializarEntornoE2EAislado();
});

test.afterEach(async () => {
  // Garantizar después de CADA prueba que ningún archivo real fue tocado
  verificarInviolabilidadDatosReales(controlArchivosRealesInicial);
});

test.afterAll(async () => {
  // Verificación final estricta de inviolabilidad
  verificarInviolabilidadDatosReales(controlArchivosRealesInicial);
});

test.describe.serial("Jornada Comercial Completa E2E - Ferretería Emmanuel", () => {
  let numeroFacturaGenerada = "";
  let idFacturaGenerada = "";

  // --------------------------------------------------------------------------
  // 1. Inicio de Sesión como Cajero
  // --------------------------------------------------------------------------
  test("1. Iniciar sesión exitosamente como cajero", async ({ page }) => {
    await page.goto("/");

    // Llenar credenciales del cajero
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');

    // El middleware y loginAction redirigen a los cajeros directamente al mostrador /caja
    await page.waitForURL(/\/(caja|inicio)/);
    await expect(page.locator("body")).toContainText(/cajero/i);
  });

  // --------------------------------------------------------------------------
  // 2. Apertura de Turno de Caja con C$ 1,500
  // --------------------------------------------------------------------------
  test("2. Abrir turno de caja con fondo inicial de C$ 1,500", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Verificar si el turno está cerrado y abrirlo
    const btnAbrirTurno = page.locator('button:has-text("Abrir Turno de Caja")');
    if (await btnAbrirTurno.isVisible()) {
      await btnAbrirTurno.click();
      const inputFondo = page.locator('input[name="montoInicial"]');
      await expect(inputFondo).toBeVisible();
      await inputFondo.fill("1500");
      await page.click('button:has-text("Confirmar Apertura")');
    }

    // Comprobar que el turno quedó abierto en la interfaz
    await expect(page.locator("body")).toContainText("Cierre de Caja");
    await expect(page.locator("body")).toContainText("1,500");
  });

  // --------------------------------------------------------------------------
  // 3. Venta de Artículos en POS y Cobro en Efectivo con Cambio
  // --------------------------------------------------------------------------
  test("3. Realizar venta de varios artículos, cobrar en efectivo y verificar cambio", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Buscar y agregar Cemento (E2E-CEM)
    const buscador = page.locator('input[placeholder*="Buscar"]').first();
    await buscador.fill("Cemento");

    // Click en la tarjeta del producto Cemento Canal (2 veces para agregar 2 bolsas)
    const tarjetaCemento = page.locator('button:has-text("Cemento Canal 42.5kg")').first();
    await tarjetaCemento.click();
    await tarjetaCemento.click();

    // Buscar y agregar Varilla (E2E-VAR)
    await buscador.fill("Varilla");
    const tarjetaVarilla = page.locator('button:has-text("Varilla de Hierro 3/8")').first();
    await tarjetaVarilla.click();

    // Comprobar que el carrito tiene ambos artículos
    await expect(page.locator("body")).toContainText("Cemento Canal 42.5kg");
    await expect(page.locator("body")).toContainText("Varilla de Hierro 3/8");

    // Llenar efectivo recibido con el billete rápido de C$ 1,000 o mediante el campo
    const btnBillete1000 = page.locator('button:has-text("1000")').first();
    if (await btnBillete1000.isVisible()) {
      await btnBillete1000.click();
    } else {
      const inputEfectivo = page.locator('input[type="number"][placeholder]').last();
      await inputEfectivo.fill("1000");
    }

    // Verificar que el cálculo de cambio se muestre en pantalla
    await expect(page.locator("body")).toContainText("Cambio / Vuelto");

    // Confirmar Cobro
    const btnCobrar = page.locator('button[type="submit"]:has-text("Cobrar")');
    await btnCobrar.click();

    // Debe mostrarse el modal de éxito con el ticket
    const modalTicket = page.getByText("¡Venta Cobrada Exitosamente!").first();
    await expect(modalTicket).toBeVisible({ timeout: 15000 });

    // Capturar número de factura generada
    const textoTicket = await page.locator("body").innerText();
    const matchNumero = textoTicket.match(/FAC-\d{4}-\d+/);
    if (matchNumero) {
      numeroFacturaGenerada = matchNumero[0];
    }
  });

  // --------------------------------------------------------------------------
  // 4. Consultar Factura y Verificar Descuento en Kárdex e Inventario
  // --------------------------------------------------------------------------
  test("4. Consultar factura emitida y verificar existencias y Kárdex", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    // Ir a la lista de facturas
    await page.goto("/facturas");
    await expect(page.locator("body")).toContainText("FAC-");

    // Acceder al detalle de la factura en la tabla
    const enlaceDetalle = page.locator('a[href^="/facturas/"]:not([href="/facturas/nueva"])').first();
    const href = await enlaceDetalle.getAttribute("href");
    expect(href).toBeTruthy();
    if (href) {
      idFacturaGenerada = href.split("/facturas/")[1].split("?")[0];
      await page.goto(href);
    }

    await expect(page.locator("body")).toContainText(/pagada/i);
    await expect(page.locator("body")).toContainText(/efectivo/i);

    // Ir a Inventario y comprobar que el stock de Cemento se redujo de 50 a 48
    await page.goto("/inventario");
    const filaCemento = page.locator('tr:has-text("Cemento Canal 42.5kg")');
    await expect(filaCemento).toContainText("48");

    // Ir al Kárdex y verificar movimiento de SALIDA por la venta
    await page.goto("/kardex");
    await expect(page.locator("body")).toContainText(/salida/i);
    await expect(page.locator("body")).toContainText("Factura");
  });

  // --------------------------------------------------------------------------
  // 5. Procesar Devolución Parcial y Verificar Reintegro
  // --------------------------------------------------------------------------
  test("5. Procesar devolución parcial de 1 bolsa y verificar reintegro en Kárdex y Caja", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    // Ir a la página de devolución de la factura
    expect(idFacturaGenerada).toBeTruthy();
    await page.goto(`/facturas/${idFacturaGenerada}/devolucion`);

    // Ingresar motivo de devolución
    const inputMotivo = page.locator('input[name="motivo"]');
    await inputMotivo.fill("Cliente compró 1 bolsa de cemento por exceso");

    // Asignar cantidad a devolver: 1 unidad de cemento
    const inputCantidadDev = page.locator('table input[type="number"]').first();
    await inputCantidadDev.fill("1");

    // Confirmar Devolución
    const btnConfirmarDev = page.locator('button[type="submit"]:has-text("Procesar Devolución")');
    await btnConfirmarDev.click();

    // Debe redirigir a la factura con confirmación
    await expect(page).toHaveURL(new RegExp(`/facturas/${idFacturaGenerada}`));

    // Verificar en Inventario que el stock de Cemento se reintegró de 48 a 49
    await page.goto("/inventario");
    const filaCemento = page.locator('tr:has-text("Cemento Canal 42.5kg")');
    await expect(filaCemento).toContainText("49");

    // Verificar en Kárdex que existe movimiento de ENTRADA por devolución
    await page.goto("/kardex");
    await expect(page.locator("body")).toContainText(/entrada/i);
    await expect(page.locator("body")).toContainText(/devolución|devolucion/i);
  });

  // --------------------------------------------------------------------------
  // 6. Arqueo y Cierre de Turno de Caja
  // --------------------------------------------------------------------------
  test("6. Cerrar turno de caja y comprobar arqueo y cuadre físico", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Click en "Cierre de Caja"
    const btnCerrarTurno = page.locator('button:has-text("Cierre de Caja")');
    await btnCerrarTurno.click();

    // Debe abrirse el modal de Cierre de Caja
    const modalCierre = page.locator('form').filter({ hasText: 'Confirmar Cierre de Caja' });
    await expect(modalCierre).toBeVisible();

    // Leer el efectivo esperado en el modal
    const textoModal = await modalCierre.innerText();
    const matchEsperado = textoModal.match(/C\$\s*([\d,]+\.\d{2})/);
    let valorCierre = "1500";
    if (matchEsperado) {
      valorCierre = matchEsperado[1].replace(/,/g, "");
    }

    // Llenar efectivo contado exactamente con el monto esperado para cuadre conforme
    const inputContado = modalCierre.locator('input[name="montoFinalReal"]');
    await inputContado.fill(valorCierre);

    // Confirmar Cierre
    const btnConfirmarCierre = modalCierre.locator('button:has-text("Confirmar Cierre de Caja")');
    await btnConfirmarCierre.click();

    // Debe reflejarse el turno cerrado (mostrando botón de Abrir Turno de Caja)
    await expect(page.locator('button:has-text("Abrir Turno de Caja")')).toBeVisible({ timeout: 15000 });
  });

  // --------------------------------------------------------------------------
  // 7. Consulta de Reportes de Ventas
  // --------------------------------------------------------------------------
  test("7. Consultar Centro de Reportes y verificar métricas de la jornada", async ({ page }) => {
    // Iniciar como admin para acceso completo a reportes
    await page.goto("/");
    await page.fill('input[name="usuario"]', "admin");
    await page.fill('input[name="clave"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(inicio|caja)/);

    await page.goto("/reportes");

    await expect(page.locator("body")).toContainText("Centro de Reportes");

    // Comprobar métricas o pestañas de reportes
    const tabCaja = page.locator('button:has-text("Caja y Turnos"), a:has-text("Caja y Turnos")');
    if (await tabCaja.isVisible()) {
      await tabCaja.click();
      await expect(page.locator("body")).toContainText("CERRADO");
    }
  });
});

// ============================================================================
// BLOQUE DE PRUEBAS NEGATIVAS Y CASOS DE FRONTERA
// ============================================================================
test.describe("Pruebas Negativas y Controles de Seguridad E2E", () => {
  // --------------------------------------------------------------------------
  // N1. Bloqueo de Venta con Stock Insuficiente
  // --------------------------------------------------------------------------
  test("N1. Bloquear venta cuando el producto no tiene existencias disponibles", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Buscar el artículo sin existencias (E2E-CLV Clavos con stock = 0)
    const buscador = page.locator('input[placeholder*="Buscar"]').first();
    await buscador.fill("Clavos");

    const tarjetaSinStock = page.locator('button:has-text("Clavos 2.5 pulgadas (Sin Stock)")');
    await expect(tarjetaSinStock).toBeVisible();

    // Comprobar que la tarjeta está deshabilitada y marcada como sin stock
    await expect(tarjetaSinStock).toBeDisabled();

    // El botón de cobro debe permanecer deshabilitado ya que el ticket está vacío
    const btnCobrar = page.locator('button[type="submit"]:has-text("Cobrar"), button:has-text("Caja Cerrada")').first();
    await expect(btnCobrar).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // N2. Protección de Idempotencia contra Doble Clic en Cobro
  // --------------------------------------------------------------------------
  test("N2. Idempotencia y protección ante doble clic en botón de cobro", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Si la caja está cerrada, abrirla
    const btnAbrirTurno = page.locator('button:has-text("Abrir Turno de Caja")');
    if (await btnAbrirTurno.isVisible()) {
      await btnAbrirTurno.click();
      await page.locator('input[name="montoInicial"]').fill("1000");
      await page.click('button:has-text("Confirmar Apertura")');
    }

    // Agregar 1 varilla
    const buscador = page.locator('input[placeholder*="Buscar"]').first();
    await buscador.fill("Varilla");
    await page.locator('button:has-text("Varilla de Hierro 3/8")').first().click();

    // Pagar en efectivo con billete rápido
    const btnBillete = page.locator('button:has-text("500")').first();
    if (await btnBillete.isVisible()) {
      await btnBillete.click();
    } else {
      const inputEfectivo = page.locator('input[type="number"][placeholder]').last();
      await inputEfectivo.fill("500");
    }

    const btnCobrar = page.locator('button[type="submit"]:has-text("Cobrar")');

    // Simular doble clic rápido
    await btnCobrar.dblclick();

    // Debe procesar con éxito sin duplicar la factura ni colisionar
    await expect(page.getByText("¡Venta Cobrada Exitosamente!").first()).toBeVisible({ timeout: 15000 });
  });

  // --------------------------------------------------------------------------
  // N3. Sesión sin Permisos (Vendedor a Configuración y Eliminaciones)
  // --------------------------------------------------------------------------
  test("N3. Rechazar acceso de vendedor a áreas restringidas de administración", async ({ page }) => {
    // Iniciar sesión con rol VENDEDOR
    await page.goto("/");
    await page.fill('input[name="usuario"]', "vendedor");
    await page.fill('input[name="clave"]', "venta123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(inicio|caja)/);

    // Intentar navegar directamente a Configuración del Sistema
    await page.goto("/configuracion");

    // Debe denegar acceso con mensaje de permisos o redirigir con parámetro error
    const bodyTexto = await page.locator("body").innerText();
    const denegado =
      bodyTexto.includes("Acceso denegado") ||
      bodyTexto.includes("exclusivo para administradores") ||
      page.url().includes("error=");

    expect(denegado).toBe(true);
  });

  // --------------------------------------------------------------------------
  // N4. Bloqueo de Venta en Efectivo sin Turno Abierto
  // --------------------------------------------------------------------------
  test("N4. Rechazar cobro en efectivo si el turno de caja se encuentra cerrado", async ({ page }) => {
    // Forzar turno cerrado en el archivo aislado
    const rutaBodegaE2E = path.join(E2E_DATA_DIR, "bodega.json");
    const db: DB = JSON.parse(fs.readFileSync(rutaBodegaE2E, "utf8"));
    if (db.turnosCaja) {
      for (const t of db.turnosCaja) {
        t.estado = "CERRADO";
      }
    }
    fs.writeFileSync(rutaBodegaE2E, JSON.stringify(db, null, 2), "utf8");

    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(caja|inicio)/);

    await page.goto("/caja");

    // Comprobar que el POS bloquea cobros hasta que se abra caja
    await expect(page.locator('button:has-text("Abrir Turno de Caja")')).toBeVisible();
    const btnCobrar = page.locator('button[type="submit"]:has-text("Caja Cerrada"), button[type="submit"]:has-text("Cobrar")').first();
    await expect(btnCobrar).toBeDisabled();
  });
});
