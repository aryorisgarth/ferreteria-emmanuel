import * as local from "@/lib/inventory/local";
import { getCommercialRepository, getStorageProvider } from "@/lib/repositories";

function getCashRepo(): any {
  if (getStorageProvider() === "postgres") {
    return getCommercialRepository();
  }
  return local;
}

export async function turnoActivo(usuario?: string) {
  const repo = getCashRepo();
  if (typeof repo.turnoActivo === "function") return repo.turnoActivo(usuario);
  if (typeof repo.obtenerTurnoActivo === "function") return repo.obtenerTurnoActivo(usuario);
  return null;
}

export async function abrirTurno(input: { montoInicial: number; usuario: string; fecha?: string }) {
  const repo = getCashRepo();
  if (typeof repo.abrirTurno === "function") return repo.abrirTurno(input);
  if (typeof repo.abrirTurnoCaja === "function") return repo.abrirTurnoCaja(input);
  throw new Error("Método abrirTurno no implementado.");
}

export async function registrarMovimientoCaja(input: {
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  concepto: string;
  usuario: string;
  turnoCajaId?: string;
}) {
  const activo = await turnoActivo(input.usuario);
  if (!activo) throw new Error("No hay turno abierto para registrar movimientos.");
  const repo = getCashRepo();
  if (typeof repo.registrarMovimientoCaja === "function") {
    return repo.registrarMovimientoCaja({
      turnoCajaId: activo.id,
      tipo: input.tipo,
      monto: input.monto,
      concepto: input.concepto,
      usuario: input.usuario,
    });
  }
  if (typeof repo.registrarMovimiento === "function") {
    return repo.registrarMovimiento(input);
  }
  throw new Error("Método registrarMovimientoCaja no implementado.");
}

export async function cerrarTurno(input: {
  montoFinalReal: number;
  notas?: string;
  usuario: string;
  turnoId?: string;
}) {
  const activo = await turnoActivo(input.usuario);
  if (!activo) throw new Error("No hay turno abierto para cerrar.");
  const repo = getCashRepo();
  if (typeof repo.cerrarTurno === "function") {
    return repo.cerrarTurno({
      turnoId: activo.id,
      montoFinalReal: input.montoFinalReal,
      notas: input.notas,
      usuario: input.usuario,
    });
  }
  if (typeof repo.cerrarTurnoCaja === "function") {
    return repo.cerrarTurnoCaja(input);
  }
  throw new Error("Método cerrarTurno no implementado.");
}

export async function turnos(page: number = 1) {
  const repo = getCashRepo();
  return repo.turnos(page);
}

export async function movimientosTurno(turnoId: string) {
  const repo = getCashRepo();
  if (typeof repo.movimientosTurno === "function") return repo.movimientosTurno(turnoId);
  return [];
}
