import { test, expect } from "@playwright/test";
import {
  inicializarEntornoE2EAislado,
  obtenerControlArchivosReales,
  verificarInviolabilidadDatosReales,
} from "./setup-isolated-data";

let controlArchivosRealesInicial: any;

test.beforeAll(async () => {
  controlArchivosRealesInicial = obtenerControlArchivosReales();
  inicializarEntornoE2EAislado();
});

test.afterAll(async () => {
  verificarInviolabilidadDatosReales(controlArchivosRealesInicial);
});

test.describe.serial("Identidad Visual Oficial — Ferretería Emmanuel", () => {
  test("1. Los recursos estáticos de identidad responden con HTTP 200", async ({
    request,
  }) => {
    // 1. Favicon
    const resFavicon = await request.get("/favicon.ico");
    expect(resFavicon.status()).toBe(200);

    // 2. Iconos de aplicación
    const resIcon = await request.get("/icon.png");
    expect(resIcon.status()).toBe(200);

    const resAppleIcon = await request.get("/apple-icon.png");
    expect(resAppleIcon.status()).toBe(200);

    const resIcon192 = await request.get("/icon-192.png");
    expect(resIcon192.status()).toBe(200);

    const resIcon512 = await request.get("/icon-512.png");
    expect(resIcon512.status()).toBe(200);

    // 3. Logo oficial completo e isotipo
    const resLogoOficial = await request.get("/logo-oficial.png");
    expect(resLogoOficial.status()).toBe(200);

    const resIsotipo = await request.get("/isotipo.png");
    expect(resIsotipo.status()).toBe(200);
  });

  test("2. El manifiesto web PWA se carga y contiene la identidad oficial", async ({
    request,
  }) => {
    const resManifest = await request.get("/manifest.webmanifest");
    expect(resManifest.status()).toBe(200);
    const data = await resManifest.json();

    expect(data.name).toBe("Ferretería Emmanuel");
    expect(data.short_name).toBe("Emmanuel");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe("#1E293B");
    expect(data.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = data.icons.some(
      (i: any) => i.src.includes("icon-192") && i.sizes.includes("192")
    );
    const has512 = data.icons.some(
      (i: any) => i.src.includes("icon-512") && i.sizes.includes("512")
    );
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  test("3. La cabecera HTML enlaza los iconos y el manifest en la página de inicio/login", async ({
    page,
  }) => {
    await page.goto("/");

    // Comprobar etiquetas en el head
    const faviconLink = page.locator('link[rel*="icon"]');
    await expect(faviconLink.first()).toBeAttached();

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon.first()).toBeAttached();

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();

    // Comprobar que el logo oficial está visible en el login
    const logoImg = page.locator('img[alt="Ferretería Emmanuel - Logo Oficial"]').first();
    await expect(logoImg).toBeVisible();

    // Verificar que la imagen del logo cargó efectivamente (naturalWidth > 0)
    const naturalWidth = await logoImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    const naturalHeight = await logoImg.evaluate((el: HTMLImageElement) => el.naturalHeight);
    expect(naturalWidth).toBeGreaterThan(0);
    expect(naturalHeight).toBeGreaterThan(0);

    // Verificar proporción aproximada del logo (~4:1)
    const ratio = naturalWidth / naturalHeight;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.5);
  });

  test("4. El logo oficial se visualiza correctamente en el encabezado del sistema tras iniciar sesión", async ({
    page,
  }) => {
    await page.goto("/");
    await page.fill('input[name="usuario"]', "cajero");
    await page.fill('input[name="clave"]', "caja123");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(caja|inicio)/);

    // Comprobar logotipo en la barra de navegación superior
    const headerLogo = page.locator('header img[alt="Ferretería Emmanuel - Logo Oficial"]').first();
    await expect(headerLogo).toBeVisible();

    const nw = await headerLogo.evaluate((el: HTMLImageElement) => el.naturalWidth);
    const nh = await headerLogo.evaluate((el: HTMLImageElement) => el.naturalHeight);
    expect(nw).toBeGreaterThan(0);
    expect(nh).toBeGreaterThan(0);
  });

  test("5. Comprobación de vista móvil sin desbordamientos y con proporción preservada", async ({
    page,
  }) => {
    // Configurar viewport móvil típico (iPhone SE / Android)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // El logo en móvil debe ser visible y no causar scroll horizontal
    const logoMobile = page.locator('img[alt="Ferretería Emmanuel - Logo Oficial"]').first();
    await expect(logoMobile).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
