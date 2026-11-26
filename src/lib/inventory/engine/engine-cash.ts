import type { DB, TurnoCaja, MovimientoCaja } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { siguiente } from "./engine-helpers";
import { r2 } from "@/lib/format";

export function turnoActivo(db: DB): TurnoCaja | null {
  return (db.turnosCaja ?? []).find((t) => t.estado === "ABIERTO") ?? null;
}

export function abrirTurno(
  db: DB,
  input: { montoInicial: number; usuario: string; fecha?: string }
): TurnoCaja {
  if (!db.turnosCaja) db.turnosCaja = [];
  const activo = turnoActivo(db);
  if (activo) {
    throw new ReglaBodegaError(`Ya existe un turno de caja abierto (#${activo.numero}) por ${activo.usuario}.`);
  }

  const fecha = input.fecha || new Date().toISOString().split("T")[0];
  const turno: TurnoCaja = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "turno", fecha),
    usuario: input.usuario,
    fechaApertura: new Date().toISOString(),
    fechaCierre: null,
    montoInicial: r2(Math.max(0, input.montoInicial || 0)),
    montoFinalReal: null,
    diferencia: null,
    totalVentasEfectivo: 0,
    totalVentasTransferencia: 0,
    totalVentasTarjeta: 0,
    totalVentasCredito: 0,
    totalIngresosExtra: 0,
    totalEgresos: 0,
    estado: "ABIERTO",
    notas: "",
  };

  db.turnosCaja.push(turno);
  return turno;
}

export function registrarMovimientoCaja(
  db: DB,
  input: { tipo: "INGRESO" | "EGRESO"; monto: number; concepto: string; usuario: string }
): MovimientoCaja {
  if (!db.movimientosCaja) db.movimientosCaja = [];
  const turno = turnoActivo(db);
  if (!turno) throw new ReglaBodegaError("No hay ningún turno de caja abierto.");

  const monto = r2(Math.abs(input.monto));
  if (monto <= 0) throw new ReglaBodegaError("El monto debe ser mayor a cero.");
  const concepto = input.concepto.trim();
  if (!concepto) throw new ReglaBodegaError("Debe indicar el concepto o motivo del movimiento.");

  const mov: MovimientoCaja = {
    id: crypto.randomUUID(),
    turnoCajaId: turno.id,
    tipo: input.tipo,
    monto,
    concepto,
    fecha: new Date().toISOString(),
    usuario: input.usuario,
  };

  db.movimientosCaja.push(mov);
  if (input.tipo === "INGRESO") {
    turno.totalIngresosExtra = r2(turno.totalIngresosExtra + monto);
  } else {
    turno.totalEgresos = r2(turno.totalEgresos + monto);
  }

  return mov;
}

export function arqueoTurnoActual(db: DB) {
  const turno = turnoActivo(db);
  if (!turno) return null;
  const montoEsperado = r2(
    turno.montoInicial +
    turno.totalVentasEfectivo +
    turno.totalIngresosExtra -
    turno.totalEgresos
  );
  return {
    turno,
    saldoCalculado: montoEsperado,
    montoEsperado,
    fondoInicial: turno.montoInicial,
    ventasEfectivo: turno.totalVentasEfectivo,
    ingresos: turno.totalIngresosExtra,
    egresos: turno.totalEgresos,
  };
}

export function cerrarTurno(
  db: DB,
  input: { montoFinalReal?: number; montoReal?: number; notas?: string; nota?: string; usuario: string }
): TurnoCaja {
  const turno = turnoActivo(db);
  if (!turno) throw new ReglaBodegaError("No hay un turno de caja abierto para cerrar.");

  const montoEsperado = r2(
    turno.montoInicial +
    turno.totalVentasEfectivo +
    turno.totalIngresosExtra -
    turno.totalEgresos
  );

  const real = r2(Math.max(0, input.montoFinalReal ?? input.montoReal ?? 0));
  turno.montoFinalReal = real;
  turno.diferencia = r2(real - montoEsperado);
  turno.fechaCierre = new Date().toISOString();
  turno.estado = "CERRADO";
  turno.notas = ((input.notas ?? input.nota) || "").trim();

  return turno;
}

export function historialTurnos(db: DB): TurnoCaja[] {
  return [...(db.turnosCaja ?? [])].sort((a, b) => b.fechaApertura.localeCompare(a.fechaApertura));
}

export function movimientosDelTurno(db: DB, turnoId: string): MovimientoCaja[] {
  return (db.movimientosCaja ?? []).filter((m) => m.turnoCajaId === turnoId);
}
