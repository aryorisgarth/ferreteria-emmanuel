/**
 * FERRETERÍA EMMANUEL — ORQUESTADOR COMERCIAL: FacturacionCotizacionService
 * Fase 1.4: Orquestación integrada de Cotizaciones, Facturación Parcial, Pagos e Inventario.
 * 
 * Responsabilidades:
 * 1. Validar versión activa y estado de la cotización.
 * 2. Calcular y respetar saldos pendientes de líneas cotizadas.
 * 3. Proteger precios autorizados sin permitir manipulación externa.
 * 4. Articular el medio de cobro (EFECTIVO, TRANSFERENCIA o CREDITO).
 * 5. Preparar un plan de operación integral, atómico e idempotente.
 * 6. Operar en memoria sin ejecutar escrituras reales en PostgreSQL ni JSON.
 */

import { CotizacionesService } from "@/lib/domain/cotizaciones/service";
import {
  ErrorDominioCotizacion,
  ErrorIntegridadCotizacion,
  ErrorTransicionCotizacion,
  type CotizacionVersionada,
  type LineaCotizadaDominio,
  type ReferenciaFacturaLineaCotizada,
  type SesionAutenticadaServidor,
} from "@/lib/domain/cotizaciones/types";
import { PagosCarteraService } from "@/lib/domain/pagos/service";
import {
  ErrorIdempotenciaPago,
  type ClienteCreditoInfo,
  type TransferenciaBancaria,
} from "@/lib/domain/pagos/types";
import type {
  IAlmacenIdempotencia,
  IRepositorioComercialTransaccional,
  LineaFacturaPreparada,
  MovimientoKardexPreparado,
  PlanOperacionFacturacion,
  RegistroIdempotenciaItem,
  SolicitudFacturacionCotizacion,
} from "./types";

// ============================================================================
// ALMACÉN DE IDEMPOTENCIA EN MEMORIA CON DETECCIÓN DE CONFLICTOS
// ============================================================================

export class AlmacenIdempotenciaMemoria implements IAlmacenIdempotencia {
  private items = new Map<string, RegistroIdempotenciaItem>();

  obtener(key: string): RegistroIdempotenciaItem | null {
    return this.items.get(key) || null;
  }

  guardar(item: RegistroIdempotenciaItem): void {
    this.items.set(item.idempotencyKey, item);
  }

  limpiar(): void {
    this.items.clear();
  }
}

/**
 * Calcula una firma hash canónica del payload para detectar reintentos idénticos vs colisiones.
 */
function calcularHashPayload(solicitud: SolicitudFacturacionCotizacion): string {
  const itemsOrdenados = [...solicitud.items]
    .sort((a, b) => a.cotizacionItemId.localeCompare(b.cotizacionItemId))
    .map((it) => `${it.cotizacionItemId}:${it.cantidadAFacturar}`);

  return JSON.stringify({
    cotizacionId: solicitud.cotizacionId,
    clienteId: solicitud.clienteId,
    formaPago: solicitud.formaPago,
    items: itemsOrdenados,
    montoTransferencia: solicitud.pagoData.transferenciaInput?.monto,
    referencia: solicitud.pagoData.transferenciaInput?.referenciaBancaria,
  });
}

// ============================================================================
// ORQUESTADOR COMERCIAL: FacturacionCotizacionService
// ============================================================================

export class FacturacionCotizacionService {
  constructor(
    private readonly cotizacionesService: CotizacionesService,
    private readonly pagosService: PagosCarteraService,
    private readonly almacenIdempotencia: IAlmacenIdempotencia,
    private readonly repositorio: IRepositorioComercialTransaccional
  ) {}

  /**
   * Orquesta y prepara el plan atómico de facturación parcial de una cotización.
   * No aplica cambios directos a base de datos en esta fase; devuelve un plan tipado y validado.
   */
  async prepararPlanFacturacion(
    solicitud: SolicitudFacturacionCotizacion,
    sesion: SesionAutenticadaServidor,
    opciones?: { tasaIva?: number; prefijoFactura?: string }
  ): Promise<PlanOperacionFacturacion> {
    const key = (solicitud.idempotencyKey || "").trim();
    if (!key) {
      throw new ErrorIdempotenciaPago(
        "Se requiere una clave de idempotencia obligatoria para procesar la facturación."
      );
    }

    const hashActual = calcularHashPayload(solicitud);

    // 1. Control de Idempotencia y Reintentos
    const registroExistente = await this.almacenIdempotencia.obtener(key);
    if (registroExistente) {
      if (registroExistente.hashPayload === hashActual) {
        // Reintento idéntico legítimo: retorna el plan original ya preparado
        return registroExistente.plan;
      }
      // Mismo key con payload distinto: colisión grave detectada
      throw new ErrorIdempotenciaPago(
        `CLAVE_IDEMPOTENCIA_CONFLICTO: La clave '${key}' ya fue utilizada anteriormente con datos, cliente o importes diferentes.`
      );
    }

    // 2. Cargar cotización y validar versión vigente
    const cotizacion = await this.repositorio.obtenerCotizacionVersionada(solicitud.cotizacionId);
    if (!cotizacion) {
      throw new ErrorDominioCotizacion(`La cotización con ID '${solicitud.cotizacionId}' no fue encontrada.`);
    }

    if (!cotizacion.esVersionActual) {
      throw new ErrorTransicionCotizacion(
        `Operación denegada: no se puede facturar desde la versión ${cotizacion.version} porque ha sido sustituida por una versión más reciente.`
      );
    }

    // 3. Cargar historial facturado de las líneas
    const historialLineas = await this.repositorio.obtenerHistorialFacturacionLineas(cotizacion.id);

    // 4. Validar facturación parcial contra saldos y versión mediante CotizacionesService
    const solParcial = {
      cotizacionId: cotizacion.id,
      clienteId: solicitud.clienteId,
      usuario: sesion.usuario,
      fecha: solicitud.fecha,
      items: solicitud.items,
      idempotencyKey: key,
    };

    const valCotizacion = this.cotizacionesService.validarSolicitudFacturacion(
      cotizacion,
      historialLineas,
      solParcial,
      opciones
    );

    if (!valCotizacion.valida) {
      throw new ErrorIntegridadCotizacion(
        `Validación de cotización fallida: ${(valCotizacion.errores || []).join("; ")}`
      );
    }

    // 5. Validar existencia y stock de productos en catálogo
    const prodIds = valCotizacion.itemsValidados.map((it) => it.productoId);
    const stockMap = await this.repositorio.obtenerStockProductos(prodIds);

    for (const it of valCotizacion.itemsValidados) {
      const prodInfo = stockMap.get(it.productoId);
      if (!prodInfo) {
        throw new ErrorIntegridadCotizacion(`El producto '${it.productoId}' no existe en el catálogo de inventario.`);
      }
      if (prodInfo.stockActual < it.cantidadSolicitada) {
        throw new ErrorIntegridadCotizacion(
          `Stock insuficiente en bodega para el producto '${it.productoId}'. Disponible: ${prodInfo.stockActual}, Solicitado: ${it.cantidadSolicitada}.`
        );
      }
    }

    // 6. Preparar líneas de factura congelando los precios cotizados autorizados
    const facturaId = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const prefijo = opciones?.prefijoFactura || "FAC";
    const facturaNumero = `${prefijo}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const lineasPreparadas: LineaFacturaPreparada[] = valCotizacion.itemsValidados.map((it) => {
      const itemCot = cotizacion.items.find((c) => c.id === it.cotizacionItemId)!;
      return {
        id: `fitm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cotizacionItemId: it.cotizacionItemId,
        productoId: it.productoId,
        cantidad: it.cantidadSolicitada,
        precioUnitario: it.precioUnitario,
        descuentoUnitario: it.descuentoUnitario,
        unidadMedida: itemCot.unidadMedida,
        exentoIva: it.exentoIva,
        subtotal: it.subtotal,
        iva: it.iva,
        total: it.total,
        observacion: itemCot.observacion || "",
      };
    });

    // 7. Preparar movimientos físicos de Kárdex
    const movimientosKardex: MovimientoKardexPreparado[] = lineasPreparadas.map((linea) => ({
      productoId: linea.productoId,
      tipo: "SALIDA",
      motivo: "VENTA_FACTURA",
      cantidad: linea.cantidad,
      referenciaFacturaId: facturaId,
      usuario: sesion.usuario,
    }));

    // 8. Articular medio de cobro mediante PagosCarteraService
    let movimientoCaja: PlanOperacionFacturacion["movimientoCaja"] = undefined;
    let ajusteCartera: PlanOperacionFacturacion["ajusteCartera"] = undefined;
    let transferencia: TransferenciaBancaria | undefined = undefined;
    let estadoFactura: PlanOperacionFacturacion["estadoFactura"] = "EMITIDA";
    let estadoOperacion: PlanOperacionFacturacion["estadoOperacion"] = "CONFIRMADA";

    if (solicitud.formaPago === "EFECTIVO") {
      const prepEfectivo = this.pagosService.prepararVentaEfectivo({
        facturaId,
        total: valCotizacion.total,
        turnoCajaId: solicitud.pagoData.turnoCajaId,
        usuario: sesion.usuario,
      });
      movimientoCaja = prepEfectivo.movimientoCaja;
      estadoFactura = "PAGADA";
      estadoOperacion = "CONFIRMADA";
    } else if (solicitud.formaPago === "CREDITO") {
      const clienteInfo = await this.repositorio.obtenerClienteCredito(solicitud.clienteId);
      if (!clienteInfo) {
        throw new ErrorDominioCotizacion(`Cliente con ID '${solicitud.clienteId}' no encontrado para venta a crédito.`);
      }

      const prepCredito = this.pagosService.prepararVentaCredito({
        facturaId,
        total: valCotizacion.total,
        cliente: clienteInfo,
        autorizacion: solicitud.pagoData.autorizacionCredito,
        sesion,
        motivo: `Crédito autorizado para Factura Parcial de Cotización ${cotizacion.numero}`,
      });

      ajusteCartera = {
        clienteId: prepCredito.clienteId,
        saldoClientePrevio: prepCredito.saldoClientePrevio,
        saldoClienteNuevo: prepCredito.saldoClienteNuevo,
        saldoFacturaPendiente: prepCredito.saldoFacturaPendiente,
        autorizacion: prepCredito.autorizacion,
      };
      estadoFactura = "EMITIDA";
      estadoOperacion = "CONFIRMADA";
    } else if (solicitud.formaPago === "TRANSFERENCIA") {
      if (!solicitud.pagoData.transferenciaInput) {
        throw new ErrorIntegridadCotizacion(
          "Para pagos por transferencia se requiere la referencia bancaria y comprobante."
        );
      }

      const prepTransferencia = this.pagosService.prepararVentaTransferencia({
        facturaId,
        total: valCotizacion.total,
        transferenciaInput: solicitud.pagoData.transferenciaInput,
        usuario: sesion.usuario,
      });

      transferencia = prepTransferencia.transferencia;
      estadoFactura = "EMITIDA";
      estadoOperacion = "PENDIENTE_VERIFICACION_TRANSFERENCIA";
    } else {
      throw new ErrorDominioCotizacion(
        `Método de pago no autorizado '${solicitud.formaPago}'. Solo se permite EFECTIVO, TRANSFERENCIA o CREDITO.`
      );
    }

    // 9. Actualización de estado de la cotización
    const nuevoEstadoCotizacion: CotizacionVersionada["estado"] = valCotizacion.todosSaldosLiquidados
      ? "TOTALMENTE_FACTURADA"
      : "PARCIALMENTE_FACTURADA";

    const plan: PlanOperacionFacturacion = {
      facturaId,
      facturaNumero,
      cotizacionId: cotizacion.id,
      cotizacionVersion: cotizacion.version,
      clienteId: solicitud.clienteId,
      clienteNombre: solicitud.clienteNombre,
      fecha: solicitud.fecha,
      formaPago: solicitud.formaPago,
      estadoFactura,
      estadoOperacion,
      lineas: lineasPreparadas,
      subtotal: valCotizacion.subtotal,
      descuento: valCotizacion.descuento,
      iva: valCotizacion.iva,
      total: valCotizacion.total,
      movimientosKardex,
      movimientoCaja,
      ajusteCartera,
      transferencia,
      actualizacionCotizacion: {
        cotizacionId: cotizacion.id,
        nuevoEstado: nuevoEstadoCotizacion,
        todosSaldosLiquidados: valCotizacion.todosSaldosLiquidados,
      },
      idempotencyKey: key,
      creadoPor: sesion.usuario,
      creadoEn: new Date().toISOString(),
    };

    // Guardar en almacén de idempotencia
    await this.almacenIdempotencia.guardar({
      idempotencyKey: key,
      hashPayload: hashActual,
      plan,
      registradoEn: new Date().toISOString(),
    });

    return plan;
  }
}

// ============================================================================
// ADAPTADOR DE REPOSITORIO SIMULADO EN MEMORIA (PARA PRUEBAS PURAS)
// ============================================================================

export class AdaptadorRepositorioSimulado implements IRepositorioComercialTransaccional {
  public cotizaciones = new Map<string, CotizacionVersionada>();
  public historialFacturas = new Map<string, ReferenciaFacturaLineaCotizada[]>();
  public clientes = new Map<string, ClienteCreditoInfo>();
  public inventario = new Map<string, { stockActual: number; precio: number }>();
  public facturasGuardadas = new Map<string, PlanOperacionFacturacion>();
  public simularErrorAlEjecutar = false;

  async obtenerCotizacionVersionada(cotizacionId: string): Promise<CotizacionVersionada | null> {
    return this.cotizaciones.get(cotizacionId) || null;
  }

  async obtenerHistorialFacturacionLineas(cotizacionId: string): Promise<ReferenciaFacturaLineaCotizada[]> {
    return this.historialFacturas.get(cotizacionId) || [];
  }

  async obtenerClienteCredito(clienteId: string): Promise<ClienteCreditoInfo | null> {
    return this.clientes.get(clienteId) || null;
  }

  async obtenerStockProductos(productoIds: string[]): Promise<Map<string, { stockActual: number; precio: number }>> {
    const res = new Map<string, { stockActual: number; precio: number }>();
    for (const id of productoIds) {
      const item = this.inventario.get(id);
      if (item) res.set(id, { ...item });
    }
    return res;
  }

  async ejecutarPlanTransaccional(plan: PlanOperacionFacturacion): Promise<{ ok: boolean; facturaId: string }> {
    if (this.simularErrorAlEjecutar) {
      throw new Error("ERROR_SIMULADO_TRANSACCION: Falló inserción en base de datos. Se aplica ROLLBACK total.");
    }

    // Aplicar simulación atómica
    this.facturasGuardadas.set(plan.facturaId, structuredClone(plan));

    // Descontar inventario simulado
    for (const mov of plan.movimientosKardex) {
      const item = this.inventario.get(mov.productoId);
      if (item) {
        item.stockActual -= mov.cantidad;
      }
    }

    // Actualizar cotización simulada
    const cot = this.cotizaciones.get(plan.cotizacionId);
    if (cot) {
      cot.estado = plan.actualizacionCotizacion.nuevoEstado;
    }

    // Actualizar historial simulado
    const hist = this.historialFacturas.get(plan.cotizacionId) || [];
    for (const lin of plan.lineas) {
      hist.push({
        facturaId: plan.facturaId,
        facturaNumero: plan.facturaNumero,
        facturaEstado: plan.estadoFactura,
        cotizacionId: plan.cotizacionId,
        cotizacionItemId: lin.cotizacionItemId,
        productoId: lin.productoId,
        cantidadFacturada: lin.cantidad,
        precioUnitario: lin.precioUnitario,
        fechaFactura: plan.fecha,
      });
    }
    this.historialFacturas.set(plan.cotizacionId, hist);

    // Actualizar crédito cliente simulado
    if (plan.ajusteCartera) {
      const cli = this.clientes.get(plan.ajusteCartera.clienteId);
      if (cli) {
        cli.saldoPendiente = plan.ajusteCartera.saldoClienteNuevo;
      }
    }

    return { ok: true, facturaId: plan.facturaId };
  }
}
