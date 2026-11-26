import crypto from "crypto";
import type { SqlExecutor } from "../client";
import type { UsuarioCuenta } from "@/lib/auth";
import { dbBuscarPorUsuario, dbBuscarPorId } from "./auth-queries";

export async function dbGenerarTokenRecuperacion(
  executor: SqlExecutor,
  usuarioOCorreo: string
): Promise<{ ok: true; tokenPlano?: string; correo?: string; usuario?: string }> {
  const cuenta = await dbBuscarPorUsuario(executor, usuarioOCorreo);
  if (!cuenta || !cuenta.activo) {
    crypto.createHash("sha256").update(usuarioOCorreo).digest("hex");
    return { ok: true };
  }

  const tokenPlano = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");

  await executor.query(
    `UPDATE usuarios_cuentas
     SET token_recuperacion_hash = $1, token_recuperacion_expira = NOW() + INTERVAL '15 minutes', actualizado_en = NOW()
     WHERE id = $2`,
    [tokenHash, cuenta.id]
  );

  return { ok: true, tokenPlano, correo: cuenta.correo || undefined, usuario: cuenta.usuario };
}

export async function dbValidarTokenRecuperacion(
  executor: SqlExecutor,
  tokenPlano: string
): Promise<UsuarioCuenta | null> {
  const tokenHash = crypto.createHash("sha256").update(tokenPlano.trim()).digest("hex");
  const res = await executor.query(
    `SELECT id, usuario, correo FROM usuarios_cuentas
     WHERE token_recuperacion_hash = $1 AND token_recuperacion_expira > NOW() AND activo = true LIMIT 1`,
    [tokenHash]
  );
  if (res.rows.length === 0) return null;
  return dbBuscarPorId(executor, res.rows[0].id);
}

export async function dbRestablecerPasswordConToken(
  executor: SqlExecutor,
  tokenPlano: string,
  nuevoPasswordHash: string
): Promise<boolean> {
  const tokenHash = crypto.createHash("sha256").update(tokenPlano.trim()).digest("hex");
  const res = await executor.query(
    `UPDATE usuarios_cuentas
     SET clave = $1, token_recuperacion_hash = NULL, token_recuperacion_expira = NULL,
         debe_cambiar_clave = false, version_credencial = COALESCE(version_credencial, 1) + 1,
         intentos_fallidos = 0, bloqueado_hasta = NULL, actualizado_en = NOW()
     WHERE token_recuperacion_hash = $2 AND token_recuperacion_expira > NOW() AND activo = true
     RETURNING id`,
    [nuevoPasswordHash, tokenHash]
  );
  return res.rows.length > 0;
}

export async function dbRestablecerAccesoAdmin(
  executor: SqlExecutor,
  usuarioId: string,
  claveTemporalHash: string,
  adminUsuario: string
): Promise<boolean> {
  const res = await executor.query(
    `UPDATE usuarios_cuentas
     SET clave = $1, debe_cambiar_clave = true, token_recuperacion_hash = NULL,
         token_recuperacion_expira = NULL, version_credencial = COALESCE(version_credencial, 1) + 1,
         intentos_fallidos = 0, bloqueado_hasta = NULL, actualizado_en = NOW()
     WHERE id = $2 AND activo = true
     RETURNING id, usuario`,
    [claveTemporalHash, usuarioId]
  );
  if (res.rows.length === 0) return false;

  try {
    await executor.query(
      `INSERT INTO auditoria_logs (id, usuario, accion, entidad, entidad_id, detalles, fecha)
       VALUES ($1, $2, 'RESTABLECER_ACCESO_USUARIO', 'usuarios_cuentas', $3, $4, NOW())`,
      [
        `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminUsuario,
        usuarioId,
        JSON.stringify({ usuarioAfectado: res.rows[0].usuario }),
      ]
    );
  } catch {}
  return true;
}

export async function dbCambiarPasswordObligatorio(
  executor: SqlExecutor,
  usuarioId: string,
  nuevoPasswordHash: string
): Promise<boolean> {
  const res = await executor.query(
    `UPDATE usuarios_cuentas
     SET clave = $1, debe_cambiar_clave = false, version_credencial = COALESCE(version_credencial, 1) + 1, actualizado_en = NOW()
     WHERE id = $2 AND activo = true
     RETURNING id`,
    [nuevoPasswordHash, usuarioId]
  );
  return res.rows.length > 0;
}
