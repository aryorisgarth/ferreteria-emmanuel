/**
 * PRUEBAS UNITARIAS DE DOMINIO — FASE 1.3: PagosCarteraService
 * 
 * Cobertura de los 14 escenarios obligatorios:
 * 1. Venta en efectivo válida.
 * 2. Venta a crédito autorizada.
 * 3. Crédito sin autorización rechazado.
 * 4. Crédito que supera el límite rechazado.
 * 5. Abono en efectivo válido.
 * 6. Abono superior al saldo rechazado.
 * 7. Abono registrado por cajero rechazado.
 * 8. Transferencia sin referencia rechazada.
 * 9. Transferencia sin comprobante rechazada.
 * 10. Verificación de transferencia por dueño.
 * 11. Intento de verificación por cajero rechazado.
 * 12. Idempotencia de abonos.
 * 13. Rechazo de transferencia y estados inválidos.
 * 14. Prevención de doble aplicación contable.
 */

import assert from "node:assert/strict";
import { AdaptadorAutorizacionMemoria } from "../../src/lib/domain/cotizaciones/service";
import type { SesionAutenticadaServidor } from "../../src/lib/domain/cotizaciones/types";
import { PagosCarteraService } from "../../src/lib/domain/pagos/service";
import {
  ErrorAutorizacionPagos,
  ErrorCreditoExcedido,
  ErrorDominioPagos,
  ErrorIdempotenciaPago,
  ErrorTransferenciaInvalida,
  type AutorizacionCredito,
  type ClienteCreditoInfo,
  type FacturaCreditoInfo,
  type TransferenciaBancaria,
} from "../../src/lib/domain/pagos/types";

console.log("Iniciando pruebas unitarias de PagosCarteraService (Fase 1.3)...");

const authAdapter = new AdaptadorAutorizacionMemoria();
const service = new PagosCarteraService(authAdapter);

const sesionDuenio: SesionAutenticadaServidor = {
  id: "usr-admin-1",
  usuario: "propietario_pedro",
  nombre: "Pedro Emmanuel",
  rol: "admin",
};

const sesionCajero: SesionAutenticadaServidor = {
  id: "usr-cajero-1",
  usuario: "cajero_juan",
  nombre: "Juan Perez",
  rol: "cajero",
};

// ============================================================================
// ESCENARIO 1: Venta en efectivo válida
// ============================================================================
{
  const prep = service.prepararVentaEfectivo({
    facturaId: "fac-101",
    total: 1500.0,
    turnoCajaId: "trn-caja-01",
    usuario: "cajero_juan",
  });

  assert.equal(prep.facturaId, "fac-101");
  assert.equal(prep.total, 1500.0);
  assert.equal(prep.turnoCajaId, "trn-caja-01");
  assert.equal(prep.movimientoCaja.tipo, "INGRESO");
  assert.equal(prep.movimientoCaja.monto, 1500.0);
  console.log("✓ Escenario 1: Venta en efectivo válida preparada con movimiento de caja.");
}

// ============================================================================
// ESCENARIO 2: Venta a crédito autorizada
// ============================================================================
{
  const cliente: ClienteCreditoInfo = {
    id: "cli-1",
    nombre: "Constructora del Norte",
    limiteCredito: 50000.0,
    saldoPendiente: 10000.0, // Disponible = 40,000
    activo: true,
  };

  const authCredito: AutorizacionCredito = {
    clienteId: "cli-1",
    montoCredito: 15000.0,
    autorizadoPor: "propietario_pedro",
    rolAutorizador: "admin",
    fechaAutorizacion: "2026-11-18",
  };

  const prep = service.prepararVentaCredito({
    facturaId: "fac-102",
    total: 15000.0,
    cliente,
    autorizacion: authCredito,
    sesion: sesionCajero,
  });

  assert.equal(prep.total, 15000.0);
  assert.equal(prep.saldoClientePrevio, 10000.0);
  assert.equal(prep.saldoClienteNuevo, 25000.0);
  assert.equal(prep.saldoFacturaPendiente, 15000.0);
  console.log("✓ Escenario 2: Venta a crédito autorizada calculada sin tocar caja física.");
}

// ============================================================================
// ESCENARIO 3: Crédito sin autorización rechazado
// ============================================================================
{
  const cliente: ClienteCreditoInfo = {
    id: "cli-2",
    nombre: "Ferretera San Pablo",
    limiteCredito: 20000.0,
    saldoPendiente: 5000.0,
    activo: true,
  };

  assert.throws(
    () => {
      service.prepararVentaCredito({
        facturaId: "fac-103",
        total: 5000.0,
        cliente,
        autorizacion: null, // Sin autorización
        sesion: sesionCajero,
      });
    },
    (err: any) => {
      assert.ok(err instanceof ErrorAutorizacionPagos);
      assert.match(err.message, /requiere autorización explícita de un propietario/);
      return true;
    }
  );
  console.log("✓ Escenario 3: Crédito sin autorización rechazado.");
}

// ============================================================================
// ESCENARIO 4: Crédito que supera el límite rechazado
// ============================================================================
{
  const cliente: ClienteCreditoInfo = {
    id: "cli-3",
    nombre: "Taller Hermanos Gómez",
    limiteCredito: 10000.0,
    saldoPendiente: 8000.0, // Solo quedan 2,000 disponibles
    activo: true,
  };

  assert.throws(
    () => {
      service.prepararVentaCredito({
        facturaId: "fac-104",
        total: 5000.0, // Supera por 3,000 el límite
        cliente,
        sesion: sesionDuenio, // Aunque lo pida el dueño, el límite duro del cliente se protege
      });
    },
    (err: any) => {
      assert.ok(err instanceof ErrorCreditoExcedido);
      assert.match(err.message, /excede el límite de crédito/);
      return true;
    }
  );
  console.log("✓ Escenario 4: Crédito que supera el límite del cliente rechazado.");
}

// ============================================================================
// ESCENARIO 5: Abono en efectivo válido
// ============================================================================
{
  const factura: FacturaCreditoInfo = {
    id: "fac-200",
    numero: "FAC-2026-0200",
    clienteId: "cli-5",
    total: 10000.0,
    saldoPendiente: 6000.0,
    estado: "EMITIDA",
    formaPago: "CREDITO",
  };

  const cliente: ClienteCreditoInfo = {
    id: "cli-5",
    nombre: "Constructora Modulares",
    limiteCredito: 30000.0,
    saldoPendiente: 15000.0,
    activo: true,
  };

  const idempotenciaSet = new Set<string>();

  const abono = service.registrarAbonoCredito(
    {
      facturaId: "fac-200",
      clienteId: "cli-5",
      monto: 2500.0,
      medioCobro: "EFECTIVO",
      turnoCajaId: "trn-caja-01",
      idempotencyKey: "abn-idemp-001",
    },
    factura,
    cliente,
    sesionDuenio,
    idempotenciaSet
  );

  assert.equal(abono.monto, 2500.0);
  assert.equal(abono.saldoFacturaPrevio, 6000.0);
  assert.equal(abono.saldoFacturaRestante, 3500.0);
  assert.equal(abono.saldoClientePrevio, 15000.0);
  assert.equal(abono.saldoClienteRestante, 12500.0);
  assert.equal(abono.estaTotalmentePagada, false);
  assert.ok(abono.movimientoCaja);
  assert.equal(abono.movimientoCaja.monto, 2500.0);
  assert.equal(abono.movimientoCaja.tipo, "INGRESO");
  assert.equal(idempotenciaSet.has("abn-idemp-001"), true);
  console.log("✓ Escenario 5: Abono en efectivo válido registrado con impacto a caja.");
}

// ============================================================================
// ESCENARIO 6: Abono superior al saldo rechazado
// ============================================================================
{
  const factura: FacturaCreditoInfo = {
    id: "fac-201",
    numero: "FAC-2026-0201",
    clienteId: "cli-6",
    total: 5000.0,
    saldoPendiente: 1200.0,
    estado: "EMITIDA",
    formaPago: "CREDITO",
  };

  const cliente: ClienteCreditoInfo = {
    id: "cli-6",
    nombre: "Cliente Seis",
    limiteCredito: 10000.0,
    saldoPendiente: 1200.0,
    activo: true,
  };

  const idempSet = new Set<string>();

  assert.throws(
    () => {
      service.registrarAbonoCredito(
        {
          facturaId: "fac-201",
          clienteId: "cli-6",
          monto: 1500.0, // Supera los 1,200
          medioCobro: "EFECTIVO",
          turnoCajaId: "trn-caja-01",
          idempotencyKey: "abn-idemp-002",
        },
        factura,
        cliente,
        sesionDuenio,
        idempSet
      );
    },
    (err: any) => {
      assert.ok(err instanceof ErrorDominioPagos);
      assert.match(err.message, /supera el saldo pendiente/);
      return true;
    }
  );
  console.log("✓ Escenario 6: Abono superior al saldo pendiente de la factura rechazado.");
}

// ============================================================================
// ESCENARIO 7: Abono registrado por cajero rechazado
// ============================================================================
{
  const factura: FacturaCreditoInfo = {
    id: "fac-202",
    numero: "FAC-2026-0202",
    clienteId: "cli-7",
    total: 3000.0,
    saldoPendiente: 3000.0,
    estado: "EMITIDA",
    formaPago: "CREDITO",
  };

  const cliente: ClienteCreditoInfo = {
    id: "cli-7",
    nombre: "Cliente Siete",
    limiteCredito: 10000.0,
    saldoPendiente: 3000.0,
    activo: true,
  };

  const idempSet = new Set<string>();

  assert.throws(
    () => {
      service.registrarAbonoCredito(
        {
          facturaId: "fac-202",
          clienteId: "cli-7",
          monto: 1000.0,
          medioCobro: "EFECTIVO",
          turnoCajaId: "trn-caja-01",
          idempotencyKey: "abn-idemp-003",
        },
        factura,
        cliente,
        sesionCajero, // Cajero no autorizado para aplicar abonos
        idempSet
      );
    },
    (err: any) => {
      assert.ok(err instanceof ErrorAutorizacionPagos);
      assert.match(err.message, /Solo los propietarios con rol administrativo/);
      return true;
    }
  );
  console.log("✓ Escenario 7: Abono registrado por cajero rechazado.");
}

// ============================================================================
// ESCENARIO 8: Transferencia sin referencia rechazada
// ============================================================================
{
  assert.throws(
    () => {
      service.prepararVentaTransferencia({
        facturaId: "fac-301",
        total: 2000.0,
        transferenciaInput: {
          referenciaBancaria: "", // Vacía
          comprobanteUrl: "https://comprobantes.empresa.com/v123.jpg",
          monto: 2000.0,
        },
        usuario: "cajero_juan",
      });
    },
    (err: any) => {
      assert.ok(err instanceof ErrorTransferenciaInvalida);
      assert.match(err.message, /número de referencia bancaria es obligatorio/);
      return true;
    }
  );
  console.log("✓ Escenario 8: Transferencia sin referencia rechazada.");
}

// ============================================================================
// ESCENARIO 9: Transferencia sin comprobante rechazada
// ============================================================================
{
  assert.throws(
    () => {
      service.prepararVentaTransferencia({
        facturaId: "fac-302",
        total: 2000.0,
        transferenciaInput: {
          referenciaBancaria: "REF-BAC-987654",
          comprobanteUrl: "   ", // Espacios en blanco
          monto: 2000.0,
        },
        usuario: "cajero_juan",
      });
    },
    (err: any) => {
      assert.ok(err instanceof ErrorTransferenciaInvalida);
      assert.match(err.message, /comprobante o voucher digital es obligatorio/);
      return true;
    }
  );
  console.log("✓ Escenario 9: Transferencia sin comprobante rechazada.");
}

// ============================================================================
// ESCENARIO 10: Verificación de transferencia por dueño
// ============================================================================
{
  const prep = service.prepararVentaTransferencia({
    facturaId: "fac-303",
    total: 4500.0,
    transferenciaInput: {
      referenciaBancaria: "BANPRO-889900",
      comprobanteUrl: "https://cloud.empresa.com/vouchers/v8899.png",
      bancoDestino: "BANPRO",
      monto: 4500.0,
    },
    usuario: "cajero_juan",
  });

  assert.equal(prep.transferencia.estado, "PENDIENTE_VERIFICACION");

  // El dueño verifica la acreditación real en banca en línea
  const verificada = service.verificarTransferencia(prep.transferencia, sesionDuenio);
  assert.equal(verificada.estado, "VERIFICADA");
  assert.equal(verificada.verificadoPor, "propietario_pedro");
  assert.ok(verificada.verificadoEn);
  console.log("✓ Escenario 10: Verificación de transferencia por dueño exitosa.");
}

// ============================================================================
// ESCENARIO 11: Intento de verificación por cajero rechazado
// ============================================================================
{
  const transferenciaPendiente: TransferenciaBancaria = {
    id: "trf-11",
    referenciaBancaria: "BAC-112233",
    comprobanteUrl: "https://storage.com/v11.png",
    monto: 1000.0,
    estado: "PENDIENTE_VERIFICACION",
    creadoPor: "cajero_juan",
    creadoEn: "2026-11-18",
    verificadoPor: null,
    verificadoEn: null,
    motivoRechazo: null,
  };

  assert.throws(
    () => {
      service.verificarTransferencia(transferenciaPendiente, sesionCajero);
    },
    (err: any) => {
      assert.ok(err instanceof ErrorAutorizacionPagos);
      assert.match(err.message, /solo un propietario puede verificar/);
      return true;
    }
  );
  console.log("✓ Escenario 11: Intento de verificación por cajero bloqueado.");
}

// ============================================================================
// ESCENARIO 12: Idempotencia de abonos
// ============================================================================
{
  const factura: FacturaCreditoInfo = {
    id: "fac-204",
    numero: "FAC-2026-0204",
    clienteId: "cli-12",
    total: 8000.0,
    saldoPendiente: 4000.0,
    estado: "EMITIDA",
    formaPago: "CREDITO",
  };

  const cliente: ClienteCreditoInfo = {
    id: "cli-12",
    nombre: "Cliente Doce",
    limiteCredito: 20000.0,
    saldoPendiente: 4000.0,
    activo: true,
  };

  const idempSet = new Set<string>();

  // Primer registro (Exitoso)
  service.registrarAbonoCredito(
    {
      facturaId: "fac-204",
      clienteId: "cli-12",
      monto: 1000.0,
      medioCobro: "EFECTIVO",
      turnoCajaId: "trn-caja-01",
      idempotencyKey: "CLAVE-REPETIDA-12",
    },
    factura,
    cliente,
    sesionDuenio,
    idempSet
  );

  // Segundo registro con la misma clave (Debe ser rechazado por idempotencia)
  assert.throws(
    () => {
      service.registrarAbonoCredito(
        {
          facturaId: "fac-204",
          clienteId: "cli-12",
          monto: 1000.0,
          medioCobro: "EFECTIVO",
          turnoCajaId: "trn-caja-01",
          idempotencyKey: "CLAVE-REPETIDA-12",
        },
        factura,
        cliente,
        sesionDuenio,
        idempSet
      );
    },
    (err: any) => {
      assert.ok(err instanceof ErrorIdempotenciaPago);
      assert.match(err.message, /ya fue registrado previamente/);
      return true;
    }
  );
  console.log("✓ Escenario 12: Control de idempotencia en abonos validado.");
}

// ============================================================================
// ESCENARIO 13: Rechazo de transferencia y estados inválidos
// ============================================================================
{
  const transferenciaPendiente: TransferenciaBancaria = {
    id: "trf-13",
    referenciaBancaria: "LAFISE-998877",
    comprobanteUrl: "https://storage.com/v13.png",
    monto: 3000.0,
    estado: "PENDIENTE_VERIFICACION",
    creadoPor: "cajero_juan",
    creadoEn: "2026-11-18",
    verificadoPor: null,
    verificadoEn: null,
    motivoRechazo: null,
  };

  // Dueño rechaza la transferencia por fondos no acreditados
  const rechazada = service.rechazarTransferencia(
    transferenciaPendiente,
    "No aparece reflejado en estado de cuenta BAC",
    sesionDuenio
  );

  assert.equal(rechazada.estado, "RECHAZADA");
  assert.equal(rechazada.motivoRechazo, "No aparece reflejado en estado de cuenta BAC");
  assert.equal(rechazada.verificadoPor, "propietario_pedro");

  // Intentar verificar una transferencia ya rechazada debe fallar
  assert.throws(
    () => {
      service.verificarTransferencia(rechazada, sesionDuenio);
    },
    (err: any) => {
      assert.ok(err instanceof ErrorTransferenciaInvalida);
      assert.match(err.message, /ya se encuentra en estado 'RECHAZADA'/);
      return true;
    }
  );
  console.log("✓ Escenario 13: Rechazo de transferencias y bloqueo de transiciones inválidas comprobado.");
}

// ============================================================================
// ESCENARIO 14: Prevención de doble aplicación contable
// ============================================================================
{
  const transferenciaVerificada: TransferenciaBancaria = {
    id: "trf-14",
    referenciaBancaria: "BDF-445566",
    comprobanteUrl: "https://storage.com/v14.png",
    monto: 2500.0,
    estado: "VERIFICADA",
    creadoPor: "cajero_juan",
    creadoEn: "2026-11-18",
    verificadoPor: "propietario_pedro",
    verificadoEn: "2026-11-18",
    motivoRechazo: null,
  };

  // No se puede volver a verificar para no duplicar el descargo contable
  assert.throws(
    () => {
      service.verificarTransferencia(transferenciaVerificada, sesionDuenio);
    },
    (err: any) => {
      assert.ok(err instanceof ErrorTransferenciaInvalida);
      assert.match(err.message, /ya se encuentra en estado 'VERIFICADA'/);
      return true;
    }
  );
  console.log("✓ Escenario 14: Prevención de doble aplicación contable confirmada.");
}

console.log("\n=======================================================");
console.log("LOS 14 ESCENARIOS DE PagosCarteraService PASARON CON ÉXITO.");
console.log("=======================================================\n");
