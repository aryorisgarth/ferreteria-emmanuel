/**
 * FERRETERÍA EMMANUEL — DOMINIO COMERCIAL DE PAGOS Y CARTERA
 * Fase 1.3: Tipos de dominio, contratos y especificaciones para pagos, abonos y transferencias.
 * 
 * Reglas de negocio obligatorias:
 * 1. Métodos permitidos exclusivamente: EFECTIVO, TRANSFERENCIA, CREDITO.
 * 2. Solo dueños autorizan ventas a crédito y registran abonos.
 * 3. Ventas en efectivo requieren turno de caja y generan ingreso de caja.
 * 4. Ventas a crédito jamás generan movimientos de caja física.
 * 5. Abonos se efectúan únicamente en EFECTIVO o TRANSFERENCIA.
 * 6. Transferencias bancarias exigen referencia, comprobante y verificación de un dueño.
 * 7. El comprobante (voucher) NO acredita el pago por sí solo.
 */

import type { SesionAutenticadaServidor } from "@/lib/domain/cotizaciones/types";

// ============================================================================
// 1. MODALIDADES DE PAGO Y MEDIOS DE COBRO
// ============================================================================

export type MetodoPagoComercial = "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";

export type MedioCobroAbono = "EFECTIVO" | "TRANSFERENCIA";

export type EstadoTransferenciaBancaria =
  | "PENDIENTE_VERIFICACION"
  | "VERIFICADA"
  | "RECHAZADA";

// ============================================================================
// 2. ERRORES ESPECIALIZADOS DE DOMINIO DE PAGOS
// ============================================================================

export class ErrorDominioPagos extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDominioPagos";
  }
}

export class ErrorAutorizacionPagos extends ErrorDominioPagos {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorAutorizacionPagos";
  }
}

export class ErrorCreditoExcedido extends ErrorDominioPagos {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorCreditoExcedido";
  }
}

export class ErrorTransferenciaInvalida extends ErrorDominioPagos {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorTransferenciaInvalida";
  }
}

export class ErrorIdempotenciaPago extends ErrorDominioPagos {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorIdempotenciaPago";
  }
}

// ============================================================================
// 3. TRANSFERENCIAS BANCARIAS
// ============================================================================

export interface RegistroTransferenciaInput {
  referenciaBancaria: string;
  comprobanteUrl: string;
  bancoDestino?: string;
  monto: number;
  fechaTransferencia?: string;
}

export interface TransferenciaBancaria {
  id: string;
  referenciaBancaria: string;
  comprobanteUrl: string;
  monto: number;
  estado: EstadoTransferenciaBancaria;
  bancoDestino?: string;
  creadoPor: string;
  creadoEn: string;
  verificadoPor?: string | null;
  verificadoEn?: string | null;
  motivoRechazo?: string | null;
}

// ============================================================================
// 4. CRÉDITO Y CUENTAS POR COBRAR
// ============================================================================

export interface ClienteCreditoInfo {
  id: string;
  nombre: string;
  limiteCredito: number;
  saldoPendiente: number;
  diasCredito?: number;
  activo: boolean;
}

export interface FacturaCreditoInfo {
  id: string;
  numero: string;
  clienteId: string;
  total: number;
  saldoPendiente: number;
  estado: "EMITIDA" | "PAGADA" | "ANULADA";
  formaPago: "CREDITO";
}

export interface AutorizacionCredito {
  clienteId: string;
  montoCredito: number;
  autorizadoPor: string;
  rolAutorizador: "admin" | "ADMINISTRADOR";
  fechaAutorizacion: string;
  motivo?: string;
}

// ============================================================================
// 5. ABONOS A FACTURAS DE CRÉDITO
// ============================================================================

export interface AbonoCreditoInput {
  facturaId: string;
  clienteId: string;
  monto: number;
  medioCobro: MedioCobroAbono;
  turnoCajaId?: string | null;
  transferencia?: RegistroTransferenciaInput;
  idempotencyKey: string;
  notas?: string;
}

export interface AbonoCreditoResultado {
  id: string;
  folio: string;
  facturaId: string;
  clienteId: string;
  monto: number;
  medioCobro: MedioCobroAbono;
  saldoFacturaPrevio: number;
  saldoFacturaRestante: number;
  saldoClientePrevio: number;
  saldoClienteRestante: number;
  estaTotalmentePagada: boolean;
  movimientoCaja?: {
    turnoCajaId: string;
    tipo: "INGRESO";
    monto: number;
    concepto: string;
    usuario: string;
  };
  transferencia?: TransferenciaBancaria;
  registradoPor: string;
  fecha: string;
  idempotencyKey: string;
}

// ============================================================================
// 6. RESULTADOS PREPARADOS DE VENTAS POR MÉTODO DE PAGO
// ============================================================================

export interface VentaEfectivoPreparada {
  facturaId: string;
  total: number;
  turnoCajaId: string;
  movimientoCaja: {
    turnoCajaId: string;
    tipo: "INGRESO";
    monto: number;
    concepto: string;
    usuario: string;
  };
}

export interface VentaCreditoPreparada {
  facturaId: string;
  clienteId: string;
  total: number;
  saldoClientePrevio: number;
  saldoClienteNuevo: number;
  saldoFacturaPendiente: number;
  autorizacion: AutorizacionCredito;
}

export interface VentaTransferenciaPreparada {
  facturaId: string;
  total: number;
  transferencia: TransferenciaBancaria;
  requiereVerificacion: true;
}
