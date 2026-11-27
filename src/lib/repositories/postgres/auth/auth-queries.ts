import type { UsuarioCuenta, RolUsuario } from "@/lib/auth";
import type { SqlExecutor } from "../client";
import { rolFromDb, rolToDb } from "./auth-roles";

export async function dbObtenerUsuarios(executor: SqlExecutor): Promise<UsuarioCuenta[]> {
  const res = await executor.query(`
    SELECT id, usuario, nombre, rol, clave as "passwordHash", activo, correo,
           debe_cambiar_clave as "debeCambiarClave", version_credencial as "versionCredencial",
           creado_en as "creadoEn"
    FROM usuarios_cuentas ORDER BY usuario ASC
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
    `SELECT id, usuario, nombre, rol, clave as "passwordHash", activo, correo,
            debe_cambiar_clave as "debeCambiarClave", version_credencial as "versionCredencial",
            intentos_fallidos, bloqueado_hasta, ultimo_acceso, creado_en as "creadoEn"
     FROM usuarios_cuentas
     WHERE LOWER(usuario) = $1 OR (correo IS NOT NULL AND LOWER(correo) = $1) LIMIT 1`,
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

export async function dbBuscarPorId(executor: SqlExecutor, id: string): Promise<UsuarioCuenta | null> {
  const res = await executor.query(
    `SELECT id, usuario, nombre, rol, clave as "passwordHash", activo, correo,
            debe_cambiar_clave as "debeCambiarClave", version_credencial as "versionCredencial",
            intentos_fallidos, bloqueado_hasta, ultimo_acceso, creado_en as "creadoEn"
     FROM usuarios_cuentas WHERE id = $1 LIMIT 1`,
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

async function asegurarTablaUsuarios(executor: SqlExecutor): Promise<void> {
  await executor.query(`
    CREATE TABLE IF NOT EXISTS usuarios_cuentas (
      id TEXT PRIMARY KEY, usuario TEXT UNIQUE NOT NULL, nombre TEXT NOT NULL DEFAULT '',
      rol TEXT NOT NULL DEFAULT 'admin', clave TEXT NOT NULL DEFAULT '', activo BOOLEAN NOT NULL DEFAULT true,
      tema TEXT NOT NULL DEFAULT 'emmanuel', creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE usuarios_cuentas ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'emmanuel';
  `);
}

export async function dbObtenerTemaUsuario(executor: SqlExecutor, usuarioOId: string): Promise<string> {
  const clean = usuarioOId.trim().toLowerCase();
  for (let i = 0; i < 2; i++) {
    try {
      const res = await executor.query(
        `SELECT tema FROM usuarios_cuentas WHERE LOWER(usuario) = $1 OR id = $1 LIMIT 1`, [clean]
      );
      return res.rows.length > 0 && res.rows[0].tema ? String(res.rows[0].tema) : "emmanuel";
    } catch (err: any) {
      if (i === 0 && (err?.code === "42P01" || err?.code === "42703")) {
        await asegurarTablaUsuarios(executor).catch(() => {});
        continue;
      }
      return "emmanuel";
    }
  }
  return "emmanuel";
}

export async function dbGuardarTemaUsuario(
  executor: SqlExecutor,
  usuarioOId: string,
  tema: string
): Promise<boolean> {
  const clean = usuarioOId.trim().toLowerCase();
  for (let i = 0; i < 2; i++) {
    try {
      const res = await executor.query(
        `UPDATE usuarios_cuentas SET tema = $2, actualizado_en = NOW() WHERE LOWER(usuario) = $1 OR id = $1`,
        [clean, tema]
      );
      if ((res.rowCount ?? 0) > 0) return true;

      const up = await executor.query(
        `INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo, tema, creado_en, actualizado_en)
         VALUES ($1, $1, $1, 'admin', '$scrypt$theme_managed', true, $2, NOW(), NOW())
         ON CONFLICT (usuario) DO UPDATE SET tema = EXCLUDED.tema, actualizado_en = NOW()`,
        [clean, tema]
      );
      return (up.rowCount ?? 0) > 0;
    } catch (err: any) {
      if (i === 0 && (err?.code === "42P01" || err?.code === "42703")) {
        await asegurarTablaUsuarios(executor).catch(() => {});
        continue;
      }
      console.warn("[Tema] Error al persistir tema en PostgreSQL:", err);
      return false;
    }
  }
  return false;
}
