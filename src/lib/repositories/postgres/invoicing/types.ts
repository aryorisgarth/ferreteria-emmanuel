export interface LineaFacturaInput {
  productoId: string;
  cantidad: number;
  precio: number;
  descuento?: number;
  exentoIva?: boolean;
  observacion?: string;
  cotizacionItemId?: string;
}

export interface EmitirFacturaInput {
  cliente: string;
  clienteId?: string | null;
  cotizacionId?: string | null;
  creadoPor: string;
  notas?: string;
  origen?: "CAJA" | "COTIZACION" | "DIRECTA";
  formaPago?: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO" | "MIXTO";
  montoRecibido?: number;
  exenta?: boolean;
  claveIdempotencia?: string;
  fecha?: string;
  referenciaBancaria?: string;
  bancoDestino?: string;
  bancoOrigen?: string;
  montoEfectivo?: number;
  montoTransferencia?: number;
  items: LineaFacturaInput[];
}

export interface TotalesFacturaCalculados {
  subtotal: number;
  totalDescuento: number;
  totalIva: number;
  costoTotalVenta: number;
  totalFactura: number;
  montoEfectivoCobro: number;
  montoTransfCobro: number;
  montoRecibidoRegistrado: number;
  cambioRegistrado: number;
  requiereVerificacionBancaria: boolean;
  stockAplicado: boolean;
  estadoInicialFactura: "EMITIDA" | "PAGADA";
}
