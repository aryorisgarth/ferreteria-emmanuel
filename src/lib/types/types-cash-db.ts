import type { Acta, AjusteInventario, ConteoFisico, Movimiento, Solicitud } from "./types-warehouse";
import type { Cotizacion, DevolucionCliente, Factura } from "./types-commercial";
import type { Cliente, Gasto, Proveedor } from "./types-entities";
import type { Compra, DevolucionProveedor, PagoCompra, PedidoCompra, RecepcionCompra } from "./types-purchases";
import type { Oficina, Producto } from "./types-products";

export interface TurnoCaja {
  id: string;
  numero: string;
  usuario: string;
  fechaApertura: string;
  fechaCierre: string | null;
  montoInicial: number;
  montoFinalReal: number | null;
  diferencia: number | null;
  totalVentasEfectivo: number;
  totalVentasTransferencia: number;
  totalVentasTarjeta: number;
  totalVentasCredito: number;
  totalIngresosExtra: number;
  totalEgresos: number;
  estado: "ABIERTO" | "CERRADO";
  notas: string;
}

export interface MovimientoCaja {
  id: string;
  turnoCajaId: string;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  concepto: string;
  fecha: string;
  usuario: string;
}

export interface DB {
  productos: Producto[];
  oficinas: Oficina[];
  solicitudes: Solicitud[];
  actas: Acta[];
  movimientos: Movimiento[];
  cotizaciones: Cotizacion[];
  facturas: Factura[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  compras: Compra[];
  gastos: Gasto[];
  turnosCaja?: TurnoCaja[];
  movimientosCaja?: MovimientoCaja[];
  ajustesInventario?: AjusteInventario[];
  conteosFisicos?: ConteoFisico[];
  pedidosCompra?: PedidoCompra[];
  recepcionesCompra?: RecepcionCompra[];
  devolucionesProveedor?: DevolucionProveedor[];
  devolucionesCliente?: DevolucionCliente[];
  pagosCompra?: PagoCompra[];
  categorias: string[];
  folios: {
    solicitud: number;
    acta: number;
    excel: number;
    cotizacion: number;
    factura: number;
    compra: number;
    turno?: number;
    ajuste?: number;
    conteo?: number;
    pedido?: number;
    recepcion?: number;
    devolucion?: number;
    devolucionCliente?: number;
    pago?: number;
  };
}
