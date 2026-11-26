/**
 * FERRETERÍA EMMANUEL — SERVICIO DE DOMINIO COMERCIAL DE COTIZACIONES
 * Fase 1.2: Orquestación de reglas de negocio, ciclo de vida, autorización y saldos.
 * 
 * Reutiliza las funciones puras de pure.ts y los contratos de types.ts.
 * No realiza conexiones ni persistencia directa; opera sobre entidades de dominio.
 */

import {
  calcularSaldosCotizacion,
  generarBorradorNuevaVersion,
  redondearCantidad,
  redondearMoneda,
  validarPrecioAutorizado,
  validarSolicitudFacturacionParcial,
} from "./pure";
import {
  ErrorAutorizacionCotizacion,
  ErrorIntegridadCotizacion,
  ErrorTransicionCotizacion,
  type AutorizacionPrecio,
  type CotizacionVersionada,
  type EstadoCotizacionDominio,
  type IAdaptadorAutorizacionServidor,
  type ItemParaCarritoPOS,
  type LineaCotizadaDominio,
  type PreparacionPOSCotizacion,
  type ReferenciaFacturaLineaCotizada,
  type ResultadoValidacionFacturacionParcial,
  type ResultadoValidacionPrecio,
  type ResumenSaldosCotizacion,
  type SesionAutenticadaServidor,
  type SolicitudFacturacionParcial,
} from "./types";

// ============================================================================
// ADAPTADOR DE AUTORIZACIÓN POR DEFECTO (EN MEMORIA / SERVIDOR)
// ============================================================================

export class AdaptadorAutorizacionMemoria implements IAdaptadorAutorizacionServidor {
  constructor(private sesionActiva: SesionAutenticadaServidor | null = null) {}

  obtenerSesion(): SesionAutenticadaServidor | null {
    return this.sesionActiva;
  }

  establecerSesion(sesion: SesionAutenticadaServidor | null): void {
    this.sesionActiva = sesion;
  }

  esPropietario(sesion: SesionAutenticadaServidor | null | undefined): boolean {
    if (!sesion) return false;
    const rol = (sesion.rol || "").trim().toLowerCase();
    return rol === "admin" || rol === "administrador";
  }
}

// ============================================================================
// MATRIZ DE TRANSICIÓN DE ESTADOS VÁLIDA
// ============================================================================

const TRANSICIONES_PERMITIDAS: Record<EstadoCotizacionDominio, ReadonlySet<EstadoCotizacionDominio>> = {
  BORRADOR: new Set(["PENDIENTE_AUTORIZACION", "AUTORIZADA", "EMITIDA", "CANCELADA"]),
  PENDIENTE_AUTORIZACION: new Set(["AUTORIZADA", "RECHAZADA", "CANCELADA"]),
  AUTORIZADA: new Set(["PARCIALMENTE_FACTURADA", "TOTALMENTE_FACTURADA", "SUSTITUIDA", "CANCELADA"]),
  PARCIALMENTE_FACTURADA: new Set(["PARCIALMENTE_FACTURADA", "TOTALMENTE_FACTURADA", "SUSTITUIDA", "CANCELADA"]),
  EMITIDA: new Set(["AUTORIZADA", "PENDIENTE_AUTORIZACION", "FACTURADA", "PARCIALMENTE_FACTURADA", "TOTALMENTE_FACTURADA", "RECHAZADA", "VENCIDA", "CANCELADA"]),
  ENVIADA: new Set(["ACEPTADA", "RECHAZADA", "VENCIDA", "CANCELADA"]),
  ACEPTADA: new Set(["AUTORIZADA", "FACTURADA", "PARCIALMENTE_FACTURADA", "TOTALMENTE_FACTURADA", "CANCELADA"]),
  FACTURADA: new Set([]), // Terminal
  TOTALMENTE_FACTURADA: new Set([]), // Terminal
  SUSTITUIDA: new Set([]), // Terminal
  RECHAZADA: new Set([]), // Terminal
  CANCELADA: new Set([]), // Terminal
  VENCIDA: new Set([]), // Terminal
};

// ============================================================================
// SERVICIO DE DOMINIO: CotizacionesService
// ============================================================================

export class CotizacionesService {
  constructor(
    private readonly adaptadorAuth: IAdaptadorAutorizacionServidor = new AdaptadorAutorizacionMemoria()
  ) {}

  /**
   * Valida si una transición de estado es jurídicamente legal según el ciclo comercial.
   */
  validarTransicionEstado(
    estadoActual: EstadoCotizacionDominio,
    nuevoEstado: EstadoCotizacionDominio
  ): boolean {
    if (estadoActual === nuevoEstado) return true;
    const permitidos = TRANSICIONES_PERMITIDAS[estadoActual];
    return permitidos ? permitidos.has(nuevoEstado) : false;
  }

  /**
   * Prepara una cotización evaluando si sus precios coinciden con el catálogo
   * o si requiere pasar a PENDIENTE_AUTORIZACION.
   */
  prepararParaAutorizacion(
    cotizacion: CotizacionVersionada,
    catalogoPrecios: Map<string, number>,
    sesion: SesionAutenticadaServidor
  ): {
    cotizacion: CotizacionVersionada;
    requiereAutorizacion: boolean;
    itemsNegociados: Array<{
      productoId: string;
      precioCatalogo: number;
      precioSolicitado: number;
    }>;
  } {
    const copia = structuredClone(cotizacion);
    const itemsNegociados: Array<{
      productoId: string;
      precioCatalogo: number;
      precioSolicitado: number;
    }> = [];

    for (const it of copia.items) {
      const precioOficial = catalogoPrecios.get(it.productoId) ?? it.precio;
      if (redondearMoneda(it.precio) !== redondearMoneda(precioOficial)) {
        itemsNegociados.push({
          productoId: it.productoId,
          precioCatalogo: precioOficial,
          precioSolicitado: it.precio,
        });
      }
    }

    const requiereAutorizacion = itemsNegociados.length > 0;
    const esDuenio = this.adaptadorAuth.esPropietario(sesion);

    if (requiereAutorizacion) {
      copia.estado = esDuenio ? "AUTORIZADA" : "PENDIENTE_AUTORIZACION";
      if (esDuenio) {
        copia.autorizadaPor = sesion.id;
        copia.autorizadaEn = new Date().toISOString();
      }
    } else {
      copia.estado = "AUTORIZADA";
      copia.autorizadaPor = esDuenio ? sesion.id : "SISTEMA_CATALOGO";
      copia.autorizadaEn = new Date().toISOString();
    }

    return {
      cotizacion: copia,
      requiereAutorizacion,
      itemsNegociados,
    };
  }

  /**
   * Autoriza formalmente una cotización con verificación server-side exclusiva para propietarios.
   */
  autorizarCotizacion(
    cotizacion: CotizacionVersionada,
    sesion: SesionAutenticadaServidor,
    motivo?: string
  ): CotizacionVersionada {
    if (!this.adaptadorAuth.esPropietario(sesion)) {
      throw new ErrorAutorizacionCotizacion(
        `Acceso denegado: el usuario '${sesion.usuario}' con rol '${sesion.rol}' no tiene privilegios de propietario (admin) para autorizar cotizaciones o precios especiales.`
      );
    }

    if (!cotizacion.esVersionActual) {
      throw new ErrorTransicionCotizacion(
        `Operación denegada: no se puede autorizar una cotización sustituida o inactiva (v${cotizacion.version}).`
      );
    }

    if (
      cotizacion.estado === "SUSTITUIDA" ||
      cotizacion.estado === "CANCELADA" ||
      cotizacion.estado === "TOTALMENTE_FACTURADA" ||
      cotizacion.estado === "RECHAZADA"
    ) {
      throw new ErrorTransicionCotizacion(
        `No se puede autorizar una cotización en estado terminal '${cotizacion.estado}'.`
      );
    }

    const copia = structuredClone(cotizacion);
    copia.estado = "AUTORIZADA";
    copia.autorizadaPor = sesion.id;
    copia.autorizadaEn = new Date().toISOString();
    if (motivo) {
      copia.notas = copia.notas ? `${copia.notas} [Autorizado: ${motivo}]` : `[Autorizado: ${motivo}]`;
    }

    return copia;
  }

  /**
   * Valida una lista de precios negociados contra el catálogo y autorizaciones otorgadas.
   */
  validarPreciosNegociados(
    cotizacion: CotizacionVersionada,
    catalogoPrecios: Map<string, number>,
    autorizaciones: AutorizacionPrecio[]
  ): {
    todosValidos: boolean;
    resultados: ResultadoValidacionPrecio[];
  } {
    const resultados: ResultadoValidacionPrecio[] = [];
    let todosValidos = true;

    for (const it of cotizacion.items) {
      const precioCatalogo = catalogoPrecios.get(it.productoId) ?? it.precio;
      const auth = autorizaciones.find((a) => a.productoId === it.productoId);
      const res = validarPrecioAutorizado(
        { productoId: it.productoId, precioSolicitado: it.precio },
        precioCatalogo,
        auth
      );

      resultados.push(res);
      if (!res.valido) {
        todosValidos = false;
      }
    }

    return { todosValidos, resultados };
  }

  /**
   * Calcula los saldos consolidados de una cotización contra su historial de facturación.
   */
  calcularSaldos(
    cotizacion: CotizacionVersionada,
    historialFacturas: ReferenciaFacturaLineaCotizada[],
    opciones?: { tasaIva?: number }
  ): ResumenSaldosCotizacion {
    return calcularSaldosCotizacion(cotizacion, historialFacturas, opciones?.tasaIva);
  }

  /**
   * Valida una solicitud de facturación parcial asegurando que no exceda saldos ni duplique líneas.
   */
  validarSolicitudFacturacion(
    cotizacion: CotizacionVersionada,
    historialFacturas: ReferenciaFacturaLineaCotizada[],
    solicitud: SolicitudFacturacionParcial,
    opciones?: { tasaIva?: number }
  ): ResultadoValidacionFacturacionParcial {
    const resumenSaldos = this.calcularSaldos(cotizacion, historialFacturas, opciones);
    return validarSolicitudFacturacionParcial(cotizacion, resumenSaldos, solicitud, opciones);
  }

  /**
   * Prepara el paquete de datos para consumo directo en el Punto de Venta (POS / Caja).
   */
  prepararDatosParaPOS(
    cotizacion: CotizacionVersionada,
    historialFacturas: ReferenciaFacturaLineaCotizada[]
  ): PreparacionPOSCotizacion {
    if (!cotizacion.esVersionActual) {
      return {
        cotizacionId: cotizacion.id,
        cotizacionNumero: cotizacion.numero,
        version: cotizacion.version,
        clienteId: cotizacion.clienteId,
        clienteNombre: cotizacion.cliente,
        esFacturable: false,
        motivoNoFacturable: `La versión ${cotizacion.version} se encuentra sustituida o inactiva. Solo la versión vigente puede cargarse en Caja.`,
        itemsParaCarrito: [],
        subtotalPendiente: 0,
        totalPendiente: 0,
      };
    }

    const estadosFacturables = ["AUTORIZADA", "PARCIALMENTE_FACTURADA", "EMITIDA", "ACEPTADA"];
    if (!estadosFacturables.includes(cotizacion.estado)) {
      return {
        cotizacionId: cotizacion.id,
        cotizacionNumero: cotizacion.numero,
        version: cotizacion.version,
        clienteId: cotizacion.clienteId,
        clienteNombre: cotizacion.cliente,
        esFacturable: false,
        motivoNoFacturable: `La cotización se encuentra en estado '${cotizacion.estado}'. Requiere aprobación de los dueños antes de facturarse.`,
        itemsParaCarrito: [],
        subtotalPendiente: 0,
        totalPendiente: 0,
      };
    }

    const saldos = this.calcularSaldos(cotizacion, historialFacturas);

    if (saldos.estaTotalmenteFacturada || !saldos.tieneSaldosPendientes) {
      return {
        cotizacionId: cotizacion.id,
        cotizacionNumero: cotizacion.numero,
        version: cotizacion.version,
        clienteId: cotizacion.clienteId,
        clienteNombre: cotizacion.cliente,
        esFacturable: false,
        motivoNoFacturable: "La cotización ya ha sido totalmente facturada. No posee saldos pendientes.",
        itemsParaCarrito: [],
        subtotalPendiente: 0,
        totalPendiente: 0,
      };
    }

    const itemsParaCarrito: ItemParaCarritoPOS[] = saldos.items
      .filter((it) => it.cantidadPendiente > 0)
      .map((it) => ({
        cotizacionItemId: it.id,
        productoId: it.productoId,
        cantidadSugerida: it.cantidadPendiente,
        cantidadMaximaPermitida: it.cantidadPendiente,
        precioUnitarioBloqueado: it.precio,
        descuentoUnitario: it.descuento || 0,
        unidadMedida: it.unidadMedida,
        exentoIva: !!it.exentoIva,
        observacion: it.observacion || "",
      }));

    return {
      cotizacionId: cotizacion.id,
      cotizacionNumero: cotizacion.numero,
      version: cotizacion.version,
      clienteId: cotizacion.clienteId,
      clienteNombre: cotizacion.cliente,
      esFacturable: true,
      itemsParaCarrito,
      subtotalPendiente: saldos.subtotalPendiente,
      totalPendiente: saldos.totalPendiente,
    };
  }

  /**
   * Prepara una nueva versión inmutable V(N+1).
   * Exige que quien solicita o aprueba sea dueño, garantiza que los IDs de líneas sean únicos
   * y que no se reutilicen líneas viejas ni se alteren objetos históricos.
   */
  prepararNuevaVersionInmutable(
    versionActual: CotizacionVersionada,
    historialFacturas: ReferenciaFacturaLineaCotizada[],
    input: {
      nuevosItemsPendientes: Array<{
        id: string;
        productoId: string;
        cantidad: number;
        precio: number;
        unidadMedida: LineaCotizadaDominio["unidadMedida"];
        costoUnitario?: number;
        descuento?: number;
        exentoIva?: boolean;
        observacion?: string;
      }>;
      sesion: SesionAutenticadaServidor;
      motivo: string;
      nuevoId: string;
      nuevoNumero: string;
      fecha: string;
    }
  ): {
    versionActualSustituida: CotizacionVersionada;
    nuevaVersion: CotizacionVersionada;
  } {
    if (!this.adaptadorAuth.esPropietario(input.sesion)) {
      throw new ErrorAutorizacionCotizacion(
        `Solo los propietarios (admin) pueden crear o versionar cotizaciones negociadas. Usuario: '${input.sesion.usuario}'.`
      );
    }

    if (!versionActual.esVersionActual) {
      throw new ErrorTransicionCotizacion(
        `Operación denegada: no se puede versionar la versión ${versionActual.version} porque ya ha sido sustituida.`
      );
    }

    if (
      versionActual.estado === "SUSTITUIDA" ||
      versionActual.estado === "CANCELADA" ||
      versionActual.estado === "RECHAZADA"
    ) {
      throw new ErrorTransicionCotizacion(
        `No se puede generar una nueva versión de una cotización en estado '${versionActual.estado}'.`
      );
    }

    const saldos = this.calcularSaldos(versionActual, historialFacturas);

    return generarBorradorNuevaVersion(versionActual, saldos, {
      nuevoId: input.nuevoId,
      nuevoNumero: input.nuevoNumero,
      fecha: input.fecha,
      usuario: input.sesion.usuario,
      motivo: input.motivo,
      nuevosItemsPendientes: input.nuevosItemsPendientes,
    });
  }
}
