import type { FormaPago, OrigenFactura, UnidadMedida } from "./types-core";

export type EstadoCotizacion =
  | "BORRADOR"
  | "EMITIDA"
  | "ENVIADA"
  | "ACEPTADA"
  | "RECHAZADA"
  | "VENCIDA"
  | "FACTURADA"
  | "PENDIENTE_AUTORIZACION"
  | "AUTORIZADA"
  | "PARCIALMENTE_FACTURADA"
  | "TOTALMENTE_FACTURADA"
  | "SUSTITUIDA"
  | "CANCELADA";

export type EstadoFactura = "EMITIDA" | "PAGADA" | "ANULADA";

export interface LineaComercial {
  id: string;
  productoId: string;
  cantidad: number;
  precio: number;
  unidadMedida: UnidadMedida;
  observacion: string;
  costoUnitario?: number;
  descuento?: number;
  exentoIva?: boolean;
  cotizacionItemId?: string;
  cantidadFacturada?: number;
  cantidadPendiente?: number;
}

export interface Cotizacion {
  id: string;
  numero: string;
  folio?: string;
  cliente: string;
  clienteId: string | null;
  fecha: string;
  fechaVencimiento?: string;
  estado: EstadoCotizacion;
  notas: string;
  condicionesComerciales?: string;
  creadoPor: string;
  facturaId: string | null;
  items: LineaComercial[];
  subtotal?: number;
  descuento?: number;
  iva?: number;
  total?: number;
  version?: number;
  cotizacionRaizId?: string | null;
  versionPadreId?: string | null;
  esVersionActual?: boolean;
  autorizadaPor?: string | null;
  autorizadaEn?: string | null;
}

export interface Factura {
  id: string;
  numero: string;
  cliente: string;
  clienteId: string | null;
  fecha: string;
  cotizacionId: string | null;
  cotizacionVersion?: number;
  notas: string;
  creadoPor: string;
  estado: EstadoFactura;
  stockAplicado: boolean;
  formaPago: FormaPago;
  origen: OrigenFactura;
  items: LineaComercial[];
  descuento?: number;
  subtotal?: number;
  iva?: number;
  isv?: number;
  total?: number;
  costoTotalVenta?: number;
  montoRecibido?: number;
  cambio?: number;
  anulada?: boolean;
  motivoAnulacion?: string;
  anuladaPor?: string;
  fechaAnulacion?: string;
  claveIdempotencia?: string;
}

export interface LineaDevolucionCliente {
  id: string;
  productoId: string;
  cantidad: number;
  precioVenta: number;
  costoUnitario?: number;
  observacion?: string;
}

export interface DevolucionCliente {
  id: string;
  numero: string;
  facturaId: string;
  facturaNumero: string;
  cliente: string;
  clienteId?: string | null;
  fecha: string;
  motivo: string;
  responsable: string;
  items: LineaDevolucionCliente[];
  subtotal: number;
  iva: number;
  totalReintegro: number;
  metodoReintegro: "EFECTIVO" | "NOTA_CREDITO";
  reintegroCajaId?: string | null;
  createdAt: string;
}
