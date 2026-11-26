import { getRepo } from "./api-core";

export async function compras(page: number = 1) {
  return getRepo().compras(page);
}

export async function compra(id: string) {
  return getRepo().compra(id);
}

export async function altaCompra(input: any) {
  return getRepo().altaCompra(input);
}

export async function anularCompra(id: string, usuario: string, motivo: string = "Anulación comercial") {
  return getRepo().anularCompra(id, usuario, motivo);
}

export async function cuentasPorPagar() {
  return getRepo().cuentasPorPagar();
}

export async function altaAbonoCompra(input: any) {
  return getRepo().altaAbonoCompra(input);
}

export async function pagosDeCompra(compraId: string) {
  return getRepo().pagosDeCompra(compraId);
}

export async function pedidos(page: number = 1, filtros?: any) {
  return (getRepo() as any).pedidos(page, filtros);
}

export async function pedido(id: string) {
  return getRepo().pedido(id);
}

export async function altaPedido(input: any) {
  return getRepo().altaPedido(input);
}

export async function cambiarEstadoPedido(id: string, nuevoEstado: any) {
  return getRepo().cambiarEstadoPedido(id, nuevoEstado);
}

export async function recepciones(page: number = 1, filtros?: any) {
  return (getRepo() as any).recepciones(page, filtros);
}

export async function recepcion(id: string) {
  return getRepo().recepcion(id);
}

export async function altaRecepcion(input: any) {
  return getRepo().altaRecepcion(input);
}

export async function devoluciones(page: number = 1, filtros?: any) {
  return (getRepo() as any).devoluciones(page, filtros);
}

export async function devolucion(id: string) {
  return getRepo().devolucion(id);
}

export async function altaDevolucionProveedor(input: any) {
  return getRepo().altaDevolucionProveedor(input);
}
