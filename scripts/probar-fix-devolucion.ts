import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Login...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="usuario"]', 'admin');
  await page.fill('input[name="clave"]', 'admin123');
  await Promise.all([
    page.waitForURL("**/inicio**", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("✓ Login exitoso.");

  console.log("2. Probando acceso a listado de facturas...");
  await page.goto("http://localhost:3000/facturas", { waitUntil: "domcontentloaded" });
  const enlaceFactura = await page.locator('a[href^="/facturas/fac_"]').first().getAttribute("href");
  console.log("Enlace encontrado:", enlaceFactura);

  if (enlaceFactura) {
    console.log(`3. Probando detalle de factura (${enlaceFactura})...`);
    const respDetalle = await page.goto(`http://localhost:3000${enlaceFactura}`, { waitUntil: "domcontentloaded" });
    console.log("Status detalle factura:", respDetalle?.status());

    console.log(`4. Probando formulario de devolución (${enlaceFactura}/devolucion)...`);
    const respDev = await page.goto(`http://localhost:3000${enlaceFactura}/devolucion`, { waitUntil: "domcontentloaded" });
    console.log("Status devolución:", respDev?.status());

    if (respDetalle?.status() === 200 && respDev?.status() === 200) {
      console.log("\n=======================================================");
      console.log("✓ ÉXITO TOTAL: Error 'invalid input syntax for type bigint: NaN' completamente corregido!");
      console.log("=======================================================");
    } else {
      console.error("Falló la prueba con estados:", respDetalle?.status(), respDev?.status());
    }
  }

  await browser.close();
}

main().catch(console.error);
