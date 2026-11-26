import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput } from "./types";
import {
  validarIdempotenciaFactura,
  validarYBloquearCotizacion,
  bloquearYValidarStock,
  validarTurnoCaja,
  validarCreditoCliente,
  CotizacionBloqueada,
} from "./invoicing-validation";
import { generarNumeroFactura, calcularTotalesFactura } from "./invoicing-calculations";
import { registrarLineasEInventario } from "./invoicing-inventory-kardex";
import { registrarCobroCaja, registrarFacturaCobros } from "./invoicing-payments";
import { actualizarCotizacionFacturada, registrarOperacionTransferencia } from "./invoicing-quotes-trace";

export class PostgresInvoicingService {
  constructor(
    private executor: SqlExecutor,
    private obtenerCotizacion?: (id: string) => Promise<any>
  ) {}

  async emitirFactura(input: EmitirFacturaInput): Promise<string> {
    const idExistente = await validarIdempotenciaFactura(this.executor, input.claveIdempotencia);
    if (idExistente) return idExistente;

    if (!input.items || input.items.length === 0) {
      throw new Error("No se puede emitir una factura sin artículos");
    }

    let cotBloqueada: CotizacionBloqueada | null = null;
    if (input.cotizacionId) {
      cotBloqueada = await validarYBloquearCotizacion(this.executor, input.cotizacionId, input.items);
    }

    const productMap = await bloquearYValidarStock(this.executor, input.items);
    const turnoId = await validarTurnoCaja(this.executor, input);
    const totales = calcularTotalesFactura(input, productMap);

    if ((input.formaPago || "EFECTIVO") === "CREDITO") {
      await validarCreditoCliente(this.executor, input.clienteId, totales.totalFactura);
    }

    const numeroFactura = await generarNumeroFactura(this.executor);
    const facturaId = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fecha = input.fecha || new Date().toISOString();

    await this.executor.query(
      `INSERT INTO facturas (
        id, numero, cliente, cliente_id, fecha, cotizacion_id, notas, creado_por,
        estado, stock_aplicado, forma_pago, origen, descuento, subtotal, iva, total,
        costo_total_venta, monto_recibido, cambio, anulada, clave_idempotencia, turno_caja_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, false, $20, $21
      )`,
      [
        facturaId,
        numeroFactura,
        input.cliente.trim(),
        input.clienteId || null,
        fecha,
        input.cotizacionId || null,
        input.notas || "",
        input.creadoPor,
        totales.estadoInicialFactura,
        totales.stockAplicado,
        input.formaPago || "EFECTIVO",
        input.origen || "DIRECTA",
        totales.totalDescuento,
        totales.subtotal,
        totales.totalIva,
        totales.totalFactura,
        totales.costoTotalVenta,
        totales.montoRecibidoRegistrado,
        totales.cambioRegistrado,
        input.claveIdempotencia || null,
        turnoId,
      ]
    );

    await registrarLineasEInventario(this.executor, facturaId, numeroFactura, fecha, input, productMap, totales.stockAplicado);
    await registrarCobroCaja(this.executor, turnoId, input.formaPago || "EFECTIVO", numeroFactura, fecha, input.creadoPor, totales.montoEfectivoCobro);
    await registrarFacturaCobros(this.executor, facturaId, input, totales, turnoId, numeroFactura);

    if (input.cotizacionId && totales.stockAplicado) {
      await actualizarCotizacionFacturada(this.executor, input.cotizacionId, facturaId, input.items, cotBloqueada);
    }

    await registrarOperacionTransferencia(this.executor, facturaId, numeroFactura, input, totales);

    return facturaId;
  }

  async convertirCotizacionAVenta(
    inputOId: any,
    creadoPor?: string,
    origen: any = "COTIZACION",
    formaPago: any = "EFECTIVO"
  ): Promise<string> {
    let id: string;
    let autor: string;
    let orig = origen;
    let pago = formaPago;

    if (typeof inputOId === "object" && inputOId !== null) {
      id = inputOId.cotizacionId || inputOId.id;
      autor = inputOId.creadoPor;
      orig = inputOId.origen || orig;
      pago = inputOId.formaPago || pago;
    } else {
      id = inputOId;
      autor = creadoPor || "admin";
    }

    if (!this.obtenerCotizacion) {
      throw new Error("Servicio de cotizaciones no configurado en conversión.");
    }

    const c = await this.obtenerCotizacion(id);
    if (!c) throw new Error("Cotización no encontrada.");
    if (c.estado === "FACTURADA") throw new Error("La cotización ya fue facturada.");
    if (c.esVersionActual === false) {
      throw new Error("No se puede facturar una versión inactiva o sustituida de la cotización.");
    }

    return await this.emitirFactura({
      cliente: c.cliente,
      clienteId: c.clienteId,
      cotizacionId: c.id,
      creadoPor: autor,
      origen: orig,
      formaPago: pago,
      items: c.items.map((it: any) => ({
        productoId: it.productoId,
        cantidad: it.cantidadPendiente !== undefined ? it.cantidadPendiente : it.cantidad,
        precio: it.precio,
        descuento: it.descuento,
        exentoIva: it.exentoIva,
        observacion: it.observacion,
        cotizacionItemId: it.id,
      })),
    });
  }
}
