/**
 * FERRETERÍA EMMANUEL — ORQUESTADOR DE FACTURACIÓN Y CONTRATOS TRANSACCIONALES
 * Fase 1.4: Definición de contratos para la orquestación de Cotizaciones → Facturación → Pagos → Inventario.
 * 
 * Reglas clave:
 * 1. Facturación parcial de versiones activas de cotizaciones autorizadas.
 * 2. Tres modalidades comerciales: EFECTIVO, TRANSFERENCIA, CREDITO.
 * 3. Transferencias pendientes no se asumen pagadas; requieren verificación de dueño.
 * 4. Créditos exigen autorización de dueño y respeto estricto del límite.
 * 5. Idempotencia con detección de colisión de parámetros.
 * 6. Devoluciones o anulaciones NO reabren compromisos cotizados.
 */

import type {
  CotizacionVersionada,
  EstadoCotizacionDominio,
  LineaCotizadaDominio,
  ReferenciaFacturaLineaCotizada,
  SesionAutenticadaServidor,
} from "@/lib/domain/cotizaciones/types";
import type {
  AutorizacionCredito,
  ClienteCreditoInfo,
  MetodoPagoComercial,
  RegistroTransferenciaInput,
  TransferenciaBancaria,
} from "@/lib/domain/pagos/types";
import type { UnidadMedida } from "@/lib/types";

// ============================================================================
// 1. SOLICITUD DE FACTURACIÓN DE COTIZACIÓN
// ============================================================================

export interface ItemFacturacionSolicitud {
  cotizacionItemId: string;
  cantidadAFacturar: number;
}

export interface SolicitudFacturacionCotizacion {
  cotizacionId: string;
  clienteId: string;
  clienteNombre: string;
  items: ItemFacturacionSolicitud[];
  formaPago: MetodoPagoComercial;
  pagoData: {
    turnoCajaId?: string | null;
    transferenciaInput?: RegistroTransferenciaInput;
    autorizacionCredito?: AutorizacionCredito | null;
  };
  usuario: string;
  fecha: string;
  idempotencyKey: string;
  notas?: string;
}

// ============================================================================
// 2. PLAN DE OPERACIÓN FACTURACIÓN (RESULTADO DEL ORQUESTADOR)
// ============================================================================

export type EstadoOperacionPlan = "CONFIRMADA" | "PENDIENTE_VERIFICACION_TRANSFERENCIA";

export interface LineaFacturaPreparada {
  id: string;
  cotizacionItemId: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  unidadMedida: UnidadMedida;
  exentoIva: boolean;
  subtotal: number;
  iva: number;
  total: number;
  observacion: string;
}

export interface MovimientoKardexPreparado {
  productoId: string;
  tipo: "SALIDA";
  motivo: "VENTA_FACTURA";
  cantidad: number;
  referenciaFacturaId: string;
  usuario: string;
}

export interface PlanOperacionFacturacion {
  facturaId: string;
  facturaNumero: string;
  cotizacionId: string;
  cotizacionVersion: number;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  formaPago: MetodoPagoComercial;
  estadoFactura: "EMITIDA" | "PAGADA";
  estadoOperacion: EstadoOperacionPlan;
  lineas: LineaFacturaPreparada[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  // Efectos preparados para los módulos vinculados
  movimientosKardex: MovimientoKardexPreparado[];
  movimientoCaja?: {
    turnoCajaId: string;
    tipo: "INGRESO";
    monto: number;
    concepto: string;
    usuario: string;
  };
  ajusteCartera?: {
    clienteId: string;
    saldoClientePrevio: number;
    saldoClienteNuevo: number;
    saldoFacturaPendiente: number;
    autorizacion: AutorizacionCredito;
  };
  transferencia?: TransferenciaBancaria;
  // Efecto sobre la cotización
  actualizacionCotizacion: {
    cotizacionId: string;
    nuevoEstado: EstadoCotizacionDominio;
    todosSaldosLiquidados: boolean;
  };
  idempotencyKey: string;
  creadoPor: string;
  creadoEn: string;
}

// ============================================================================
// 3. CONTRATO DE IDEMPOTENCIA CON DETECCIÓN DE CONFLICTOS
// ============================================================================

export interface RegistroIdempotenciaItem {
  idempotencyKey: string;
  hashPayload: string;
  plan: PlanOperacionFacturacion;
  registradoEn: string;
}

export interface IAlmacenIdempotencia {
  obtener(key: string): Promise<RegistroIdempotenciaItem | null> | RegistroIdempotenciaItem | null;
  guardar(item: RegistroIdempotenciaItem): Promise<void> | void;
}

// ============================================================================
// 4. CONTRATOS DE REPOSITORIO TRANSACCIONAL PARA FASE 3
// ============================================================================

export interface IRepositorioComercialTransaccional {
  /**
   * Obtiene la versión activa de la cotización bloqueada para lectura consistente.
   */
  obtenerCotizacionVersionada(cotizacionId: string): Promise<CotizacionVersionada | null>;

  /**
   * Obtiene todas las líneas de facturas emitidas históricamente contra la cotización.
   */
  obtenerHistorialFacturacionLineas(cotizacionId: string): Promise<ReferenciaFacturaLineaCotizada[]>;

  /**
   * Obtiene la información crediticia y de saldos del cliente.
   */
  obtenerClienteCredito(clienteId: string): Promise<ClienteCreditoInfo | null>;

  /**
   * Valida stock disponible de los productos solicitados.
   */
  obtenerStockProductos(productoIds: string[]): Promise<Map<string, { stockActual: number; precio: number }>>;

  /**
   * Ejecuta atómicamente el plan de operación dentro de una transacción BEGIN ... COMMIT / ROLLBACK.
   */
  ejecutarPlanTransaccional(plan: PlanOperacionFacturacion): Promise<{ ok: boolean; facturaId: string }>;
}
