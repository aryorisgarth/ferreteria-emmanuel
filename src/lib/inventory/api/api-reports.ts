import * as local from "@/lib/inventory/local";
import * as remoto from "@/lib/inventory/supabase-bodega";
import { conexion, getRepo } from "./api-core";

export async function resumen(fecha?: string) {
  const sb = conexion();
  if (sb) return remoto.resumen(sb);
  return (getRepo() as any).resumen(fecha);
}

export async function reporteVentasPeriodo(filtros?: any) {
  return getRepo().reporteVentasPeriodo(filtros);
}

export async function reporteVentasProducto(filtros?: any) {
  return getRepo().reporteVentasProducto(filtros);
}

export async function reporteVentasCajero(filtros?: any) {
  return getRepo().reporteVentasCajero(filtros);
}

export async function reporteVentasMedioPago(filtros?: any) {
  return getRepo().reporteVentasMedioPago(filtros);
}

export async function reporteComprasProveedor(filtros?: any) {
  return getRepo().reporteComprasProveedor(filtros);
}

export async function reporteDevoluciones(filtros?: any) {
  return getRepo().reporteDevoluciones(filtros);
}

export async function reporteValoracionInventario() {
  return getRepo().reporteValoracionInventario();
}

export async function reporteCuentasPorPagar() {
  return getRepo().reporteCuentasPorPagar();
}

export async function reporteCuentasPorCobrar() {
  return getRepo().reporteCuentasPorCobrar();
}

export async function reporteCajaTurnos(filtros?: any) {
  return getRepo().reporteCajaTurnos(filtros);
}

export async function reporteAuditoria(filtros?: any) {
  return getRepo().reporteAuditoria(filtros);
}

export async function transferenciasPendientes() {
  if (typeof (getRepo() as any).transferenciasPendientes === "function") {
    return (getRepo() as any).transferenciasPendientes();
  }
  return [];
}

export async function verificarTransferencia(id: string, verificadoPor: string, montoAcreditado?: number) {
  return (getRepo() as any).verificarTransferencia(id, verificadoPor, montoAcreditado);
}

export async function rechazarTransferencia(id: string, verificadoPor: string, motivo: string) {
  return (getRepo() as any).rechazarTransferencia(id, verificadoPor, motivo);
}

export async function generarRespaldo(config?: any) {
  return getRepo().generarRespaldo(config);
}

export function verificarRespaldo(payload: any) {
  return local.verificarRespaldo(payload);
}
