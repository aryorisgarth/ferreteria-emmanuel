import type { EstadoPedidoCompra } from "@/lib/types";

export interface LineaCompraInput {
  productoId: string;
  cantidad: number;
  precio: number;
  descuento?: number;
  exentoIva?: boolean;
  observacion?: string;
}

export interface AltaCompraInput {
  facturaProveedor?: string;
  proveedorId?: string | null;
  proveedor: string;
  fecha?: string;
  notas?: string;
  creadoPor: string;
  condicionPago?: "CONTADO" | "CREDITO";
  formaPago?: "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "OTRO";
  diasCredito?: number;
  pedidoId?: string | null;
  recepcionId?: string | null;
  stockAplicado?: boolean;
  items: LineaCompraInput[];
}

export interface AltaAbonoCompraInput {
  compraId: string;
  monto: number;
  formaPago?: "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "OTRO";
  referencia?: string;
  notas?: string;
  creadoPor: string;
}

export interface AltaPedidoInput {
  proveedorId?: string | null;
  proveedor: string;
  fechaEntregaEstimada?: string;
  notas?: string;
  creadoPor: string;
  items: { productoId: string; cantidad: number; precioUnitario: number; observacion?: string }[];
}

export interface AltaRecepcionInput {
  pedidoId?: string | null;
  proveedorId?: string | null;
  proveedor: string;
  remisionProveedor?: string;
  responsable: string;
  estadoConformidad?: "CONFORME" | "INCOMPLETO" | "CON_DANOS";
  notas?: string;
  items: { productoId: string; cantidad: number; costoUnitario: number; lineaPedidoId?: string; observacion?: string }[];
}

export interface AltaDevolucionProveedorInput {
  compraId: string;
  motivo: string;
  notaCreditoProveedor?: string;
  creadoPor: string;
  items: { productoId: string; cantidad: number; observacion?: string }[];
}
