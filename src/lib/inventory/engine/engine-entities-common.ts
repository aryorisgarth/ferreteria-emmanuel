import type { Cliente, DatosPersona } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";

export function personaNueva(input: DatosPersona): Cliente {
  const nombre = input.nombre.trim();
  if (nombre.length < 2) throw new ReglaBodegaError("El nombre o razón social es obligatorio (mínimo 2 caracteres).");
  return {
    id: crypto.randomUUID(),
    nombre,
    telefono: (input.telefono || "").trim(),
    direccion: (input.direccion || "").trim(),
    notas: (input.notas || "").trim(),
    identificacion: input.identificacion?.trim() || undefined,
    email: input.email?.trim() || undefined,
    tipo: input.tipo || "PARTICULAR",
    contacto: input.contacto?.trim() || undefined,
    diasCredito: input.diasCredito !== undefined ? Math.max(0, input.diasCredito) : undefined,
    limiteCredito: input.limiteCredito !== undefined ? Math.max(0, input.limiteCredito) : undefined,
    activo: input.activo !== false,
  };
}
