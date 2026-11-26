import type { FormaPago } from "@/lib/types";
import { getRepo } from "./api-core";

export async function cotizaciones(page: number = 1, q: string = "", estado: string = "") {
  return (getRepo() as any).cotizaciones(page, estado || q);
}

export async function cotizacion(id: string) {
  return getRepo().cotizacion(id);
}

export async function crearCotizacion(input: any) {
  return getRepo().crearCotizacion(input);
}

export async function marcarCotizacion(id: string, estado: any, motivo?: string) {
  return getRepo().marcarCotizacion(id, estado);
}

export async function convertirCotizacionAVenta(input: {
  cotizacionId: string;
  creadoPor: string;
  origen?: "CAJA" | "COTIZACION" | "DIRECTA";
  formaPago?: FormaPago;
  fecha?: string;
  politicaPrecios?: any;
  montoRecibido?: number;
}) {
  return (getRepo() as any).convertirCotizacionAVenta(input.cotizacionId, input.creadoPor, input.origen, input.formaPago);
}

export async function editarCotizacion(id: string, input: any) {
  return getRepo().editarCotizacion(id, input);
}

export async function borrarCotizacion(id: string) {
  return getRepo().borrarCotizacion(id);
}
