import { paginar } from "@/lib/format";
import {
  anularCompra,
  cambiarEstadoPedidoCompra,
  crearPedidoCompra,
  detalleCompra,
  detallePedidoCompra,
  detalleRecepcionCompra,
  historialPagosCompra,
  listarCuentasPorPagar,
  listarPedidosCompra,
  listarRecepcionesCompra,
  registrarAbonoCompra,
  registrarCompra,
  registrarRecepcionCompra,
  totalesLineas,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { CondicionPagoCompra, EstadoPedidoCompra, FormaPagoCompra } from "@/lib/types";

export function compras(page: number) {
  return consultar((db) =>
    paginar(
      [...db.compras]
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero))
        .map((compra) => ({ compra, ...totalesLineas(compra.items) })),
      page,
    ),
  );
}

export function compra(id: string) {
  return consultar((db) => detalleCompra(db, id));
}

export function altaCompra(input: {
  proveedor: string; proveedorId?: string | null; fecha: string; notas: string; creadoPor: string;
  facturaProveedor?: string; condicionPago?: CondicionPagoCompra; formaPago?: FormaPagoCompra;
  diasCredito?: number; fechaVencimiento?: string; recepcionId?: string | null; pedidoId?: string | null;
  descuento?: number; iva?: number; isv?: number; tasaIva?: number;
  items: Array<{ productoId: string; cantidad: number; precio: number; observacion?: string }>;
}) {
  return transaccion((db) => registrarCompra(db, input).id);
}

export function anularCompraLocal(id: string, usuario: string) {
  transaccion((db) => anularCompra(db, id, usuario));
}

export function pedidos(page?: number, filtros?: { estado?: EstadoPedidoCompra; proveedorId?: string }) {
  return consultar((db) => {
    const list = listarPedidosCompra(db, filtros);
    return page ? paginar(list, page) : { rows: list, total: list.length, pages: 1, page: 1 };
  });
}

export function pedido(id: string) {
  return consultar((db) => detallePedidoCompra(db, id));
}

export function altaPedido(input: {
  proveedor: string; proveedorId?: string | null; fechaEmision: string; fechaEntregaEstimada?: string;
  notas?: string; creadoPor: string; estado?: EstadoPedidoCompra;
  items: Array<{ productoId: string; cantidadPedida: number; precioUnitario: number; observacion?: string }>;
}) {
  return transaccion((db) => crearPedidoCompra(db, input).id);
}

export function cambiarEstadoPedido(id: string, nuevoEstado: EstadoPedidoCompra) {
  transaccion((db) => cambiarEstadoPedidoCompra(db, id, nuevoEstado));
}

export function recepciones(page?: number, filtros?: { proveedorId?: string }) {
  return consultar((db) => {
    const list = listarRecepcionesCompra(db, filtros);
    return page ? paginar(list, page) : { rows: list, total: list.length, pages: 1, page: 1 };
  });
}

export function recepcion(id: string) {
  return consultar((db) => detalleRecepcionCompra(db, id));
}

export function altaRecepcion(input: {
  pedidoId?: string | null; proveedor: string; proveedorId?: string | null; fecha: string;
  remisionProveedor?: string; responsable: string; estadoConformidad?: "CONFORME" | "INCOMPLETO" | "CON_DANOS";
  notas?: string;
  items: Array<{ productoId: string; cantidadRecibida: number; costoUnitario: number; lineaPedidoId?: string; observacion?: string }>;
}) {
  return transaccion((db) => registrarRecepcionCompra(db, input).id);
}

export function cuentasPorPagar() {
  return consultar((db) => listarCuentasPorPagar(db));
}

export function altaAbonoCompra(input: {
  compraId: string; fecha: string; monto: number; formaPago?: FormaPagoCompra;
  referencia?: string; notas?: string; creadoPor: string;
}) {
  return transaccion((db) => registrarAbonoCompra(db, input).id);
}

export function pagosDeCompra(compraId: string) {
  return consultar((db) => historialPagosCompra(db, compraId));
}
