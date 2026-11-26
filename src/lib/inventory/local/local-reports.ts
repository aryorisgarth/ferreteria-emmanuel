import { hoyISO } from "@/lib/format";
import {
  generarRespaldoDatos,
  reporteAuditoriaTrazabilidad,
  reporteCajaYTurnos,
  reporteComprasPorProveedor,
  reporteCuentasPorCobrar as calcCuentasPorCobrar,
  reporteCuentasPorPagar as calcCuentasPorPagar,
  reporteDevoluciones as calcDevoluciones,
  reporteVentasPorCajero,
  reporteVentasPorMedioPago,
  reporteVentasPorPeriodo,
  reporteVentasPorProducto,
  reporteValoracionInventario as calcValoracionInventario,
  resumenNegocio,
  verificarIntegridadRespaldo,
  type FiltroReporte,
} from "@/lib/inventory/engine";
import { consultar } from "@/lib/inventory/store";

export function resumen(fecha?: string) {
  return consultar((db) => resumenNegocio(db, fecha || hoyISO()));
}

export function reporteVentasPeriodo(filtros?: FiltroReporte) {
  return consultar((db) => reporteVentasPorPeriodo(db, filtros));
}

export function reporteVentasProducto(filtros?: FiltroReporte) {
  return consultar((db) => reporteVentasPorProducto(db, filtros));
}

export function reporteVentasCajero(filtros?: FiltroReporte) {
  return consultar((db) => reporteVentasPorCajero(db, filtros));
}

export function reporteVentasMedioPago(filtros?: FiltroReporte) {
  return consultar((db) => reporteVentasPorMedioPago(db, filtros));
}

export function reporteComprasProveedor(filtros?: FiltroReporte) {
  return consultar((db) => reporteComprasPorProveedor(db, filtros));
}

export function reporteDevoluciones(filtros?: FiltroReporte) {
  return consultar((db) => calcDevoluciones(db, filtros));
}
export const reporteDevolucionesComerciales = reporteDevoluciones;

export function reporteValoracionInventario() {
  return consultar((db) => calcValoracionInventario(db));
}
export const reporteValoracionStock = reporteValoracionInventario;

export function reporteCuentasPorPagar() {
  return consultar((db) => calcCuentasPorPagar(db));
}
export const reporteCuentasPorPagarComercial = reporteCuentasPorPagar;

export function reporteCuentasPorCobrar() {
  return consultar((db) => calcCuentasPorCobrar(db));
}
export const reporteCuentasPorCobrarComercial = reporteCuentasPorCobrar;

export function reporteCajaTurnos(filtros?: FiltroReporte) {
  return consultar((db) => reporteCajaYTurnos(db, filtros));
}

export function reporteAuditoria(filtros?: FiltroReporte) {
  return consultar((db) => reporteAuditoriaTrazabilidad(db, filtros));
}

export function generarRespaldo(config?: any) {
  return consultar((db) => generarRespaldoDatos(db, config));
}

export function verificarRespaldo(payload: any) {
  return verificarIntegridadRespaldo(payload);
}
