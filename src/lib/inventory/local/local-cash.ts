import { paginar } from "@/lib/format";
import {
  abrirTurno as engineAbrirTurno,
  cerrarTurno as engineCerrarTurno,
  historialTurnos,
  movimientosDelTurno,
  registrarMovimientoCaja as engineRegistrarMovimientoCaja,
  turnoActivo as engineTurnoActivo,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";

export function turnoActivo(_usuario?: string) {
  return consultar((db) => engineTurnoActivo(db));
}
export const obtenerTurnoActivo = turnoActivo;

export function abrirTurno(input: { montoInicial: number; usuario: string; fecha?: string }) {
  return transaccion((db) => engineAbrirTurno(db, input));
}
export const abrirTurnoCaja = abrirTurno;

export function registrarMovimientoCaja(input: { tipo: "INGRESO" | "EGRESO"; monto: number; concepto: string; usuario: string; turnoCajaId?: string }) {
  return transaccion((db) => engineRegistrarMovimientoCaja(db, input));
}
export const registrarMovimiento = registrarMovimientoCaja;

export function cerrarTurno(input: { montoFinalReal: number; notas?: string; usuario: string; turnoId?: string }) {
  return transaccion((db) => engineCerrarTurno(db, input));
}
export const cerrarTurnoCaja = cerrarTurno;

export function turnos(page?: number) {
  return consultar((db) => paginar(historialTurnos(db), page));
}

export function movimientosTurno(turnoId: string) {
  return consultar((db) => movimientosDelTurno(db, turnoId));
}
