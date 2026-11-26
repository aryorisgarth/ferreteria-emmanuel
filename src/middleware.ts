import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESION,
  COOKIE_ROL,
  COOKIE_TOKEN,
  verificarTokenSesion,
} from "./lib/auth-token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  const { pathname, search } = request.nextUrl;

  // Rutas públicas que no requieren login
  const esRutaPublica =
    pathname === "/" ||
    pathname === "/recuperar" ||
    pathname === "/manifest.webmanifest";

  // Verificar la firma criptográfica y expiración del token HMAC
  const sesion = await verificarTokenSesion(token);

  // 1. Si no hay sesión válida e intenta acceder a una ruta protegida
  if (!sesion && !esRutaPublica) {
    const loginUrl = new URL("/", request.url);
    if (pathname !== "/inicio") {
      loginUrl.searchParams.set("volver", `${pathname}${search}`);
    }
    const response = NextResponse.redirect(loginUrl);
    // Limpiar cookies adulteradas o expiradas
    response.cookies.delete(COOKIE_SESION);
    response.cookies.delete(COOKIE_ROL);
    response.cookies.delete(COOKIE_TOKEN);
    return response;
  }

  // 2. Si ya está autenticado válidamente e intenta ir a la pantalla de login
  if (sesion && esRutaPublica) {
    const destino = sesion.rol === "CAJERO" ? "/caja" : "/inicio";
    return NextResponse.redirect(new URL(destino, request.url));
  }

  // 3. Control de Acceso Basado en Roles (RBAC) a nivel de rutas
  if (sesion) {
    // Solo el ADMINISTRADOR puede acceder a la configuración global y respaldos
    if (pathname.startsWith("/configuracion") && sesion.rol !== "ADMINISTRADOR") {
      const inicioUrl = new URL("/inicio", request.url);
      inicioUrl.searchParams.set("error", "Acceso denegado: El módulo de Configuración es exclusivo para administradores.");
      return NextResponse.redirect(inicioUrl);
    }

    // Vendedores no tienen acceso a compras mayoristas ni registro de gastos
    if ((pathname.startsWith("/compras") || pathname.startsWith("/gastos")) && sesion.rol === "VENDEDOR") {
      const inicioUrl = new URL("/inicio", request.url);
      inicioUrl.searchParams.set("error", "Acceso denegado: Tu rol de Vendedor no tiene acceso a compras ni gastos operativos.");
      return NextResponse.redirect(inicioUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
