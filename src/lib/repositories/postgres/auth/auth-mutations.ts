import type { UsuarioCuenta, RolUsuario } from "@/lib/auth";
import type { SqlExecutor } from "../client";
import { rolToDb } from "./auth-roles";
import { dbBuscarPorId, dbBuscarPorUsuario } from "./auth-queries";

export async function dbGuardarUsuarios(
  executor: SqlExecutor,
  usuarios: UsuarioCuenta[]
): Promise<void> {
  for (const u of usuarios) {
    await executor.query(
      `
      INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo, correo, creado_en, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        usuario = EXCLUDED.usuario,
        nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        clave = EXCLUDED.clave,
        activo = EXCLUDED.activo,
        correo = COALESCE(EXCLUDED.correo, usuarios_cuentas.correo),
        actualizado_en = NOW()
    `,
      [
        u.id,
        u.usuario.trim().toLowerCase(),
        u.nombre.trim(),
        rolToDb(u.rol),
        u.passwordHash,
        u.activo ?? true,
        u.correo || null,
        u.creadoEn || new Date().toISOString(),
      ]
    );
  }
}

export async function dbCrearOActualizarUsuario(
  executor: SqlExecutor,
  input: {
    id?: string;
    usuario: string;
    nombre: string;
    rol: RolUsuario;
    clave?: string;
    activo?: boolean;
    correo?: string;
  }
): Promise<UsuarioCuenta> {
  const userId = input.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanUser = input.usuario.trim().toLowerCase();

  const existing = input.id
    ? await dbBuscarPorId(executor, input.id)
    : await dbBuscarPorUsuario(executor, cleanUser);

  const hashFinal = input.clave || existing?.passwordHash || "";
  if (!hashFinal) {
    throw new Error("Se requiere una contraseña para registrar un nuevo usuario");
  }

  const activoFinal = input.activo !== undefined ? input.activo : existing?.activo ?? true;
  const correoFinal = input.correo !== undefined ? input.correo : existing?.correo || null;

  await executor.query(
    `
    INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo, correo, creado_en, actualizado_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      usuario = EXCLUDED.usuario,
      nombre = EXCLUDED.nombre,
      rol = EXCLUDED.rol,
      clave = EXCLUDED.clave,
      activo = EXCLUDED.activo,
      correo = EXCLUDED.correo,
      actualizado_en = NOW()
  `,
    [userId, cleanUser, input.nombre.trim(), rolToDb(input.rol), hashFinal, activoFinal, correoFinal]
  );

  const saved = await dbBuscarPorId(executor, userId);
  if (!saved) throw new Error("Error al recuperar el usuario guardado en PostgreSQL");
  return saved;
}

export async function dbEliminarUsuario(
  executor: SqlExecutor,
  id: string
): Promise<void> {
  await executor.query(`DELETE FROM usuarios_cuentas WHERE id = $1`, [id]);
}
