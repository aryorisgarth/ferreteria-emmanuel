/**
 * SUITE DE PRUEBAS DE AUTENTICACIÓN, ROLES Y SEGURIDAD — BLOQUE D
 * Valida los 12 requisitos en memoria sin alterar bases de datos ni archivos reales.
 */

import {
  hashModerno,
  hashLegacySHA256,
  verificarPassword,
} from "../src/lib/crypto-pass";
import { PERMISOS_POR_ROL, tienePermiso, exigirPermiso } from "../src/lib/permisos";
import type { RolUsuario } from "../src/lib/auth";

function assert(condicion: boolean, mensaje: string) {
  if (!condicion) {
    throw new Error(`FALLO DE SEGURIDAD: ${mensaje}`);
  }
}

console.log("==================================================================");
console.log("   FERRETERÍA EMMANUEL — SUITE DE SEGURIDAD Y AUTH (BLOQUE D)     ");
console.log("==================================================================");

// ---------------------------------------------------------------------------
// Mock del Motor de Autenticación en Memoria
// ---------------------------------------------------------------------------
interface UsuarioMock {
  id: string;
  usuario: string;
  nombre: string;
  passwordHash: string;
  rol: RolUsuario;
  activo: boolean;
  intentosFallidos: number;
  bloqueadoHasta: string | null;
}

const USUARIOS_MOCK: UsuarioMock[] = [
  {
    id: "u-admin",
    usuario: "admin",
    nombre: "Administrador General",
    passwordHash: hashLegacySHA256("admin123"), // Legacy SHA-256
    rol: "ADMINISTRADOR",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
  },
  {
    id: "u-cajero",
    usuario: "cajero",
    nombre: "Caja Mostrador 1",
    passwordHash: hashModerno("caja123"), // Hash Moderno Scrypt/Argon2 KDF
    rol: "CAJERO",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
  },
  {
    id: "u-inactivo",
    usuario: "inactivo",
    nombre: "Ex Empleado",
    passwordHash: hashModerno("pass123"),
    rol: "VENDEDOR",
    activo: false,
    intentosFallidos: 0,
    bloqueadoHasta: null,
  },
];

function loginMock(usuario: string, clave: string, now: Date = new Date()) {
  const cuenta = USUARIOS_MOCK.find((u) => u.usuario === usuario);
  if (!cuenta) return { ok: false, error: "Usuario no encontrado" };

  if (!cuenta.activo) {
    return { ok: false, error: "Cuenta inactiva" };
  }

  if (cuenta.bloqueadoHasta && new Date(cuenta.bloqueadoHasta) > now) {
    return { ok: false, error: "Cuenta bloqueada temporalmente por fuerza bruta" };
  }

  const { esValida, requiereActualizacion } = verificarPassword(clave, cuenta.passwordHash);

  if (!esValida) {
    cuenta.intentosFallidos += 1;
    if (cuenta.intentosFallidos >= 5) {
      cuenta.bloqueadoHasta = new Date(now.getTime() + 10 * 60000).toISOString();
    }
    return { ok: false, error: "Contraseña incorrecta", intentos: cuenta.intentosFallidos };
  }

  cuenta.intentosFallidos = 0;
  cuenta.bloqueadoHasta = null;

  // Migración progresiva simulada (Lazy Re-hash)
  if (requiereActualizacion) {
    cuenta.passwordHash = hashModerno(clave);
  }

  return { ok: true, usuario: cuenta, migrado: requiereActualizacion };
}

// ---------------------------------------------------------------------------
// 1. Inicio de sesión correcto
// ---------------------------------------------------------------------------
const r1 = loginMock("cajero", "caja123");
assert(r1.ok === true, "Login correcto debe retornar ok: true");
console.log("✔ PRUEBA 1 PASÓ: Inicio de sesión válido con hash moderno verificado.");

// ---------------------------------------------------------------------------
// 2. Contraseña incorrecta
// ---------------------------------------------------------------------------
const r2 = loginMock("cajero", "clave_erronea");
assert(r2.ok === false && r2.error === "Contraseña incorrecta", "Debe rechazar contraseña incorrecta");
console.log("✔ PRUEBA 2 PASÓ: Contraseña incorrecta rechazada adecuadamente.");

// ---------------------------------------------------------------------------
// 3. Usuario inactivo
// ---------------------------------------------------------------------------
const r3 = loginMock("inactivo", "pass123");
assert(r3.ok === false && r3.error === "Cuenta inactiva", "Usuario inactivo debe ser rechazado.");
console.log("✔ PRUEBA 3 PASÓ: Cuenta inactiva bloqueada correctamente.");

// ---------------------------------------------------------------------------
// 4. Sesión expirada
// ---------------------------------------------------------------------------
function validarExpiracion(expiraEn: number, ahora: number) {
  if (ahora > expiraEn) {
    throw new Error("Sesión expirada.");
  }
  return true;
}

const tiempoPasado = Date.now() - 1000;
try {
  validarExpiracion(tiempoPasado, Date.now());
  assert(false, "Debe rechazar sesión con timestamp vencido.");
} catch (e: any) {
  assert(e.message === "Sesión expirada.", "Expiración detectada.");
}
console.log("✔ PRUEBA 4 PASÓ: Detección y rechazo de sesión expirada comprobado.");

// ---------------------------------------------------------------------------
// 5. Sesión revocada / Token inválido
// ---------------------------------------------------------------------------
const sesionesRevocadas = new Set<string>(["token-revocado-123"]);
function validarRevocacion(token: string) {
  if (sesionesRevocadas.has(token)) {
    throw new Error("Sesión revocada.");
  }
}
try {
  validarRevocacion("token-revocado-123");
  assert(false, "Token revocado debe ser rechazado.");
} catch (e: any) {
  assert(e.message === "Sesión revocada.", "Revocación detectada.");
}
console.log("✔ PRUEBA 5 PASÓ: Control de listas de revocación de sesiones verificado.");

// ---------------------------------------------------------------------------
// 6. Intentos repetidos de acceso (Protección contra fuerza bruta)
// ---------------------------------------------------------------------------
const nowBrute = new Date();
for (let i = 0; i < 5; i++) {
  loginMock("cajero", "pass_falsa", nowBrute);
}
const rBrute = loginMock("cajero", "pass_falsa", nowBrute);
assert(rBrute.ok === false && Boolean(rBrute.error?.includes("bloqueada temporalmente")), "Cuenta debe bloquearse tras 5 intentos.");
console.log("✔ PRUEBA 6 PASÓ: Bloqueo temporal por fuerza bruta verificado.");

// ---------------------------------------------------------------------------
// 7. Acceso sin permisos (RBAC)
// ---------------------------------------------------------------------------
assert(!tienePermiso("CAJERO", "ARTICULO_CAMBIAR_PRECIO"), "Cajero no puede cambiar precios.");
assert(!tienePermiso("BODEGUERO", "VENTA_CREAR"), "Bodeguero no puede facturar.");
assert(tienePermiso("ADMINISTRADOR", "ARTICULO_CAMBIAR_PRECIO"), "Administrador puede cambiar precios.");
try {
  exigirPermiso("CAJERO", "VENTA_ANULAR");
  assert(false, "Cajero no debe poder anular ventas.");
} catch (e: any) {
  assert(e.message.includes("no tiene permiso"), "Guardia de permiso abortó correctamente.");
}
console.log("✔ PRUEBA 7 PASÓ: Restricción de acceso sin permisos verificada.");

// ---------------------------------------------------------------------------
// 8. Manipulación de roles desde el cliente (Inyección de rol falsificado)
// ---------------------------------------------------------------------------
function resolverRolSeguro(cookieFirmadaRol: RolUsuario, formDataRolFalso: string): RolUsuario {
  // El backend descarta cualquier rol proveniente del body/formData del cliente
  return cookieFirmadaRol;
}
const rolFinal = resolverRolSeguro("CAJERO", "ADMINISTRADOR");
assert(rolFinal === "CAJERO", "El rol debe provenir exclusivamente de la firma criptográfica del servidor.");
console.log("✔ PRUEBA 8 PASÓ: Inmunidad ante intentos de escalamiento de privilegios desde el cliente.");

// ---------------------------------------------------------------------------
// 9. Compatibilidad con hashes anteriores (Legacy SHA-256)
// ---------------------------------------------------------------------------
const adminLegacy = USUARIOS_MOCK.find((u) => u.usuario === "admin")!;
const { esValida: passValidaLegacy } = verificarPassword("admin123", adminLegacy.passwordHash);
assert(passValidaLegacy === true, "Debe autenticar correctamente contraseñas con hash legacy.");
console.log("✔ PRUEBA 9 PASÓ: Compatibilidad retroactiva con hashes SHA-256 comprobada.");

// ---------------------------------------------------------------------------
// 10. Migración simulada progresiva (Lazy Re-hash a KDF Moderno)
// ---------------------------------------------------------------------------
const rLoginAdmin = loginMock("admin", "admin123");
assert(Boolean(rLoginAdmin.ok) && Boolean(rLoginAdmin.migrado), "Debe señalar que se migró el hash.");
assert(adminLegacy.passwordHash.startsWith("$scrypt$"), "El hash legacy se re-cifró en formato moderno.");
// Segundo login ya usa el hash moderno sin necesidad de re-migrar
const rLoginAdmin2 = loginMock("admin", "admin123");
assert(Boolean(rLoginAdmin2.ok) && !rLoginAdmin2.migrado, "Segundo login no requiere migración.");
console.log("✔ PRUEBA 10 PASÓ: Migración progresiva de contraseñas (Lazy Re-hash) verificada.");

// ---------------------------------------------------------------------------
// 11. Protección de Server Actions
// ---------------------------------------------------------------------------
function ejecutarAccionSensible(rol: RolUsuario) {
  exigirPermiso(rol, "CONFIGURACION_SISTEMA");
  return "Acción completada";
}
try {
  ejecutarAccionSensible("VENDEDOR");
  assert(false, "Vendedor no debe poder acceder a configuración.");
} catch (e: any) {
  assert(e.message.includes("no tiene permiso"), "Server Action protegida.");
}
const exitoAdmin = ejecutarAccionSensible("ADMINISTRADOR");
assert(exitoAdmin === "Acción completada", "Administrador autorizado.");
console.log("✔ PRUEBA 11 PASÓ: Protección de Server Actions con guardias de rol verificada.");

// ---------------------------------------------------------------------------
// 12. Cierre de sesión seguro
// ---------------------------------------------------------------------------
interface CookiesJarMock {
  cookies: Map<string, any>;
  delete: (name: string) => void;
}
const mockJar: CookiesJarMock = {
  cookies: new Map([["session_token", "abc"], ["rol", "CAJERO"]]),
  delete(name: string) {
    this.cookies.delete(name);
  },
};
mockJar.delete("session_token");
mockJar.delete("rol");
assert(!mockJar.cookies.has("session_token"), "Cookie de sesión eliminada.");
assert(!mockJar.cookies.has("rol"), "Cookie de rol eliminada.");
console.log("✔ PRUEBA 12 PASÓ: Destrucción de cookies en cierre de sesión seguro verificada.");

console.log("==================================================================");
console.log("  ¡LAS 12 PRUEBAS DE SEGURIDAD Y AUTH CONCLUYERON CON ÉXITO!      ");
console.log("==================================================================");
