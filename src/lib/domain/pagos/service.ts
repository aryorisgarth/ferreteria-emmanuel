/**
 * FERRETERÍA EMMANUEL — SERVICIO DE DOMINIO DE PAGOS Y CARTERA
 * Fase 1.3: Lógica desacoplada para ventas en efectivo, créditos, abonos y transferencias.
 * 
 * Cumple estrictamente con las reglas comerciales:
 * - Ventas en efectivo preparan ingreso en turno de caja activo.
 * - Ventas a crédito exigen autorización de propietario y validan límite disponible.
 * - Abonos son registrados exclusivamente por propietarios con idempotencia garantizada.
 * - Transferencias bancarias exigen referencia, comprobante y verificación de un dueño.
 */

import {
  AdaptadorAutorizacionMemoria,
} from "@/lib/domain/cotizaciones/service";
import type {
  IAdaptadorAutorizacionServidor,
  SesionAutenticadaServidor,
} from "@/lib/domain/cotizaciones/types";
import {
  evaluarLimiteCredito,
  redondearMoneda,
  transicionarTransferencia,
  validarDatosTransferencia,
  validarMontoAbono,
} from "./pure";
import {
  ErrorAutorizacionPagos,
  ErrorCreditoExcedido,
  ErrorDominioPagos,
  ErrorIdempotenciaPago,
  ErrorTransferenciaInvalida,
  type AbonoCreditoInput,
  type AbonoCreditoResultado,
  type AutorizacionCredito,
  type ClienteCreditoInfo,
  type FacturaCreditoInfo,
  type RegistroTransferenciaInput,
  type TransferenciaBancaria,
  type VentaCreditoPreparada,
  type VentaEfectivoPreparada,
  type VentaTransferenciaPreparada,
} from "./types";

export class PagosCarteraService {
  constructor(
    private readonly adaptadorAuth: IAdaptadorAutorizacionServidor = new AdaptadorAutorizacionMemoria()
  ) {}

  // ==========================================================================
  // 1. VENTAS EN EFECTIVO
  // ==========================================================================

  /**
   * Prepara el cobro en efectivo asociándolo al turno de caja activo del cajero.
   */
  prepararVentaEfectivo(input: {
    facturaId: string;
    total: number;
    turnoCajaId?: string | null;
    usuario: string;
  }): VentaEfectivoPreparada {
    const total = redondearMoneda(input.total);
    if (total <= 0) {
      throw new ErrorDominioPagos("El total de la venta en efectivo debe ser mayor a cero.");
    }

    const turnoCajaId = (input.turnoCajaId || "").trim();
    if (!turnoCajaId) {
      throw new ErrorDominioPagos(
        "Para registrar un cobro en efectivo es obligatorio un turno de caja activo."
      );
    }

    return {
      facturaId: input.facturaId,
      total,
      turnoCajaId,
      movimientoCaja: {
        turnoCajaId,
        tipo: "INGRESO",
        monto: total,
        concepto: `Venta Factura ${input.facturaId} (Efectivo)`,
        usuario: input.usuario,
      },
    };
  }

  // ==========================================================================
  // 2. VENTAS A CRÉDITO
  // ==========================================================================

  /**
   * Prepara una venta a crédito validando límite del cliente y autorización del dueño.
   * Regla: No genera ningún movimiento de efectivo en caja física.
   */
  prepararVentaCredito(input: {
    facturaId: string;
    total: number;
    cliente: ClienteCreditoInfo;
    autorizacion?: AutorizacionCredito | null;
    sesion: SesionAutenticadaServidor;
    motivo?: string;
  }): VentaCreditoPreparada {
    const total = redondearMoneda(input.total);
    if (total <= 0) {
      throw new ErrorDominioPagos("El monto de la venta a crédito debe ser mayor a cero.");
    }

    // 1. Verificar autorización exclusiva de propietarios
    const esDuenioDirecto = this.adaptadorAuth.esPropietario(input.sesion);
    let autorizacionEfectiva: AutorizacionCredito;

    if (esDuenioDirecto) {
      autorizacionEfectiva = {
        clienteId: input.cliente.id,
        montoCredito: total,
        autorizadoPor: input.sesion.id,
        rolAutorizador: "admin",
        fechaAutorizacion: new Date().toISOString(),
        motivo: input.motivo || "Autorizado directamente por propietario en sesión",
      };
    } else {
      const auth = input.autorizacion;
      if (!auth) {
        throw new ErrorAutorizacionPagos(
          `La venta a crédito por C$ ${total} para el cliente '${input.cliente.nombre}' requiere autorización explícita de un propietario.`
        );
      }

      if (auth.rolAutorizador !== "admin" && auth.rolAutorizador !== "ADMINISTRADOR") {
        throw new ErrorAutorizacionPagos(
          `Solo los propietarios pueden autorizar créditos comerciales. Rol provisto: '${auth.rolAutorizador}'.`
        );
      }

      if (auth.clienteId !== input.cliente.id) {
        throw new ErrorAutorizacionPagos(
          `La autorización provista pertenece al cliente '${auth.clienteId}', no al cliente de la venta '${input.cliente.id}'.`
        );
      }

      if (redondearMoneda(auth.montoCredito) < total) {
        throw new ErrorAutorizacionPagos(
          `El monto autorizado de crédito (C$ ${auth.montoCredito}) es menor al total de la venta (C$ ${total}).`
        );
      }

      autorizacionEfectiva = auth;
    }

    // 2. Validar límite de crédito y saldo disponible
    const evalCredito = evaluarLimiteCredito(input.cliente, total);
    if (!evalCredito.permitido) {
      throw new ErrorCreditoExcedido(evalCredito.error!);
    }

    return {
      facturaId: input.facturaId,
      clienteId: input.cliente.id,
      total,
      saldoClientePrevio: redondearMoneda(input.cliente.saldoPendiente),
      saldoClienteNuevo: evalCredito.nuevoSaldoTotal,
      saldoFacturaPendiente: total,
      autorizacion: autorizacionEfectiva,
    };
  }

  // ==========================================================================
  // 3. TRANSFERENCIAS BANCARIAS
  // ==========================================================================

  /**
   * Prepara una venta con pago por transferencia bancaria.
   * Regla: Inicia siempre en PENDIENTE_VERIFICACION. El comprobante no acredita el pago.
   */
  prepararVentaTransferencia(input: {
    facturaId: string;
    total: number;
    transferenciaInput: RegistroTransferenciaInput;
    usuario: string;
    nuevoId?: string;
  }): VentaTransferenciaPreparada {
    const total = redondearMoneda(input.total);
    const valTrans = validarDatosTransferencia(input.transferenciaInput);
    if (!valTrans.valida) {
      throw new ErrorTransferenciaInvalida(
        `Datos de transferencia incompletos: ${valTrans.errores!.join("; ")}`
      );
    }

    const montoTrans = redondearMoneda(input.transferenciaInput.monto);
    if (montoTrans !== total) {
      throw new ErrorTransferenciaInvalida(
        `El monto reportado en la transferencia (C$ ${montoTrans}) no coincide con el total de la venta (C$ ${total}).`
      );
    }

    const transferencia: TransferenciaBancaria = {
      id: input.nuevoId || `trf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenciaBancaria: input.transferenciaInput.referenciaBancaria.trim(),
      comprobanteUrl: input.transferenciaInput.comprobanteUrl.trim(),
      monto: montoTrans,
      estado: "PENDIENTE_VERIFICACION",
      bancoDestino: input.transferenciaInput.bancoDestino?.trim() || undefined,
      creadoPor: input.usuario,
      creadoEn: new Date().toISOString(),
      verificadoPor: null,
      verificadoEn: null,
      motivoRechazo: null,
    };

    return {
      facturaId: input.facturaId,
      total,
      transferencia,
      requiereVerificacion: true,
    };
  }

  /**
   * Verifica y acredita una transferencia bancaria. Exclusivo para dueños.
   */
  verificarTransferencia(
    transferencia: TransferenciaBancaria,
    sesion: SesionAutenticadaServidor
  ): TransferenciaBancaria {
    if (!this.adaptadorAuth.esPropietario(sesion)) {
      throw new ErrorAutorizacionPagos(
        `Acceso denegado: solo un propietario puede verificar transferencias bancarias. Usuario: '${sesion.usuario}'.`
      );
    }

    return transicionarTransferencia(
      transferencia,
      "VERIFICADA",
      sesion.usuario,
      new Date().toISOString()
    );
  }

  /**
   * Rechaza una transferencia bancaria tras no comprobarse los fondos. Exclusivo para dueños.
   */
  rechazarTransferencia(
    transferencia: TransferenciaBancaria,
    motivo: string,
    sesion: SesionAutenticadaServidor
  ): TransferenciaBancaria {
    if (!this.adaptadorAuth.esPropietario(sesion)) {
      throw new ErrorAutorizacionPagos(
        `Acceso denegado: solo un propietario puede rechazar transferencias bancarias. Usuario: '${sesion.usuario}'.`
      );
    }

    const motivoLimpio = (motivo || "").trim();
    if (!motivoLimpio) {
      throw new ErrorTransferenciaInvalida("Debe ingresar el motivo de rechazo de la transferencia.");
    }

    return transicionarTransferencia(
      transferencia,
      "RECHAZADA",
      sesion.usuario,
      new Date().toISOString(),
      motivoLimpio
    );
  }

  // ==========================================================================
  // 4. ABONOS A CUENTAS POR COBRAR (CRÉDITO)
  // ==========================================================================

  /**
   * Registra un abono a una factura de crédito.
   * Reglas:
   * 1. Exclusivo para propietarios.
   * 2. Idempotencia obligatoria.
   * 3. Medios permitidos: EFECTIVO o TRANSFERENCIA.
   * 4. No acredita transferencias pendientes como cobro efectivo extinguido.
   */
  registrarAbonoCredito(
    input: AbonoCreditoInput,
    factura: FacturaCreditoInfo,
    cliente: ClienteCreditoInfo,
    sesion: SesionAutenticadaServidor,
    registroIdempotencia: Set<string>,
    nuevoFolio?: string
  ): AbonoCreditoResultado {
    // 1. Autorización de propietario
    if (!this.adaptadorAuth.esPropietario(sesion)) {
      throw new ErrorAutorizacionPagos(
        `Solo los propietarios con rol administrativo verificado pueden registrar abonos a créditos. Usuario: '${sesion.usuario}'.`
      );
    }

    // 2. Control de idempotencia
    const idempKey = (input.idempotencyKey || "").trim();
    if (!idempKey) {
      throw new ErrorIdempotenciaPago("Se requiere una clave de idempotencia única para registrar el abono.");
    }
    if (registroIdempotencia.has(idempKey)) {
      throw new ErrorIdempotenciaPago(
        `El abono con clave de idempotencia '${idempKey}' ya fue registrado previamente. Operación duplicada prevenida.`
      );
    }

    // 3. Validar estado de la factura
    if (factura.estado === "ANULADA") {
      throw new ErrorDominioPagos(`No se pueden registrar abonos a una factura anulada (${factura.numero}).`);
    }
    if (factura.estado === "PAGADA" || factura.saldoPendiente <= 0) {
      throw new ErrorDominioPagos(`La factura ${factura.numero} ya se encuentra pagada en su totalidad.`);
    }

    // 4. Validar monto del abono
    const valMonto = validarMontoAbono(factura.saldoPendiente, cliente.saldoPendiente, input.monto);
    if (!valMonto.valido) {
      throw new ErrorDominioPagos(valMonto.error!);
    }

    // 5. Tratamiento según medio de cobro
    let movimientoCaja: AbonoCreditoResultado["movimientoCaja"] = undefined;
    let transferencia: TransferenciaBancaria | undefined = undefined;

    if (input.medioCobro === "EFECTIVO") {
      const turnoId = (input.turnoCajaId || "").trim();
      if (!turnoId) {
        throw new ErrorDominioPagos(
          "Para un abono en efectivo es obligatorio especificar el turno de caja receptor activo."
        );
      }
      movimientoCaja = {
        turnoCajaId: turnoId,
        tipo: "INGRESO",
        monto: valMonto.monto,
        concepto: `Abono a Factura ${factura.numero} (Efectivo)`,
        usuario: sesion.usuario,
      };
    } else if (input.medioCobro === "TRANSFERENCIA") {
      if (!input.transferencia) {
        throw new ErrorTransferenciaInvalida(
          "Para registrar un abono por transferencia se requiere la referencia y comprobante."
        );
      }
      const valT = validarDatosTransferencia(input.transferencia);
      if (!valT.valida) {
        throw new ErrorTransferenciaInvalida(
          `Datos de transferencia del abono inválidos: ${valT.errores!.join("; ")}`
        );
      }

      // Si el dueño registra el abono con transferencia y la verifica en el acto:
      transferencia = {
        id: `trf_abn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        referenciaBancaria: input.transferencia.referenciaBancaria.trim(),
        comprobanteUrl: input.transferencia.comprobanteUrl.trim(),
        monto: valMonto.monto,
        estado: "VERIFICADA",
        bancoDestino: input.transferencia.bancoDestino?.trim() || undefined,
        creadoPor: sesion.usuario,
        creadoEn: new Date().toISOString(),
        verificadoPor: sesion.usuario,
        verificadoEn: new Date().toISOString(),
        motivoRechazo: null,
      };
    } else {
      throw new ErrorDominioPagos(
        `Medio de cobro '${input.medioCobro}' no permitido. Los abonos solo admiten EFECTIVO o TRANSFERENCIA.`
      );
    }

    // Registrar en el set de idempotencia
    registroIdempotencia.add(idempKey);

    const abonoId = `abn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const folio = nuevoFolio || `ABN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: abonoId,
      folio,
      facturaId: factura.id,
      clienteId: cliente.id,
      monto: valMonto.monto,
      medioCobro: input.medioCobro,
      saldoFacturaPrevio: factura.saldoPendiente,
      saldoFacturaRestante: valMonto.saldoFacturaRestante,
      saldoClientePrevio: cliente.saldoPendiente,
      saldoClienteRestante: valMonto.saldoClienteRestante,
      estaTotalmentePagada: valMonto.estaTotalmentePagada,
      movimientoCaja,
      transferencia,
      registradoPor: sesion.usuario,
      fecha: new Date().toISOString(),
      idempotencyKey: idempKey,
    };
  }
}
