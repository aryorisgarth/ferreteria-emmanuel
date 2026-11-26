import { revalidatePath } from "next/cache";
import * as api from "@/lib/inventory/api";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import type { LineaCaptura } from "@/lib/types";
import { obtenerSesionActual, AutorizacionError } from "@/lib/auth";

export type ResultadoAccion = { ok: false; error: string } | null;

export async function usuario() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !sesion.usuario) {
    throw new AutorizacionError("Operación rechazada: Se requiere una sesión autenticada y trazable para registrar auditoría.");
  }
  return sesion.usuario;
}

export function mensaje(error: unknown): string {
  if (error instanceof AutorizacionError) return error.message;
  if (error instanceof Error) return error.message;
  return "No se pudo completar la operación.";
}

export function conParam(ruta: string, clave: string, texto: string) {
  const [path, query] = ruta.split("?");
  const params = new URLSearchParams(query || "");
  params.set(clave, texto);
  return `${path}?${params.toString()}`;
}

export function refrescar() {
  revalidatePath("/", "layout");
}

export function lineas(formData: FormData) {
  let items: LineaCaptura[];
  try {
    const crudo = JSON.parse(String(formData.get("items") || "[]"));
    if (!Array.isArray(crudo)) throw new Error("formato");
    items = crudo;
  } catch {
    throw new ReglaBodegaError("Los renglones no tienen el formato esperado.");
  }
  return items
    .map((item) => ({
      productoId: String(item.productoId || ""),
      cantidad: Number(item.cantidad),
      observacion: String(item.observacion || ""),
    }))
    .filter((item) => item.productoId && item.cantidad > 0);
}
