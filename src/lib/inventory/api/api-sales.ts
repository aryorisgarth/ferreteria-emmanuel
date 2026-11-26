import * as local from "@/lib/inventory/local";
import { getStorageProvider } from "@/lib/repositories";
import { getRepo } from "./api-core";

export async function facturas(page: number = 1, q: string = "", estado: string = "") {
  return (getRepo() as any).facturas(page, q, estado);
}

export async function cuentasPorCobrar(page: number = 1, q: string = "") {
  if (getStorageProvider() === "postgres") {
    const repo = getRepo() as any;
    if (typeof repo.cuentasPorCobrar === "function") {
      return repo.cuentasPorCobrar(page, q);
    }
    throw new Error("El repositorio PostgreSQL no implementa cuentasPorCobrar.");
  }
  return local.cuentasPorCobrar(page, q);
}

export async function factura(id: string) {
  return getRepo().factura(id);
}

export async function emitirFactura(input: any) {
  return getRepo().emitirFactura(input);
}

export async function anularFactura(id: string, usuario: string, motivo: string = "Anulación administrativa") {
  return getRepo().anularFactura(id, usuario, motivo);
}

export async function pagarFactura(id: string, formaPago?: any) {
  return getRepo().pagarFactura(id, formaPago);
}

export async function registrarDevolucionCliente(input: any) {
  return getRepo().registrarDevolucionCliente(input);
}

export async function devolucionCliente(id: string) {
  return getRepo().devolucionCliente(id);
}

export async function devolucionesCliente(filtros?: any) {
  return getRepo().devolucionesCliente(filtros);
}
