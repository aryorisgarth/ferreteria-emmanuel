/**
 * FERRETERÍA EMMANUEL — FUNCIONES PURAS DE DOMINIO COMERCIAL
 * Fase 1.2: Cálculos matemáticos, control de versiones, saldos, integridad y validaciones.
 * 
 * Todas las funciones aquí contenidas son puras:
 * - Deterministas (mismos argumentos -> mismo resultado).
 * - Cero efectos secundarios (inmutabilidad estricta de objetos de entrada).
 * - Sin conexiones de red, filesystem o base de datos.
 */

import { r2, r3 } from "@/lib/format";
import type {
  AutorizacionPrecio,
  CotizacionVersionada,
  ItemFacturacionParcialValidado,
  LineaCotizadaDominio,
  LineaCotizadaSaldo,
  ResultadoValidacionFacturacionParcial,
  ResultadoValidacionPrecio,
  ResumenSaldosCotizacion,
  SolicitudFacturacionParcial,
} from "./types";

// ============================================================================
// 1. UTILIDADES DE REDONDEO Y PRECISIÓN
// ============================================================================

/**
 * Redondeo monetario estándar coherente con el motor contable existente (2 decimales).
 */
export function redondearMoneda(valor: number): number {
  return r2(valor);
}

/**
 * Redondeo de cantidades para evitar imprecisiones de coma flotante (4 decimales).
 */
export function redondearCantidad(valor: number, decimales = 4): number {
  const factor = Math.pow(10, decimales);
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

// ============================================================================
// 2. CÁLCULO DE SALDOS POR LÍNEA Y POR COTIZACIÓN CON CONTROL DE INTEGRIDAD
// ============================================================================

/**
 * Calcula el saldo de una línea cotizada contra el historial de facturas.
 * REGLAS:
 * 1. Anulaciones y devoluciones NO reabren cantidades cotizadas.
 * 2. Toda línea de factura emitida contra la cotización se considera cantidad consumida.
 * 3. NO utilizar Math.max(0, ...) para encubrir sobrefacturación; se detecta y reporta la anomalía.
 */
export function calcularSaldosLinea(
  item: LineaCotizadaDominio,
  historialFacturas: Array<{
    cotizacionItemId: string;
    cantidadFacturada: number;
  }>
): LineaCotizadaSaldo {
  const lineasFacturadas = historialFacturas.filter(
    (h) => h.cotizacionItemId === item.id
  );

  const cantidadFacturadaBruta = lineasFacturadas.reduce(
    (acc, curr) => acc + (Number(curr.cantidadFacturada) || 0),
    0
  );

  const cantidadFacturada = redondearCantidad(cantidadFacturadaBruta);
  const cantidadCotizada = redondearCantidad(item.cantidad);

  // Detección explícita de sobrefacturación histórica (integridad)
  const haSidoSobrefacturada = cantidadFacturada > cantidadCotizada;
  const excesoFacturado = haSidoSobrefacturada
    ? redondearCantidad(cantidadFacturada - cantidadCotizada)
    : 0;

  // El saldo pendiente legítimo no puede ser menor a 0, pero la sobrefacturación queda registrada
  const cantidadPendiente = haSidoSobrefacturada
    ? 0
    : redondearCantidad(cantidadCotizada - cantidadFacturada);

  const precioUnitario = Number(item.precio) || 0;
  const descuento = Number(item.descuento) || 0;
  const precioEfectivo = Math.max(0, precioUnitario - descuento);

  const subtotalLineaOriginal = redondearMoneda(cantidadCotizada * precioEfectivo);
  const subtotalLineaFacturado = redondearMoneda(
    cantidadFacturada * precioEfectivo
  );
  const subtotalLineaPendiente = redondearMoneda(
    cantidadPendiente * precioEfectivo
  );

  return {
    ...item,
    cantidad: cantidadCotizada,
    precio: precioUnitario,
    descuento,
    cantidadFacturada,
    cantidadPendiente,
    subtotalLineaOriginal,
    subtotalLineaFacturado,
    subtotalLineaPendiente,
    estaCompletamenteFacturada: cantidadPendiente <= 0,
    haSidoSobrefacturada,
    excesoFacturado,
  };
}

/**
 * Genera el resumen global de saldos de una cotización versionada con validación de anomalías.
 */
export function calcularSaldosCotizacion(
  cotizacion: CotizacionVersionada,
  historialFacturas: Array<{
    cotizacionItemId: string;
    cantidadFacturada: number;
  }>,
  tasaIva = 0.15
): ResumenSaldosCotizacion {
  const itemsConSaldo = cotizacion.items.map((item) =>
    calcularSaldosLinea(item, historialFacturas)
  );

  const inconsistencias: string[] = [];
  for (const it of itemsConSaldo) {
    if (it.haSidoSobrefacturada) {
      inconsistencias.push(
        `Anomalía de integridad en ítem '${it.id}' (${it.productoId}): la cantidad facturada (${it.cantidadFacturada}) excede la cotizada (${it.cantidad}) por ${it.excesoFacturado}.`
      );
    }
  }

  const subtotalOriginal = redondearMoneda(
    itemsConSaldo.reduce((acc, it) => acc + it.subtotalLineaOriginal, 0)
  );

  const subtotalFacturado = redondearMoneda(
    itemsConSaldo.reduce((acc, it) => acc + it.subtotalLineaFacturado, 0)
  );

  const subtotalPendiente = redondearMoneda(
    itemsConSaldo.reduce((acc, it) => acc + it.subtotalLineaPendiente, 0)
  );

  const ivaOriginal = redondearMoneda(
    itemsConSaldo
      .filter((it) => !it.exentoIva)
      .reduce((acc, it) => acc + it.subtotalLineaOriginal * tasaIva, 0)
  );

  const ivaFacturado = redondearMoneda(
    itemsConSaldo
      .filter((it) => !it.exentoIva)
      .reduce((acc, it) => acc + it.subtotalLineaFacturado * tasaIva, 0)
  );

  const ivaPendiente = redondearMoneda(
    itemsConSaldo
      .filter((it) => !it.exentoIva)
      .reduce((acc, it) => acc + it.subtotalLineaPendiente * tasaIva, 0)
  );

  const totalOriginal = redondearMoneda(subtotalOriginal + ivaOriginal);
  const totalFacturado = redondearMoneda(subtotalFacturado + ivaFacturado);
  const totalPendiente = redondearMoneda(subtotalPendiente + ivaPendiente);

  const todosCompletos =
    itemsConSaldo.length > 0 &&
    itemsConSaldo.every((it) => it.estaCompletamenteFacturada);
  const algunoFacturado = itemsConSaldo.some((it) => it.cantidadFacturada > 0);

  return {
    cotizacionId: cotizacion.id,
    cotizacionNumero: cotizacion.numero,
    version: cotizacion.version,
    esVersionActual: cotizacion.esVersionActual,
    estado: cotizacion.estado,
    items: itemsConSaldo,
    subtotalOriginal,
    subtotalFacturado,
    subtotalPendiente,
    totalOriginal,
    totalFacturado,
    totalPendiente,
    estaTotalmenteFacturada: todosCompletos,
    estaParcialmenteFacturada: algunoFacturado && !todosCompletos,
    tieneSaldosPendientes: !todosCompletos,
    tieneInconsistencias: inconsistencias.length > 0,
    inconsistencias: inconsistencias.length > 0 ? inconsistencias : undefined,
  };
}

// ============================================================================
// 3. VALIDACIÓN DE FACTURACIÓN PARCIAL
// ============================================================================

/**
 * Valida de forma pura una solicitud de facturación parcial contra el saldo disponible.
 * Incluye detección de sobrefacturación previa, líneas duplicadas y cantidades inválidas.
 */
export function validarSolicitudFacturacionParcial(
  cotizacion: CotizacionVersionada,
  resumenSaldos: ResumenSaldosCotizacion,
  solicitud: SolicitudFacturacionParcial,
  opciones?: { tasaIva?: number }
): ResultadoValidacionFacturacionParcial {
  const errores: string[] = [];
  const tasaIva = opciones?.tasaIva ?? 0.15;

  // 1. Validar anomalías de integridad previas en la cotización
  if (resumenSaldos.tieneInconsistencias && resumenSaldos.inconsistencias) {
    errores.push(...resumenSaldos.inconsistencias);
  }

  // 2. Validar versión activa
  if (!cotizacion.esVersionActual) {
    errores.push(
      `No se puede facturar desde una versión sustituida o inactiva (v${cotizacion.version}). Solo la versión activa puede facturar.`
    );
  }

  // 3. Validar estado comercial de la cotización
  const estadosPermitidos = ["AUTORIZADA", "PARCIALMENTE_FACTURADA", "EMITIDA", "ACEPTADA"];
  if (!estadosPermitidos.includes(cotizacion.estado)) {
    errores.push(
      `La cotización se encuentra en estado '${cotizacion.estado}'. No está autorizada para facturación en Caja.`
    );
  }

  // 4. Validar contenido de la solicitud
  if (!solicitud.items || solicitud.items.length === 0) {
    errores.push("La solicitud de facturación parcial no contiene ítems.");
  }

  // 5. Detectar líneas duplicadas en la solicitud
  const idsVistos = new Set<string>();
  for (const it of solicitud.items || []) {
    if (idsVistos.has(it.cotizacionItemId)) {
      errores.push(
        `La solicitud contiene líneas duplicadas para el ítem cotizado '${it.cotizacionItemId}'.`
      );
    }
    idsVistos.add(it.cotizacionItemId);
  }

  const itemsValidados: ItemFacturacionParcialValidado[] = [];
  let subtotalAcumulado = 0;
  let descuentoAcumulado = 0;
  let ivaAcumulado = 0;

  for (const itemSol of solicitud.items || []) {
    const saldoItem = resumenSaldos.items.find(
      (it) => it.id === itemSol.cotizacionItemId
    );

    if (!saldoItem) {
      errores.push(
        `El ítem cotizado con id '${itemSol.cotizacionItemId}' no pertenece a la cotización ${cotizacion.numero}.`
      );
      continue;
    }

    const cantidadSolicitada = redondearCantidad(itemSol.cantidadAFacturar);

    if (cantidadSolicitada <= 0) {
      errores.push(
        `La cantidad a facturar para el producto '${saldoItem.productoId}' debe ser estrictamente positiva (recibido: ${cantidadSolicitada}).`
      );
      continue;
    }

    if (cantidadSolicitada > saldoItem.cantidadPendiente) {
      errores.push(
        `La cantidad solicitada (${cantidadSolicitada}) supera el saldo disponible (${saldoItem.cantidadPendiente}) para el producto '${saldoItem.productoId}'.`
      );
      continue;
    }

    const cantidadPendienteRestante = redondearCantidad(
      saldoItem.cantidadPendiente - cantidadSolicitada
    );

    const precioUnitario = saldoItem.precio;
    const descuentoUnitario = saldoItem.descuento || 0;
    const precioEfectivo = Math.max(0, precioUnitario - descuentoUnitario);

    const subtotalLinea = redondearMoneda(cantidadSolicitada * precioEfectivo);
    const ivaLinea = saldoItem.exentoIva ? 0 : redondearMoneda(subtotalLinea * tasaIva);
    const totalLinea = redondearMoneda(subtotalLinea + ivaLinea);

    subtotalAcumulado += subtotalLinea;
    descuentoAcumulado += redondearMoneda(cantidadSolicitada * descuentoUnitario);
    ivaAcumulado += ivaLinea;

    itemsValidados.push({
      cotizacionItemId: saldoItem.id,
      productoId: saldoItem.productoId,
      cantidadSolicitada,
      cantidadPendientePrevia: saldoItem.cantidadPendiente,
      cantidadPendienteRestante,
      precioUnitario,
      descuentoUnitario,
      exentoIva: !!saldoItem.exentoIva,
      subtotal: subtotalLinea,
      iva: ivaLinea,
      total: totalLinea,
    });
  }

  const subtotal = redondearMoneda(subtotalAcumulado);
  const descuento = redondearMoneda(descuentoAcumulado);
  const iva = redondearMoneda(ivaAcumulado);
  const total = redondearMoneda(subtotal + iva);

  const todosSaldosLiquidados =
    itemsValidados.length > 0 &&
    resumenSaldos.items.every((it) => {
      const facturadoEnEsta = itemsValidados.find(
        (v) => v.cotizacionItemId === it.id
      );
      const remanente = facturadoEnEsta
        ? facturadoEnEsta.cantidadPendienteRestante
        : it.cantidadPendiente;
      return remanente <= 0;
    });

  return {
    valida: errores.length === 0,
    cotizacionId: cotizacion.id,
    cotizacionNumero: cotizacion.numero,
    version: cotizacion.version,
    itemsValidados,
    subtotal,
    descuento,
    iva,
    total,
    todosSaldosLiquidados,
    ...(errores.length > 0 ? { errores } : {}),
  };
}

// ============================================================================
// 4. AUTORIZACIÓN DE PRECIOS NEGOCIADOS
// ============================================================================

/**
 * Valida si un precio negociado está debidamente autorizado por un dueño (admin).
 * Regla: No se altera el catálogo general ni el costo.
 */
export function validarPrecioAutorizado(
  linea: { productoId: string; precioSolicitado: number },
  precioCatalogo: number,
  autorizacion?: AutorizacionPrecio | null
): ResultadoValidacionPrecio {
  const precioSolicitado = redondearMoneda(linea.precioSolicitado);
  const catalogo = redondearMoneda(precioCatalogo);

  if (precioSolicitado === catalogo) {
    return {
      valido: true,
      precioFinal: catalogo,
      esPrecioNegociado: false,
    };
  }

  if (!autorizacion) {
    return {
      valido: false,
      precioFinal: catalogo,
      esPrecioNegociado: true,
      error: `El precio C$ ${precioSolicitado} difiere del catálogo oficial (C$ ${catalogo}) y no cuenta con autorización.`,
    };
  }

  const rol = autorizacion.rolAutorizador;
  if (rol !== "admin" && rol !== "ADMINISTRADOR") {
    return {
      valido: false,
      precioFinal: catalogo,
      esPrecioNegociado: true,
      error: `Solo los usuarios con rol de dueño ('admin') pueden autorizar precios negociados. Rol recibido: '${rol}'.`,
    };
  }

  if (autorizacion.productoId !== linea.productoId) {
    return {
      valido: false,
      precioFinal: catalogo,
      esPrecioNegociado: true,
      error: `La autorización provista corresponde al producto '${autorizacion.productoId}', no al producto solicitado '${linea.productoId}'.`,
    };
  }

  const precioAutorizado = redondearMoneda(autorizacion.precioAutorizado);
  if (precioAutorizado !== precioSolicitado) {
    return {
      valido: false,
      precioFinal: catalogo,
      esPrecioNegociado: true,
      error: `El precio solicitado (C$ ${precioSolicitado}) no coincide con el precio expresamente autorizado (C$ ${precioAutorizado}).`,
    };
  }

  return {
    valido: true,
    precioFinal: precioAutorizado,
    esPrecioNegociado: true,
    autorizacionAplicada: autorizacion,
  };
}

// ============================================================================
// 5. VERSIONADO INMUTABLE SIN DUPLICACIÓN
// ============================================================================

/**
 * Genera el borrador de una nueva versión sustituta V(N+1).
 * REGLAS:
 * 1. Inmutabilidad estricta: crea clones profundos de las versiones.
 * 2. V(N) pasa a estado 'SUSTITUIDA' con esVersionActual = false.
 * 3. V(N+1) contiene ÚNICAMENTE los compromisos pendientes acordados.
 * 4. NO duplica cantidades ya facturadas en V(N).
 * 5. NO reutiliza identificadores de líneas antiguas como si fueran nuevas.
 */
export function generarBorradorNuevaVersion(
  versionActual: CotizacionVersionada,
  saldosActuales: ResumenSaldosCotizacion,
  input: {
    nuevoId: string;
    nuevoNumero: string;
    fecha: string;
    usuario: string;
    motivo: string;
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
  }
): {
  versionActualSustituida: CotizacionVersionada;
  nuevaVersion: CotizacionVersionada;
} {
  if (!versionActual.esVersionActual) {
    throw new Error(
      `No se puede versionar una cotización que ya no es la versión activa actual (v${versionActual.version}).`
    );
  }

  // 1. Clon inmutable de la versión anterior como sustituida
  const copiaActual = structuredClone(versionActual);
  const versionActualSustituida: CotizacionVersionada = {
    ...copiaActual,
    estado: "SUSTITUIDA",
    esVersionActual: false,
    notas: copiaActual.notas
      ? `${copiaActual.notas} [Sustituida por v${copiaActual.version + 1}: ${input.motivo}]`
      : `[Sustituida por v${copiaActual.version + 1}: ${input.motivo}]`,
  };

  // 2. Nueva versión hereda identidad raíz y administra compromisos vigentes con IDs únicos
  const idsViejos = new Set(copiaActual.items.map((it) => it.id));
  const itemsNuevaVersion: LineaCotizadaDominio[] = input.nuevosItemsPendientes.map(
    (it) => {
      if (idsViejos.has(it.id)) {
        throw new Error(
          `Violación de inmutabilidad: no se puede reutilizar el id de línea histórica '${it.id}' en la nueva versión.`
        );
      }
      return {
        id: it.id,
        cotizacionId: input.nuevoId,
        productoId: it.productoId,
        cantidad: redondearCantidad(it.cantidad),
        precio: redondearMoneda(it.precio),
        costoUnitario: it.costoUnitario ? redondearMoneda(it.costoUnitario) : undefined,
        unidadMedida: it.unidadMedida,
        descuento: it.descuento ? redondearMoneda(it.descuento) : 0,
        exentoIva: !!it.exentoIva,
        observacion: it.observacion || "",
      };
    }
  );

  const subtotal = redondearMoneda(
    itemsNuevaVersion.reduce(
      (acc, it) => acc + (it.cantidad * Math.max(0, it.precio - (it.descuento || 0))),
      0
    )
  );

  const iva = redondearMoneda(
    itemsNuevaVersion
      .filter((it) => !it.exentoIva)
      .reduce(
        (acc, it) =>
          acc +
          it.cantidad * Math.max(0, it.precio - (it.descuento || 0)) * 0.15,
        0
      )
  );

  const total = redondearMoneda(subtotal + iva);

  const nuevaVersion: CotizacionVersionada = {
    id: input.nuevoId,
    numero: input.nuevoNumero,
    folio: copiaActual.folio,
    cliente: copiaActual.cliente,
    clienteId: copiaActual.clienteId,
    fecha: input.fecha,
    estado: "PENDIENTE_AUTORIZACION",
    notas: `Versión ${copiaActual.version + 1}. Motivo: ${input.motivo}`,
    condicionesComerciales: copiaActual.condicionesComerciales,
    creadoPor: input.usuario,
    facturaId: null,
    items: itemsNuevaVersion,
    subtotal,
    iva,
    total,
    version: copiaActual.version + 1,
    cotizacionRaizId: copiaActual.cotizacionRaizId || copiaActual.id,
    versionPadreId: copiaActual.id,
    esVersionActual: true,
    autorizadaPor: null,
    autorizadaEn: null,
  };

  return {
    versionActualSustituida,
    nuevaVersion,
  };
}
