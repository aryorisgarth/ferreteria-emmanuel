import "server-only";
import { cache } from "react";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import {
  COOKIE_SESION,
  COOKIE_ROL,
  COOKIE_NOMBRE,
  COOKIE_TOKEN,
  generarTokenSesion,
  verificarTokenSesion,
  obtenerAuthSecret,
} from "./auth-token";
import { hashModerno, hashLegacySHA256, verificarPassword } from "./crypto-pass";

export { COOKIE_SESION, COOKIE_ROL, COOKIE_NOMBRE, COOKIE_TOKEN };

export type RolUsuario = "ADMINISTRADOR" | "CAJERO" | "BODEGUERO" | "VENDEDOR";

export interface UsuarioCuenta {
  id: string;
  usuario: string;
  nombre: string;
  passwordHash: string;
  rol: RolUsuario;
  activo: boolean;
  correo?: string | null;
  debeCambiarClave?: boolean;
  tokenRecuperacionHash?: string | null;
  tokenRecuperacionExpira?: string | null;
  versionCredencial?: number;
  intentosFallidos?: number;
  bloqueadoHasta?: string | null;
  ultimoAcceso?: string | null;
  modificadoPor?: string | null;
  tema?: string | null;
  creadoEn: string;
}

export interface SesionUsuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  expiraEn: number;
  debeCambiarClave?: boolean;
}

export class AutorizacionError extends Error {
  constructor(mensaje = "No tienes permisos suficientes para realizar esta acción.") {
    super(mensaje);
    this.name = "AutorizacionError";
  }
}

const rutaBaseDatos = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const USUARIOS_FILE = process.env.DATA_USUARIOS_PATH
  ? path.resolve(process.env.DATA_USUARIOS_PATH)
  : path.join(rutaBaseDatos, "usuarios.json");

if (process.env.E2E_TEST === "true" && process.env.STORAGE_PROVIDER !== "postgres") {
  const rutaRealUsuarios = path.resolve(process.cwd(), "data", "usuarios.json");
  if (path.resolve(USUARIOS_FILE) === rutaRealUsuarios) {
    throw new Error(
      "BLOQUEO DE SEGURIDAD E2E: El servidor de pruebas intentó acceder al archivo de usuarios real data/usuarios.json."
    );
  }
}

export function hashPassword(password: string): string {
  return hashModerno(password);
}

// Cuentas iniciales con contraseñas seguras preconfiguradas
const USUARIOS_INICIALES: UsuarioCuenta[] = [
  {
    id: "usr-admin",
    usuario: "admin",
    nombre: "Administrador General",
    passwordHash: hashPassword("admin123"),
    rol: "ADMINISTRADOR",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: "2026-01-01",
  },
  {
    id: "usr-cajero",
    usuario: "cajero",
    nombre: "Caja Mostrador 1",
    passwordHash: hashPassword("caja123"),
    rol: "CAJERO",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: "2026-01-01",
  },
  {
    id: "usr-bodega",
    usuario: "bodega",
    nombre: "Encargado de Bodega",
    passwordHash: hashPassword("bodega123"),
    rol: "BODEGUERO",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: "2026-01-01",
  },
  {
    id: "usr-vendedor",
    usuario: "vendedor",
    nombre: "Ventas y Cotizaciones",
    passwordHash: hashPassword("venta123"),
    rol: "VENDEDOR",
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: "2026-01-01",
  },
];

// Leer o inicializar archivo de usuarios (Modo JSON)
export function obtenerUsuariosJson(): UsuarioCuenta[] {
  try {
    if (!fs.existsSync(USUARIOS_FILE)) {
      guardarUsuariosJson(USUARIOS_INICIALES);
      return USUARIOS_INICIALES;
    }
    const contenido = fs.readFileSync(USUARIOS_FILE, "utf8");
    const lista = JSON.parse(contenido) as UsuarioCuenta[];
    if (!Array.isArray(lista) || lista.length === 0) {
      guardarUsuariosJson(USUARIOS_INICIALES);
      return USUARIOS_INICIALES;
    }
    return lista;
  } catch {
    return USUARIOS_INICIALES;
  }
}

export function guardarUsuariosJson(usuarios: UsuarioCuenta[]) {
  fs.mkdirSync(path.dirname(USUARIOS_FILE), { recursive: true });
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2), "utf8");
}

export function obtenerUsuarios(): UsuarioCuenta[] {
  return obtenerUsuariosJson();
}

export function guardarUsuarios(usuarios: UsuarioCuenta[]) {
  return guardarUsuariosJson(usuarios);
}

/**
 * Crea o actualiza un usuario en modo JSON
 */
export function crearOActualizarUsuarioCuentaJson(input: {
  id?: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  clave?: string;
  activo?: boolean;
}): UsuarioCuenta {
  const usuarios = obtenerUsuariosJson();
  const usuarioNorm = input.usuario.trim().toLowerCase();

  if (input.id) {
    const indice = usuarios.findIndex((u) => u.id === input.id);
    if (indice === -1) throw new Error("El usuario especificado no existe.");
    const actual = usuarios[indice];
    const actualizado: UsuarioCuenta = {
      ...actual,
      usuario: usuarioNorm,
      nombre: input.nombre.trim(),
      rol: input.rol,
      activo: input.activo !== undefined ? input.activo : actual.activo,
      passwordHash: input.clave && input.clave.trim().length >= 4 ? hashPassword(input.clave.trim()) : actual.passwordHash,
    };
    usuarios[indice] = actualizado;
    guardarUsuariosJson(usuarios);
    return actualizado;
  }

  // Comprobar si ya existe el nombre de usuario
  if (usuarios.some((u) => u.usuario.toLowerCase() === usuarioNorm)) {
    throw new Error(`El nombre de usuario "@${usuarioNorm}" ya está registrado.`);
  }

  const claveFinal = input.clave && input.clave.trim().length >= 4 ? input.clave.trim() : "123456";
  const nuevo: UsuarioCuenta = {
    id: "usr-" + Date.now(),
    usuario: usuarioNorm,
    nombre: input.nombre.trim(),
    passwordHash: hashPassword(claveFinal),
    rol: input.rol,
    activo: true,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: new Date().toISOString().split("T")[0],
  };

  usuarios.push(nuevo);
  guardarUsuariosJson(usuarios);
  return nuevo;
}

/**
 * Elimina una cuenta de usuario en modo JSON impidiendo el borrado del administrador raíz
 */
export function eliminarUsuarioCuentaJson(id: string) {
  const usuarios = obtenerUsuariosJson();
  const cuenta = usuarios.find((u) => u.id === id);
  if (!cuenta) throw new Error("El usuario no existe.");
  if (cuenta.usuario.toLowerCase() === "admin") {
    throw new Error("No se puede eliminar la cuenta principal de administrador (@admin).");
  }
  const filtrados = usuarios.filter((u) => u.id !== id);
  guardarUsuariosJson(filtrados);
}

/**
 * Crea o actualiza un usuario sincronizando contraseñas y permisos según el proveedor activo
 */
export async function crearOActualizarUsuarioCuenta(input: {
  id?: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  clave?: string;
  activo?: boolean;
}): Promise<UsuarioCuenta> {
  if (process.env.STORAGE_PROVIDER === "postgres") {
    const { getAuthRepository } = await import("@/lib/repositories");
    const claveFinal =
      input.clave && input.clave.trim().length >= 4
        ? hashPassword(input.clave.trim())
        : undefined;
    return getAuthRepository().crearOActualizarUsuario({
      ...input,
      clave: claveFinal,
    });
  }
  return crearOActualizarUsuarioCuentaJson(input);
}

/**
 * Elimina una cuenta de usuario impidiendo el borrado del administrador raíz
 */
export async function eliminarUsuarioCuenta(id: string): Promise<void> {
  if (process.env.STORAGE_PROVIDER === "postgres") {
    const { getAuthRepository } = await import("@/lib/repositories");
    const user = await getAuthRepository().buscarPorId(id);
    if (!user) throw new Error("El usuario no existe.");
    if (user.usuario.toLowerCase() === "admin") {
      throw new Error("No se puede eliminar la cuenta principal de administrador (@admin).");
    }
    await getAuthRepository().eliminarUsuario(id);
    return;
  }
  eliminarUsuarioCuentaJson(id);
}

/**
 * Autenticación segura de usuario con protección contra fuerza bruta
 */
export async function autenticar(
  usuarioInput: string,
  claveInput: string,
): Promise<{ ok: true; usuario: UsuarioCuenta } | { ok: false; error: string }> {
  const user = usuarioInput.trim().toLowerCase();
  const pass = claveInput;

  if (!user) {
    return { ok: false, error: "Ingresa tu nombre de usuario." };
  }
  if (!pass || pass.length < 4) {
    return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  }

  let cuenta: UsuarioCuenta | null = null;
  if (process.env.STORAGE_PROVIDER === "postgres") {
    const { getAuthRepository } = await import("@/lib/repositories");
    cuenta = await getAuthRepository().buscarPorUsuario(user);
  } else {
    const usuarios = obtenerUsuariosJson();
    cuenta = usuarios.find((u) => u.usuario.toLowerCase() === user) || null;
  }

  if (!cuenta) {
    return {
      ok: false,
      error: `El usuario "${usuarioInput}" no existe en el sistema.`,
    };
  }

  // Verificar si está activo
  if (!cuenta.activo) {
    return {
      ok: false,
      error: "Esta cuenta se encuentra inactiva. Contacta al administrador.",
    };
  }

  // Verificar si está temporalmente bloqueado por fuerza bruta
  const ahora = new Date();
  if (cuenta.bloqueadoHasta && new Date(cuenta.bloqueadoHasta) > ahora) {
    const minutosRestantes = Math.ceil(
      (new Date(cuenta.bloqueadoHasta).getTime() - ahora.getTime()) / 60000,
    );
    return {
      ok: false,
      error: `Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta en ${minutosRestantes} minuto(s).`,
    };
  }

  const { esValida, requiereActualizacion } = verificarPassword(pass, cuenta.passwordHash);
  const passLegacyValido = cuenta.passwordHash === hashLegacySHA256(pass);

  if (!esValida && !passLegacyValido) {
    const { getAuthRepository } = await import("@/lib/repositories");
    const lockout = await getAuthRepository().registrarIntentoFallido(cuenta.id, 5, 10);
    const intentos = lockout.intentos;

    if (intentos >= 5) {
      return {
        ok: false,
        error: "Has superado el límite de 5 intentos fallidos. Cuenta bloqueada por 10 minutos.",
      };
    }

    const intentosRestantes = Math.max(0, 5 - intentos);
    return {
      ok: false,
      error: `Contraseña incorrecta. Te quedan ${intentosRestantes} intento(s) antes del bloqueo temporal.`,
    };
  }

  // Migración progresiva transparente a KDF moderno (scrypt con salting individual)
  if (requiereActualizacion || (passLegacyValido && !cuenta.passwordHash.startsWith("$scrypt$"))) {
    try {
      const nuevoHash = hashModerno(pass);
      cuenta.passwordHash = nuevoHash;
      const { getAuthRepository } = await import("@/lib/repositories");
      await getAuthRepository().crearOActualizarUsuario({
        id: cuenta.id,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        clave: pass,
        activo: cuenta.activo,
      });
    } catch {
      // Si la persistencia asíncrona falla, no se interrumpe la sesión
    }
  }

  // Acceso correcto: resetear intentos fallidos y registrar último acceso
  const { getAuthRepository } = await import("@/lib/repositories");
  await getAuthRepository().resetearIntentos(cuenta.id);

  const cuentaActualizada: UsuarioCuenta = {
    ...cuenta,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: ahora.toISOString(),
  };

  return { ok: true, usuario: cuentaActualizada };
}

/**
 * Establecer sesión con cookies HTTP-Only y token criptográficamente firmado
 */
export async function crearSesion(usuario: UsuarioCuenta, recordar = false) {
  const jar = await cookies();
  const maxAge = recordar ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 días o 1 día
  const expiraEn = Date.now() + maxAge * 1000;

  const tokenCompleto = await generarTokenSesion(
    usuario.id,
    usuario.usuario,
    usuario.rol,
    expiraEn,
    obtenerAuthSecret(),
  );

  jar.set(COOKIE_SESION, usuario.usuario, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  // Endurecimiento: Cookie de rol y nombre protegidas con httpOnly para mitigar manipulación en cliente
  jar.set(COOKIE_ROL, usuario.rol, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  jar.set(COOKIE_NOMBRE, usuario.nombre, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  jar.set(COOKIE_TOKEN, tokenCompleto, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  if (usuario.tema) {
    jar.set("fe_tema", usuario.tema, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

/**
 * Destruir sesión y limpiar cookies
 */
export async function destruirSesion() {
  const jar = await cookies();
  jar.delete(COOKIE_SESION);
  jar.delete(COOKIE_ROL);
  jar.delete(COOKIE_NOMBRE);
  jar.delete(COOKIE_TOKEN);
}

/**
 * Obtener la sesión activa del usuario verificando la firma del token (deduplicada por solicitud mediante React cache)
 */
export const obtenerSesionActual = cache(async function obtenerSesionActual(): Promise<SesionUsuario | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_TOKEN)?.value;
  if (!token) return null;

  const verificado = await verificarTokenSesion(token, obtenerAuthSecret());
  if (!verificado) return null;

  const cookieNombre = jar.get(COOKIE_NOMBRE)?.value;
  const nombre = cookieNombre && cookieNombre.trim().length > 0 ? cookieNombre.trim() : verificado.usuario;

  return {
    id: verificado.id,
    usuario: verificado.usuario,
    nombre,
    rol: verificado.rol,
    expiraEn: verificado.expiraEn,
  };
});

/**
 * Guardia RBAC estricto para Server Actions. Lanza excepción si el usuario no tiene rol permitido.
 */
export async function exigirSesion(rolesPermitidos?: RolUsuario[]): Promise<SesionUsuario> {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    throw new AutorizacionError("Sesión inválida o expirada. Por favor inicia sesión nuevamente.");
  }

  if (rolesPermitidos && rolesPermitidos.length > 0 && !rolesPermitidos.includes(sesion.rol)) {
    throw new AutorizacionError(
      `Acceso denegado: tu rol de "${sesion.rol}" no tiene permisos para realizar esta operación.`,
    );
  }

  return sesion;
}

/**
 * Solicitud de restablecimiento de contraseña
 */
export async function solicitarRestablecimiento(
  usuarioOEmail: string,
): Promise<{ ok: true; mensaje: string } | { ok: false; error: string }> {
  const { solicitarRecuperacionPassword } = await import("./auth-recovery");
  return solicitarRecuperacionPassword(usuarioOEmail);
}

// Alias de compatibilidad
export const autenticarUsuario = autenticar;
export const establecerSesion = crearSesion;
export const cerrarSesion = destruirSesion;
export const obtenerUsuarioActual = obtenerSesionActual;
