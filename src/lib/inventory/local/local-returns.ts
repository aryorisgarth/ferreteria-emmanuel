import { paginar } from "@/lib/format";
import {
  detalleDevolucionCliente,
  detalleDevolucionProveedor,
  listarDevolucionesCliente,
  listarDevolucionesProveedor,
  registrarDevolucionCliente,
  registrarDevolucionProveedor,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";

export function devoluciones(page?: number, filtros?: { proveedorId?: string }) {
  return consultar((db) => {
    const list = listarDevolucionesProveedor(db, filtros);
    return page ? paginar(list, page) : { rows: list, total: list.length, pages: 1, page: 1 };
  });
}

export function devolucion(id: string) {
  return consultar((db) => detalleDevolucionProveedor(db, id));
}

export function altaDevolucionProveedor(input: {
  compraId: string;
  fecha: string;
  motivo: string;
  notaCreditoProveedor?: string;
  creadoPor: string;
  items: Array<{ productoId: string; cantidad: number; observacion?: string }>;
}) {
  return transaccion((db) => registrarDevolucionProveedor(db, input).id);
}

export function registrarDevolucionClienteLocal(input: Parameters<typeof registrarDevolucionCliente>[1]) {
  return transaccion((db) => registrarDevolucionCliente(db, input));
}

export function devolucionCliente(id: string) {
  return consultar((db) => detalleDevolucionCliente(db, id));
}

export function devolucionesCliente(filtros?: { facturaId?: string; clienteId?: string }) {
  return consultar((db) => listarDevolucionesCliente(db, filtros));
}
