import type { LineaComercial } from "./types-commercial";

export type EstadoPedidoCompra = "BORRADOR" | "EMITIDO" | "PARCIAL" | "RECIBIDO" | "CANCELADO";

export interface LineaPedidoCompra {
  id: string;
  productoId: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  precioUnitario: number;
  observacion?: string;
}

export interface PedidoCompra {
  id: string;
  numero: string;
  proveedorId: string | null;
  proveedor: string;
  fechaEmision: string;
  fechaEntregaEstimada?: string;
  estado: EstadoPedidoCompra;
  notas: string;
  creadoPor: string;
  items: LineaPedidoCompra[];
  createdAt: string;
}

export type EstadoRecepcionCompra = "RECIBIDA" | "ANULADA";

export interface LineaRecepcionCompra {
  id: string;
  productoId: string;
  cantidadRecibida: number;
  costoUnitario: number;
  lineaPedidoId?: string;
  observacion?: string;
}

export interface RecepcionCompra {
  id: string;
  numero: string;
  pedidoId?: string | null;
  proveedorId: string | null;
  proveedor: string;
  fecha: string;
  remisionProveedor?: string;
  responsable: string;
  estadoConformidad?: "CONFORME" | "INCOMPLETO" | "CON_DANOS";
  notas: string;
  stockAplicado: boolean;
  items: LineaRecepcionCompra[];
  createdAt: string;
}

export type CondicionPagoCompra = "CONTADO" | "CREDITO";
export type EstadoPagoCompra = "PAGADO" | "PENDIENTE" | "PARCIAL";
export type FormaPagoCompra = "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "OTRO";

export interface Compra {
  id: string;
  numero: string;
  facturaProveedor?: string;
  proveedorId: string | null;
  proveedor: string;
  fecha: string;
  notas: string;
  creadoPor: string;
  anulada: boolean;
  fechaAnulacion?: string;
  anuladaPor?: string;
  motivoAnulacion?: string;
  items: LineaComercial[];
  pedidoId?: string | null;
  recepcionId?: string | null;
  stockAplicado?: boolean;
  condicionPago?: CondicionPagoCompra;
  formaPago?: FormaPagoCompra;
  diasCredito?: number;
  fechaVencimiento?: string;
  saldoPendiente?: number;
  estadoPago?: EstadoPagoCompra;
  descuento?: number;
  iva?: number;
  isv?: number;
  total?: number;
  createdAt?: string;
}

export interface PagoCompra {
  id: string;
  numero: string;
  compraId: string;
  proveedorId?: string | null;
  fecha: string;
  monto: number;
  formaPago: FormaPagoCompra;
  referencia?: string;
  notas: string;
  creadoPor: string;
  createdAt: string;
}

export interface LineaDevolucionProveedor {
  id: string;
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  costoLibros?: number;
  observacion?: string;
}

export interface DevolucionProveedor {
  id: string;
  numero: string;
  compraId: string;
  proveedorId: string | null;
  proveedor: string;
  fecha: string;
  motivo: string;
  notaCreditoProveedor?: string;
  creadoPor: string;
  stockAplicado: boolean;
  total: number;
  items: LineaDevolucionProveedor[];
  createdAt: string;
}
