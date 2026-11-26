import type { SqlExecutor } from "../client";

const bruteForceMemoryMap = new Map<
  string,
  { intentos: number; bloqueadoHasta: string | null }
>();

export async function dbRegistrarIntentoFallido(
  executor: SqlExecutor,
  id: string,
  maxIntentos: number = 5,
  tiempoBloqueoMinutos: number = 10
): Promise<{ intentos: number; bloqueadoHasta: string | null }> {
  try {
    const res = await executor.query(
      `
      UPDATE usuarios_cuentas
      SET 
        intentos_fallidos = COALESCE(intentos_fallidos, 0) + 1,
        bloqueado_hasta = CASE 
          WHEN COALESCE(intentos_fallidos, 0) + 1 >= $2 
          THEN NOW() + ($3 || ' minutes')::interval 
          ELSE bloqueado_hasta 
        END,
        actualizado_en = NOW()
      WHERE id = $1
      RETURNING intentos_fallidos as "intentosFallidos", bloqueado_hasta as "bloqueadoHasta"
    `,
      [id, maxIntentos, tiempoBloqueoMinutos]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const result = {
        intentos: Number(row.intentosFallidos || 0),
        bloqueadoHasta: row.bloqueadoHasta
          ? new Date(row.bloqueadoHasta).toISOString()
          : null,
      };
      bruteForceMemoryMap.set(id, result);
      return result;
    }
  } catch {}

  const prev = bruteForceMemoryMap.get(id) || {
    intentos: 0,
    bloqueadoHasta: null,
  };
  const intentos = prev.intentos + 1;
  let bloqueadoHasta: string | null = prev.bloqueadoHasta;
  if (intentos >= maxIntentos) {
    bloqueadoHasta = new Date(
      Date.now() + tiempoBloqueoMinutos * 60000
    ).toISOString();
  }
  const result = { intentos, bloqueadoHasta };
  bruteForceMemoryMap.set(id, result);
  return result;
}

export async function dbResetearIntentos(
  executor: SqlExecutor,
  id: string
): Promise<void> {
  bruteForceMemoryMap.delete(id);
  try {
    await executor.query(
      `
      UPDATE usuarios_cuentas
      SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW(), actualizado_en = NOW()
      WHERE id = $1
    `,
      [id]
    );
  } catch {}
}
