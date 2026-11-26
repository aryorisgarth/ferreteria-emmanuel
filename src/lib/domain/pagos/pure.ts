/**
 * FERRETERÍA EMMANUEL — FUNCIONES PURAS DE PAGOS Y CARTERA
 * Fase 1.3: Cálculos y validaciones de límites de crédito, transferencias y abonos.
 * 
 * Todas las funciones aquí contenidas son puras:
 * - Deterministas.
 * - Sin efectos secundarios.
 * - Sin conexiones de red, filesystem o base de datos.
 */

import { r2 } from "@/lib/format";
import {
  ErrorTransferenciaInvalida,
  type ClienteCreditoInfo,
  type EstadoTransferenciaBancaria,
  type RegistroTransferenciaInput,
  type TransferenciaBancaria,
} from "./types";

/**
 * Redondeo monetario formal a 2 decimales.
 */
export function redondearMoneda(valor: number): number {
  return r2(valor);
}

/**
 * Evalúa si un cliente cuenta con límite de crédito disponible suficiente para una nueva venta.
 */
export function evaluarLimiteCredito(
  cliente: ClienteCreditoInfo,
  montoNuevaVenta: number
): {
  permitido: boolean;
  saldoDisponible: number;
  nuevoSaldoTotal: number;
  exceso: number;
  error?: string;
} {
  const monto = redondearMoneda(montoNuevaVenta);
  if (monto <= 0) {
    return {
      permitido: false,
      saldoDisponible: 0,
      nuevoSaldoTotal: cliente.saldoPendiente,
      exceso: 0,
      error: "El monto de la venta a crédito debe ser mayor a cero.",
    };
  }

  if (!cliente.activo) {
    return {
      permitido: false,
      saldoDisponible: 0,
      nuevoSaldoTotal: cliente.saldoPendiente,
      exceso: 0,
      error: `El cliente '${cliente.nombre}' se encuentra inactivo para operaciones de crédito.`,
    };
  }

  const limite = redondearMoneda(cliente.limiteCredito);
  const saldoActual = redondearMoneda(cliente.saldoPendiente);
  const saldoDisponible = Math.max(0, redondearMoneda(limite - saldoActual));
  const nuevoSaldoTotal = redondearMoneda(saldoActual + monto);

  if (nuevoSaldoTotal > limite) {
    const exceso = redondearMoneda(nuevoSaldoTotal - limite);
    return {
      permitido: false,
      saldoDisponible,
      nuevoSaldoTotal,
      exceso,
      error: `La venta a crédito por C$ ${monto} excede el límite de crédito del cliente (Límite: C$ ${limite}, Saldo actual: C$ ${saldoActual}, Disponible: C$ ${saldoDisponible}, Exceso: C$ ${exceso}).`,
    };
  }

  return {
    permitido: true,
    saldoDisponible,
    nuevoSaldoTotal,
    exceso: 0,
  };
}

/**
 * Valida los datos requeridos para registrar una transferencia bancaria.
 * Regla: Referencia y Comprobante son obligatorios; monto debe ser positivo.
 */
export function validarDatosTransferencia(
  input: RegistroTransferenciaInput
): {
  valida: boolean;
  errores?: string[];
} {
  const errores: string[] = [];

  const ref = (input.referenciaBancaria || "").trim();
  if (!ref) {
    errores.push("El número de referencia bancaria es obligatorio para pagos por transferencia.");
  }

  const comp = (input.comprobanteUrl || "").trim();
  if (!comp) {
    errores.push("El comprobante o voucher digital es obligatorio para pagos por transferencia.");
  }

  const monto = redondearMoneda(input.monto);
  if (monto <= 0) {
    errores.push("El monto de la transferencia debe ser estrictamente positivo.");
  }

  return {
    valida: errores.length === 0,
    ...(errores.length > 0 ? { errores } : {}),
  };
}

/**
 * Aplica la transición de estado para una transferencia bancaria.
 * Regla: Solo transferencias en estado PENDIENTE_VERIFICACION pueden ser verificadas o rechazadas.
 * Evita doble verificación contable.
 */
export function transicionarTransferencia(
  transferencia: TransferenciaBancaria,
  nuevoEstado: EstadoTransferenciaBancaria,
  verificadoPor: string,
  fechaIso: string,
  motivoRechazo?: string
): TransferenciaBancaria {
  if (transferencia.estado !== "PENDIENTE_VERIFICACION") {
    throw new ErrorTransferenciaInvalida(
      `Operación inválida: la transferencia con referencia '${transferencia.referenciaBancaria}' ya se encuentra en estado '${transferencia.estado}' y no puede volver a modificarse.`
    );
  }

  if (nuevoEstado === "PENDIENTE_VERIFICACION") {
    throw new ErrorTransferenciaInvalida(
      "No se puede re-transicionar una transferencia a PENDIENTE_VERIFICACION."
    );
  }

  return {
    ...structuredClone(transferencia),
    estado: nuevoEstado,
    verificadoPor,
    verificadoEn: fechaIso,
    motivoRechazo: nuevoEstado === "RECHAZADA" ? motivoRechazo || "Rechazada por propietario" : null,
  };
}

/**
 * Valida el monto de un abono contra los saldos pendientes de la factura y del cliente.
 */
export function validarMontoAbono(
  saldoFactura: number,
  saldoCliente: number,
  montoAbono: number
): {
  valido: boolean;
  monto: number;
  saldoFacturaRestante: number;
  saldoClienteRestante: number;
  estaTotalmentePagada: boolean;
  error?: string;
} {
  const monto = redondearMoneda(montoAbono);
  const saldoF = redondearMoneda(saldoFactura);
  const saldoC = redondearMoneda(saldoCliente);

  if (monto <= 0) {
    return {
      valido: false,
      monto,
      saldoFacturaRestante: saldoF,
      saldoClienteRestante: saldoC,
      estaTotalmentePagada: false,
      error: `El monto del abono debe ser estrictamente positivo (recibido: C$ ${monto}).`,
    };
  }

  if (monto > saldoF) {
    return {
      valido: false,
      monto,
      saldoFacturaRestante: saldoF,
      saldoClienteRestante: saldoC,
      estaTotalmentePagada: false,
      error: `El monto del abono (C$ ${monto}) supera el saldo pendiente de la factura (C$ ${saldoF}).`,
    };
  }

  const saldoFacturaRestante = redondearMoneda(saldoF - monto);
  const saldoClienteRestante = Math.max(0, redondearMoneda(saldoC - monto));

  return {
    valido: true,
    monto,
    saldoFacturaRestante,
    saldoClienteRestante,
    estaTotalmentePagada: saldoFacturaRestante === 0,
  };
}
