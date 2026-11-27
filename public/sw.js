const CACHE_NAME = "emmanuel-static-v1.1.3";

// Solo recursos estáticos públicos inmutables (iconos, fuentes, logo)
// NUNCA datos de clientes, productos, facturas, credenciales o Server Actions
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logo-oficial.png",
  "/logo-oficial-dark.png",
  "/isotipo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Omitir peticiones no GET (POST, PUT, DELETE) para evitar interferir con Server Actions o mutaciones
  if (event.request.method !== "GET") {
    return;
  }

  // 2. NUNCA almacenar ni interceptar rutas de API privadas o acciones sensibles
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.includes("action")
  ) {
    return;
  }

  // 3. Estrategia Cache First para recursos estáticos públicos de imágenes/iconos
  if (
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/logo") ||
    url.pathname.startsWith("/apple") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Estrategia Network First para navegación HTML normal
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // Respuesta offline informativa y segura (no inventa datos)
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <title>Sin Conexión · Ferretería Emmanuel</title>
                <style>
                  body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                  .card { background: #1e293b; border: 1px solid #334155; padding: 32px; border-radius: 16px; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                  h1 { font-size: 20px; margin-top: 0; color: #facc15; }
                  p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
                  .btn { display: inline-block; margin-top: 16px; background: #facc15; color: #0f172a; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>Sin Conexión a Internet</h1>
                  <p>Ferretería Emmanuel requiere conexión segura a la nube para garantizar que tus ventas, inventario y facturas se sincronicen en tiempo real con Neon PostgreSQL.</p>
                  <p>Por favor revisa tu red Wi-Fi o datos móviles.</p>
                  <a href="/" class="btn" onclick="window.location.reload(); return false;">Reintentar Conexión</a>
                </div>
              </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      });
    })
  );
});
