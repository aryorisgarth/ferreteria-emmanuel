import type {
  Compra,
  PagoCompra,
  PedidoCompra,
  RecepcionCompra,
  DevolucionProveedor,
  Pagina,
  EstadoPedidoCompra,
} from "@/lib/types";
import type { SqlExecutor } from "./client";
import type {
  AltaCompraInput,
  AltaAbonoCompraInput,
  AltaPedidoInput,
  AltaRecepcionInput,
  AltaDevolucionProveedorInput,
} from "./purchases/types";
import { obtenerCompras, obtenerCompra } from "./purchases/purchases-queries";
import { ejecutarAltaCompra } from "./purchases/purchases-creation";
import { ejecutarAnularCompra } from "./purchases/purchases-cancellation";
import {
  obtenerCuentasPorPagar,
  ejecutarAltaAbonoCompra,
  obtenerPagosDeCompra,
} from "./purchases/purchases-payables";
import {
  obtenerPedidos,
  obtenerPedido,
  ejecutarAltaPedido,
  ejecutarCambiarEstadoPedido,
} from "./purchases/purchases-orders";
import {
  obtenerRecepciones,
  obtenerRecepcion,
  ejecutarAltaRecepcion,
} from "./purchases/purchases-receptions";
import {
  obtenerDevoluciones,
  obtenerDevolucion,
  ejecutarAltaDevolucionProveedor,
} from "./purchases/purchases-returns";

export class PostgresPurchasesService {
  constructor(private executor: SqlExecutor) {}

  // --- COMPRAS ---
  compras = (page: number = 1): Promise<Pagina<Compra>> => obtenerCompras(this.executor, page);
  compra = (id: string): Promise<Compra | null> => obtenerCompra(this.executor, id);
  altaCompra = (input: AltaCompraInput): Promise<string> => ejecutarAltaCompra(this.executor, input);
  anularCompra = (id: string, usuario: string, motivo: string): Promise<Compra> =>
    ejecutarAnularCompra(this.executor, id, usuario, motivo, (cid) => this.compra(cid));

  // --- CUENTAS POR PAGAR Y ABONOS ---
  cuentasPorPagar = (): Promise<Compra[]> => obtenerCuentasPorPagar(this.executor);
  altaAbonoCompra = (input: AltaAbonoCompraInput): Promise<string> =>
    ejecutarAltaAbonoCompra(this.executor, input, (cid) => this.compra(cid));
  pagosDeCompra = (compraId: string): Promise<PagoCompra[]> => obtenerPagosDeCompra(this.executor, compraId);

  // --- PEDIDOS ---
  pedidos = (page: number = 1): Promise<Pagina<PedidoCompra>> => obtenerPedidos(this.executor, page);
  pedido = (id: string): Promise<PedidoCompra | null> => obtenerPedido(this.executor, id);
  altaPedido = (input: AltaPedidoInput): Promise<string> => ejecutarAltaPedido(this.executor, input);
  cambiarEstadoPedido = (id: string, estado: EstadoPedidoCompra): Promise<PedidoCompra> =>
    ejecutarCambiarEstadoPedido(this.executor, id, estado, (pid) => this.pedido(pid));

  // --- RECEPCIONES ---
  recepciones = (page: number = 1): Promise<Pagina<RecepcionCompra>> => obtenerRecepciones(this.executor, page);
  recepcion = (id: string): Promise<RecepcionCompra | null> => obtenerRecepcion(this.executor, id);
  altaRecepcion = (input: AltaRecepcionInput): Promise<string> => ejecutarAltaRecepcion(this.executor, input);

  // --- DEVOLUCIONES A PROVEEDOR ---
  devoluciones = (page: number = 1): Promise<Pagina<DevolucionProveedor>> => obtenerDevoluciones(this.executor, page);
  devolucion = (id: string): Promise<DevolucionProveedor | null> => obtenerDevolucion(this.executor, id);
  altaDevolucionProveedor = (input: AltaDevolucionProveedorInput): Promise<string> =>
    ejecutarAltaDevolucionProveedor(this.executor, input, (cid) => this.compra(cid));
}
