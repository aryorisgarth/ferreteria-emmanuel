import type { DB, Gasto } from "@/lib/types";
import { ReglaBodegaError, fechaValida } from "./engine-core";
import { r2 } from "@/lib/format";

export function crearGasto(
  db: DB,
  input: { fecha: string; concepto: string; categoria: string; monto: number; notas: string; creadoPor: string },
): Gasto {
  fechaValida(input.fecha);
  const concepto = input.concepto.trim();
  if (!concepto) throw new ReglaBodegaError("El concepto del gasto es obligatorio.");
  if (!(input.monto > 0)) throw new ReglaBodegaError("El monto debe ser mayor que cero.");
  const gasto: Gasto = {
    id: crypto.randomUUID(),
    fecha: input.fecha,
    concepto,
    categoria: input.categoria.trim() || "General",
    monto: r2(input.monto),
    notas: (input.notas ?? "").trim(),
    creadoPor: input.creadoPor ?? "Sistema",
  };
  db.gastos.push(gasto);
  return gasto;
}

export function editarGasto(
  db: DB,
  id: string,
  input: { fecha: string; concepto: string; categoria: string; monto: number; notas: string },
): Gasto {
  const gasto = db.gastos.find((g) => g.id === id);
  if (!gasto) throw new ReglaBodegaError("El gasto no existe.");
  fechaValida(input.fecha);
  const concepto = input.concepto.trim();
  if (!concepto) throw new ReglaBodegaError("El concepto del gasto es obligatorio.");
  if (!(input.monto > 0)) throw new ReglaBodegaError("El monto debe ser mayor que cero.");
  gasto.fecha = input.fecha;
  gasto.concepto = concepto;
  gasto.categoria = input.categoria.trim() || "General";
  gasto.monto = r2(input.monto);
  gasto.notas = input.notas.trim();
  return gasto;
}

export function eliminarGasto(db: DB, id: string): void {
  if (!db.gastos.some((g) => g.id === id)) throw new ReglaBodegaError("El gasto no existe.");
  db.gastos = db.gastos.filter((g) => g.id !== id);
}
