export type UnidadMedida =
  | "UNIDAD"
  | "METRO"
  | "METRO_CUBICO"
  | "KILOGRAMO"
  | "LIBRA"
  | "BOLSA"
  | "CAJA"
  | "GALON"
  | "LITRO"
  | "ROLLO"
  | "PAR"
  | "JUEGO"
  | "TUBO"
  | "VARILLA"
  | "LAMINA"
  | "QUINTAL"
  | "PIE"
  | "YARDA";

export type EstadoSolicitud = "PENDIENTE_DE_REVISION" | "APROBADO" | "ENTREGADO";
export type TipoMovimiento = "ENTRADA" | "SALIDA" | "AJUSTE";
export type OrigenMovimiento = "MANUAL" | "SOLICITUD" | "SALIDA_DIRECTA" | "EXCEL" | "FACTURA" | "COMPRA" | "AJUSTE";
export type EstadoAuditoria = "NORMAL" | "EN_AUDITORIA" | "OBSERVADO";
export type FormaPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO" | "MIXTO";
export type OrigenFactura = "CAJA" | "COTIZACION" | "DIRECTA";

export interface DesglosePagoMixto {
  montoEfectivo: number;
  efectivoRecibido?: number;
  montoTransferencia: number;
  bancoDestino: string;
  bancoOrigen?: string;
  referenciaBancaria: string;
}

export interface FacturaCobro {
  id: string;
  facturaId: string;
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";
  monto: number;
  estado: "CONFIRMADO" | "PENDIENTE_VERIFICACION" | "RECHAZADO" | "REEMBOLSADO";
  bancoOrigen?: string;
  bancoDestino?: string;
  referenciaBancaria?: string;
  montoRecibido?: number;
  cambio?: number;
  turnoCajaId?: string;
  creadoPor: string;
  creadoEn: string;
}

export interface Pagina<T> {
  rows: T[];
  page: number;
  pages: number;
  total: number;
}

export interface TotalDia {
  productoId: string;
  codigo: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  total: number;
  destinatarios: string[];
}

export interface LineaCaptura {
  productoId: string;
  cantidad: number;
  observacion?: string;
}

export interface FilaExcel {
  codigo: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  fecha: string;
  destinatario?: string;
  concepto?: string;
  esAuditoria?: boolean;
}
