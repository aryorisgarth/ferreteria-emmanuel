/**
 * FERRETERÍA EMMANUEL — DOMINIO COMERCIAL DE COTIZACIONES
 * Fase 1.2: Contratos de dominio, tipos, errores y especificaciones para CotizacionesService.
 * 
 * Reglas de negocio clave:
 * 1. Solo dueños autorizan precios negociados y nuevas versiones.
 * 2. Facturas históricas conservan su vínculo con la versión original.
 * 3. Nuevas versiones administran únicamente compromisos pendientes.
 * 4. Anulaciones y devoluciones NO reabren cantidades cotizadas.
 * 5. Cantidades pendientes nunca pueden ser negativas; sobrefacturaciones se reportan como error de integridad.
 */

import type {
  Cotizacion,
  EstadoCotizacion,
  LineaComercial,
  UnidadMedida,
} from "@/lib/types";

// ============================================================================
// 1. ESTADOS DE DOMINIO Y ROLES AUTORIZADORES
// ============================================================================

export type RolAutorizadorPrecio = "admin" | "ADMINISTRADOR";

export type EstadoCotizacionDominio = EstadoCotizacion;

// ============================================================================
// 2. ERRORES DE DOMINIO ESPECIALIZADOS
// ============================================================================

export class ErrorDominioCotizacion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDominioCotizacion";
  }
}

export class ErrorAutorizacionCotizacion extends ErrorDominioCotizacion {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorAutorizacionCotizacion";
  }
}

export class ErrorIntegridadCotizacion extends ErrorDominioCotizacion {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorIntegridadCotizacion";
  }
}

export class ErrorTransicionCotizacion extends ErrorDominioCotizacion {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorTransicionCotizacion";
  }
}

// ============================================================================
// 3. MODELO DE LÍNEA COTIZADA Y CONTROL DE SALDOS
// ============================================================================

export interface LineaCotizadaDominio {
  id: string;
  cotizacionId: string;
  productoId: string;
  cantidad: number;
  precio: number;
  costoUnitario?: number;
  unidadMedida: UnidadMedida;
  observacion?: string;
  descuento?: number;
  exentoIva?: boolean;
}

/**
 * Representa el saldo computado de una línea cotizada contra el historial de facturación.
 */
export interface LineaCotizadaSaldo extends LineaCotizadaDominio {
  cantidadFacturada: number;
  cantidadPendiente: number;
  subtotalLineaOriginal: number;
  subtotalLineaFacturado: number;
  subtotalLineaPendiente: number;
  estaCompletamenteFacturada: boolean;
  haSidoSobrefacturada?: boolean;
  excesoFacturado?: number;
}

// ============================================================================
// 4. MODELO DE COTIZACIÓN VERSIONADA
// ============================================================================

export interface CotizacionVersionada extends Omit<Cotizacion, "items"> {
  version: number;
  cotizacionRaizId: string;
  versionPadreId?: string | null;
  esVersionActual: boolean;
  autorizadaPor?: string | null;
  autorizadaEn?: string | null;
  items: LineaCotizadaDominio[];
}

/**
 * Resumen global del saldo de una cotización versionada.
 */
export interface ResumenSaldosCotizacion {
  cotizacionId: string;
  cotizacionNumero: string;
  version: number;
  esVersionActual: boolean;
  estado: EstadoCotizacionDominio;
  items: LineaCotizadaSaldo[];
  subtotalOriginal: number;
  subtotalFacturado: number;
  subtotalPendiente: number;
  totalOriginal: number;
  totalFacturado: number;
  totalPendiente: number;
  estaTotalmenteFacturada: boolean;
  estaParcialmenteFacturada: boolean;
  tieneSaldosPendientes: boolean;
  tieneInconsistencias?: boolean;
  inconsistencias?: string[];
}

// ============================================================================
// 5. AUTORIZACIÓN DE PRECIOS NEGOCIADOS
// ============================================================================

export interface AutorizacionPrecio {
  productoId: string;
  precioAutorizado: number;
  autorizadoPor: string;
  rolAutorizador: RolAutorizadorPrecio;
  fechaAutorizacion: string;
  motivo?: string;
}

export interface ResultadoValidacionPrecio {
  valido: boolean;
  precioFinal: number;
  esPrecioNegociado: boolean;
  autorizacionAplicada?: AutorizacionPrecio;
  error?: string;
}

// ============================================================================
// 6. REFERENCIAS DE FACTURACIÓN Y LÍNEAS FACTURADAS HISTÓRICAS
// ============================================================================

export interface ReferenciaFacturaLineaCotizada {
  facturaId: string;
  facturaNumero: string;
  facturaEstado: "EMITIDA" | "PAGADA" | "ANULADA";
  cotizacionId: string;
  cotizacionItemId: string;
  productoId: string;
  cantidadFacturada: number;
  precioUnitario: number;
  fechaFactura: string;
}

// ============================================================================
// 7. FACTURACIÓN PARCIAL (SOLICITUD Y RESULTADO)
// ============================================================================

export interface ItemFacturacionParcialSolicitud {
  cotizacionItemId: string;
  cantidadAFacturar: number;
}

export interface SolicitudFacturacionParcial {
  cotizacionId: string;
  clienteId: string;
  usuario: string;
  fecha: string;
  items: ItemFacturacionParcialSolicitud[];
  notas?: string;
  idempotencyKey?: string;
}

export interface ItemFacturacionParcialValidado {
  cotizacionItemId: string;
  productoId: string;
  cantidadSolicitada: number;
  cantidadPendientePrevia: number;
  cantidadPendienteRestante: number;
  precioUnitario: number;
  descuentoUnitario: number;
  exentoIva: boolean;
  subtotal: number;
  iva: number;
  total: number;
}

export interface ResultadoValidacionFacturacionParcial {
  valida: boolean;
  cotizacionId: string;
  cotizacionNumero: string;
  version: number;
  itemsValidados: ItemFacturacionParcialValidado[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  todosSaldosLiquidados: boolean;
  errores?: string[];
}

// ============================================================================
// 8. ADAPTADOR DE AUTORIZACIÓN SERVER-SIDE
// ============================================================================

export interface SesionAutenticadaServidor {
  id: string;
  usuario: string;
  nombre: string;
  rol: string;
}

export interface IAdaptadorAutorizacionServidor {
  obtenerSesion(): Promise<SesionAutenticadaServidor | null> | SesionAutenticadaServidor | null;
  esPropietario(sesion: SesionAutenticadaServidor | null | undefined): boolean;
}

// ============================================================================
// 9. INTEGRACIÓN POS / CARRITO
// ============================================================================

export interface ItemParaCarritoPOS {
  cotizacionItemId: string;
  productoId: string;
  cantidadSugerida: number;
  cantidadMaximaPermitida: number;
  precioUnitarioBloqueado: number;
  descuentoUnitario: number;
  unidadMedida: UnidadMedida;
  exentoIva: boolean;
  observacion: string;
}

export interface PreparacionPOSCotizacion {
  cotizacionId: string;
  cotizacionNumero: string;
  version: number;
  clienteId: string | null;
  clienteNombre: string;
  esFacturable: boolean;
  motivoNoFacturable?: string;
  itemsParaCarrito: ItemParaCarritoPOS[];
  subtotalPendiente: number;
  totalPendiente: number;
}

// ============================================================================
// 10. CONTRATOS FUTUROS PARA REPOSITORIOS Y OPERACIONES TRANSACCIONALES
// ============================================================================

export interface ITransaccionCotizacionesRepositorio {
  obtenerCotizacionVersionada(cotizacionId: string): Promise<CotizacionVersionada | null>;
  obtenerHistorialFacturacionLineas(cotizacionId: string): Promise<ReferenciaFacturaLineaCotizada[]>;
  obtenerSaldosCotizacion(cotizacionId: string): Promise<ResumenSaldosCotizacion>;
  autorizarCotizacion(params: {
    cotizacionId: string;
    autorizadoPor: string;
    rol: RolAutorizadorPrecio;
  }): Promise<{ ok: boolean; cotizacion: CotizacionVersionada }>;
  crearNuevaVersionCotizacion(params: {
    versionActualId: string;
    nuevosItems: LineaCotizadaDominio[];
    usuario: string;
    motivo: string;
  }): Promise<{ versionAnteriorSustituida: CotizacionVersionada; nuevaVersion: CotizacionVersionada }>;
}
