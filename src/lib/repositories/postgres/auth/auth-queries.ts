import type { UsuarioCuenta, RolUsuario } from "@/lib/auth";
import type { SqlExecutor } from "../client";
import { rolFromDb, rolToDb } from "./auth-roles";

export async function dbObtenerUsuarios(
  executor: SqlExecutor
): Promise<UsuarioCuenta[]> {
  const res = await executor.query(`
    SELECT 
      id, usuario, nombre, rol, clave as "passwordHash", activo,
      correo, debe_cambiar_clave as "debeCambiarClave",
      version_credencial as "versionCredencial",
      creado_en as "creadoEn"
    FROM usuarios_cuentas
    ORDER BY usuario ASC
  `);
  return res.rows.map((r: any) => ({
    id: r.id,
    usuario: r.usuario,
    nombre: r.nombre,
    rol: rolFromDb(r.rol),
    passwordHash: r.passwordHash,
    activo: r.activo ?? true,
    correo: r.correo || null,
    debeCambiarClave: r.debeCambiarClave ?? false,
    versionCredencial: r.versionCredencial ?? 1,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ultimoAcceso: null,
    creadoEn: r.creadoEn ? new Date(r.creadoEn).toISOString().split("T")[0] : "2026-01-01",
  }));
}

export async function dbBuscarPorUsuario(
  executor: SqlExecutor,
  nombreUsuario: string
): Promise<UsuarioCuenta | null> {
  const cleanUser = nombreUsuario.trim().toLowerCase();
  const res = await executor.query(
    `
    SELECT 
      id, usuario, nombre, rol, clave as "passwordHash", activo,
      correo, debe_cambiar_clave as "debeCambiarClave",
      version_credencial as "versionCredencial",
      intentos_fallidos, bloqueado_hasta, ultimo_acceso,
      creado_en as "creadoEn"
    FROM usuarios_cuentas
    WHERE LOWER(usuario) = $1 OR (correo IS NOT NULL AND LOWER(correo) = $1)
    LIMIT 1
  `,
    [cleanUser]
  );

  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    usuario: r.usuario,
    nombre: r.nombre,
    rol: rolFromDb(r.rol),
    passwordHash: r.passwordHash,
    activo: r.activo ?? true,
    correo: r.correo || null,
    debeCambiarClave: r.debeCambiarClave ?? false,
    versionCredencial: r.versionCredencial ?? 1,
    intentosFallidos: r.intentos_fallidos ?? 0,
    bloqueadoHasta: r.bloqueado_hasta ? new Date(r.bloqueado_hasta).toISOString() : null,
    ultimoAcceso: r.ultimo_acceso ? new Date(r.ultimo_acceso).toISOString() : null,
    creadoEn: r.creadoEn ? new Date(r.creadoEn).toISOString().split("T")[0] : "2026-01-01",
  };
}

export async function dbBuscarPorId(
  executor: SqlExecutor,
  id: string
): Promise<UsuarioCuenta | null> {
  const res = await executor.query(
    `
    SELECT 
      id, usuario, nombre, rol, clave as "passwordHash", activo,
      correo, debe_cambiar_clave as "debeCambiarClave",
      version_credencial as "versionCredencial",
      intentos_fallidos, bloqueado_hasta, ultimo_acceso,
      creado_en as "creadoEn"
    FROM usuarios_cuentas
    WHERE id = $1
  `,
    [id]
  );

  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    usuario: r.usuario,
    nombre: r.nombre,
    rol: rolFromDb(r.rol),
    passwordHash: r.passwordHash,
    activo: r.activo ?? true,
    correo: r.correo || null,
    debeCambiarClave: r.debeCambiarClave ?? false,
    versionCredencial: r.versionCredencial ?? 1,
    intentosFallidos: r.intentos_fallidos ?? 0,
    bloqueadoHasta: r.bloqueado_hasta ? new Date(r.bloqueado_hasta).toISOString() : null,
    ultimoAcceso: r.ultimo_acceso ? new Date(r.ultimo_acceso).toISOString() : null,
    creadoEn: r.creadoEn ? new Date(r.creadoEn).toISOString().split("T")[0] : "2026-01-01",
  };
}
