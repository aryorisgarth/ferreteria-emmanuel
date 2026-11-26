/**
 * PRUEBAS UNITARIAS PURAS — DOMINIO COMERCIAL DE COTIZACIONES
 * Fase 1.1: Validación aislada sin base de datos ni efectos secundarios.
 */

import assert from "node:assert/strict";
import {
  calcularSaldosCotizacion,
  calcularSaldosLinea,
  generarBorradorNuevaVersion,
  redondearCantidad,
  redondearMoneda,
  validarPrecioAutorizado,
  validarSolicitudFacturacionParcial,
} from "../../src/lib/domain/cotizaciones/pure";
import type {
  AutorizacionPrecio,
  CotizacionVersionada,
  LineaCotizadaDominio,
} from "../../src/lib/domain/cotizaciones/types";

console.log("Iniciando pruebas unitarias de Fase 1.1 (Dominio de Cotizaciones)...");

// ============================================================================
// 1. PRUEBAS DE REDONDEO MONETARIO Y CANTIDADES
// ============================================================================
{
  assert.equal(redondearMoneda(10.555), 10.56, "Redondeo a 2 decimales hacia arriba");
  assert.equal(redondearMoneda(10.554), 10.55, "Redondeo a 2 decimales hacia abajo");
  assert.equal(redondearCantidad(1.00004, 4), 1.0, "Redondeo de cantidades a 4 decimales");
  assert.equal(redondearCantidad(1.00006, 4), 1.0001, "Redondeo de cantidades a 4 decimales");
  console.log("✓ Redondeo y precisión matemática validados.");
}

// ============================================================================
// 2. PRUEBAS DE SALDOS DE LÍNEA Y EVITACIÓN DE CANTIDADES NEGATIVAS
// ============================================================================
{
  const item: LineaCotizadaDominio = {
    id: "item-1",
    cotizacionId: "cot-1",
    productoId: "prod-cemento",
    cantidad: 100,
    precio: 350.0,
    unidadMedida: "BOLSA",
  };

  // Escenario A: Sin facturas previas
  const saldoInicial = calcularSaldosLinea(item, []);
  assert.equal(saldoInicial.cantidadFacturada, 0);
  assert.equal(saldoInicial.cantidadPendiente, 100);
  assert.equal(saldoInicial.estaCompletamenteFacturada, false);
  assert.equal(saldoInicial.subtotalLineaPendiente, 35000.0);

  // Escenario B: Con factura parcial previa (40 unidades)
  const saldoParcial = calcularSaldosLinea(item, [
    { cotizacionItemId: "item-1", cantidadFacturada: 40 },
  ]);
  assert.equal(saldoParcial.cantidadFacturada, 40);
  assert.equal(saldoParcial.cantidadPendiente, 60);
  assert.equal(saldoParcial.estaCompletamenteFacturada, false);
  assert.equal(saldoParcial.subtotalLineaPendiente, 21000.0);

  // Escenario C: Facturación acumulada total (40 + 60 unidades)
  const saldoTotal = calcularSaldosLinea(item, [
    { cotizacionItemId: "item-1", cantidadFacturada: 40 },
    { cotizacionItemId: "item-1", cantidadFacturada: 60 },
  ]);
  assert.equal(saldoTotal.cantidadFacturada, 100);
  assert.equal(saldoTotal.cantidadPendiente, 0);
  assert.equal(saldoTotal.estaCompletamenteFacturada, true);
  assert.equal(saldoTotal.subtotalLineaPendiente, 0);

  // Escenario D: Evitar cantidades negativas si se registrara sobrefacturación
  const saldoExceso = calcularSaldosLinea(item, [
    { cotizacionItemId: "item-1", cantidadFacturada: 110 },
  ]);
  assert.equal(saldoExceso.cantidadFacturada, 110);
  assert.equal(saldoExceso.cantidadPendiente, 0, "No debe permitir saldo negativo");
  assert.equal(saldoExceso.estaCompletamenteFacturada, true);

  console.log("✓ Cálculo de saldos de línea y control de cantidades negativas validados.");
}

// ============================================================================
// 3. PRUEBAS DE SALDOS GLOBALES DE COTIZACIÓN
// ============================================================================
{
  const cotizacionV1: CotizacionVersionada = {
    id: "cot-100",
    numero: "COT-2026-0001",
    cliente: "Constructora del Norte",
    clienteId: "cli-1",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "Entrega por fases",
    creadoPor: "vendedor1",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-100",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-1",
        cotizacionId: "cot-100",
        productoId: "cemento",
        cantidad: 50,
        precio: 300,
        unidadMedida: "BOLSA",
        exentoIva: false,
      },
      {
        id: "linea-2",
        cotizacionId: "cot-100",
        productoId: "arena",
        cantidad: 10,
        precio: 500,
        unidadMedida: "METRO_CUBICO",
        exentoIva: false,
      },
    ],
  };

  const historial = [
    { cotizacionItemId: "linea-1", cantidadFacturada: 25 }, // 25 cementos facturados
  ];

  const resumen = calcularSaldosCotizacion(cotizacionV1, historial);
  assert.equal(resumen.estaParcialmenteFacturada, true);
  assert.equal(resumen.estaTotalmenteFacturada, false);
  assert.equal(resumen.tieneSaldosPendientes, true);
  assert.equal(resumen.subtotalOriginal, 20000.0); // (50*300) + (10*500) = 15000 + 5000
  assert.equal(resumen.subtotalFacturado, 7500.0);  // 25 * 300
  assert.equal(resumen.subtotalPendiente, 12500.0); // (25*300) + (10*500)
  assert.equal(resumen.totalPendiente, 14375.0);    // 12500 * 1.15

  console.log("✓ Resumen global de saldos e impuestos de cotización validado.");
}

// ============================================================================
// 4. PRUEBAS DE VALIDACIÓN DE FACTURACIÓN PARCIAL
// ============================================================================
{
  const cotizacionV1: CotizacionVersionada = {
    id: "cot-100",
    numero: "COT-2026-0001",
    cliente: "Constructora del Norte",
    clienteId: "cli-1",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor1",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-100",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-1",
        cotizacionId: "cot-100",
        productoId: "cemento",
        cantidad: 50,
        precio: 300,
        unidadMedida: "BOLSA",
      },
    ],
  };

  const saldos = calcularSaldosCotizacion(cotizacionV1, [
    { cotizacionItemId: "linea-1", cantidadFacturada: 20 },
  ]); // Quedan 30 pendientes

  // Intento 1: Facturar 15 (Válido, no excede lo pendiente)
  const valValida = validarSolicitudFacturacionParcial(cotizacionV1, saldos, {
    cotizacionId: "cot-100",
    clienteId: "cli-1",
    usuario: "cajero1",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-1", cantidadAFacturar: 15 }],
  });
  assert.equal(valValida.valida, true);
  assert.equal(valValida.subtotal, 4500.0); // 15 * 300
  assert.equal(valValida.iva, 675.0);       // 4500 * 0.15
  assert.equal(valValida.total, 5175.0);
  assert.equal(valValida.itemsValidados[0].cantidadPendienteRestante, 15);
  assert.equal(valValida.todosSaldosLiquidados, false);

  // Intento 2: Facturar 35 (Inválido, supera los 30 pendientes)
  const valExcedida = validarSolicitudFacturacionParcial(cotizacionV1, saldos, {
    cotizacionId: "cot-100",
    clienteId: "cli-1",
    usuario: "cajero1",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-1", cantidadAFacturar: 35 }],
  });
  assert.equal(valExcedida.valida, false);
  assert.ok(valExcedida.errores && valExcedida.errores.length > 0);
  assert.match(valExcedida.errores[0], /supera el saldo (disponible|pendiente)/);

  // Intento 3: Facturar desde versión inactiva (esVersionActual = false)
  const cotizacionInactiva: CotizacionVersionada = {
    ...cotizacionV1,
    esVersionActual: false,
    estado: "SUSTITUIDA",
  };
  const valInactiva = validarSolicitudFacturacionParcial(cotizacionInactiva, saldos, {
    cotizacionId: "cot-100",
    clienteId: "cli-1",
    usuario: "cajero1",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-1", cantidadAFacturar: 10 }],
  });
  assert.equal(valInactiva.valida, false);
  assert.match(valInactiva.errores![0], /versión sustituida o inactiva/);

  console.log("✓ Reglas de validación de facturación parcial validadas.");
}

// ============================================================================
// 5. PRUEBAS DE AUTORIZACIÓN DE PRECIOS POR DUEÑOS
// ============================================================================
{
  const precioCatalogo = 400.0;

  // Caso 1: Precio estándar de catálogo -> Válido sin autorización
  const resCat = validarPrecioAutorizado(
    { productoId: "p1", precioSolicitado: 400.0 },
    precioCatalogo
  );
  assert.equal(resCat.valido, true);
  assert.equal(resCat.esPrecioNegociado, false);

  // Caso 2: Precio con descuento sin autorización -> Inválido
  const resSinAuth = validarPrecioAutorizado(
    { productoId: "p1", precioSolicitado: 350.0 },
    precioCatalogo,
    null
  );
  assert.equal(resSinAuth.valido, false);
  assert.match(resSinAuth.error!, /no cuenta con autorización/);

  // Caso 3: Autorización emitida por un rol que no es dueño ('vendedor' o 'cajero') -> Inválido
  const authInvalidaRol = {
    productoId: "p1",
    precioAutorizado: 350.0,
    autorizadoPor: "vendedor_juan",
    rolAutorizador: "cajero" as any,
    fechaAutorizacion: "2026-11-18",
  };
  const resRolInvalido = validarPrecioAutorizado(
    { productoId: "p1", precioSolicitado: 350.0 },
    precioCatalogo,
    authInvalidaRol
  );
  assert.equal(resRolInvalido.valido, false);
  assert.match(resRolInvalido.error!, /Solo los usuarios con rol de dueño/);

  // Caso 4: Autorización emitida por dueño ('admin') -> Válido
  const authValida: AutorizacionPrecio = {
    productoId: "p1",
    precioAutorizado: 350.0,
    autorizadoPor: "propietario_pedro",
    rolAutorizador: "admin",
    fechaAutorizacion: "2026-11-18",
    motivo: "Cliente de volumen frecuente",
  };
  const resValida = validarPrecioAutorizado(
    { productoId: "p1", precioSolicitado: 350.0 },
    precioCatalogo,
    authValida
  );
  assert.equal(resValida.valido, true);
  assert.equal(resValida.esPrecioNegociado, true);
  assert.equal(resValida.precioFinal, 350.0);
  assert.equal(resValida.autorizacionAplicada?.autorizadoPor, "propietario_pedro");

  console.log("✓ Autorización exclusiva de precios por dueños ('admin') validada.");
}

// ============================================================================
// 6. PRUEBAS DE VERSIONADO INMUTABLE SIN DUPLICACIÓN
// ============================================================================
{
  const cotizacionV1: CotizacionVersionada = {
    id: "cot-raiz",
    numero: "COT-2026-0005",
    cliente: "Constructora San Jerónimo",
    clienteId: "cli-2",
    fecha: "2026-11-15",
    estado: "PARCIALMENTE_FACTURADA",
    notas: "Cotización base",
    creadoPor: "vendedor1",
    facturaId: "fac-001",
    version: 1,
    cotizacionRaizId: "cot-raiz",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-1",
        cotizacionId: "cot-raiz",
        productoId: "cemento",
        cantidad: 100,
        precio: 320,
        unidadMedida: "BOLSA",
      },
    ],
  };

  const saldosV1 = calcularSaldosCotizacion(cotizacionV1, [
    { cotizacionItemId: "linea-1", cantidadFacturada: 40 }, // 40 ya facturados
  ]);

  // Se solicita modificar el remanente (cliente pide 70 bolsas restantes en vez de 60 a un precio acordado)
  const resultadoVersionado = generarBorradorNuevaVersion(cotizacionV1, saldosV1, {
    nuevoId: "cot-v2",
    nuevoNumero: "COT-2026-0005-V2",
    fecha: "2026-11-18",
    usuario: "vendedor1",
    motivo: "Incremento de 10 bolsas sobre el saldo pendiente",
    nuevosItemsPendientes: [
      {
        id: "linea-v2-1",
        productoId: "cemento",
        cantidad: 70, // Nuevo saldo convenido
        precio: 315, // Precio renegociado
        unidadMedida: "BOLSA",
      },
    ],
  });

  // V1 debe quedar como SUSTITUIDA y no activa
  assert.equal(resultadoVersionado.versionActualSustituida.estado, "SUSTITUIDA");
  assert.equal(resultadoVersionado.versionActualSustituida.esVersionActual, false);

  // V2 debe configurarse con versión 2, ligada a la raíz, activa y pendiente de autorización
  const v2 = resultadoVersionado.nuevaVersion;
  assert.equal(v2.version, 2);
  assert.equal(v2.cotizacionRaizId, "cot-raiz");
  assert.equal(v2.versionPadreId, "cot-raiz");
  assert.equal(v2.esVersionActual, true);
  assert.equal(v2.estado, "PENDIENTE_AUTORIZACION");
  assert.equal(v2.items.length, 1);
  assert.equal(v2.items[0].cantidad, 70);
  assert.equal(v2.items[0].precio, 315);
  // No contiene los 40 ya facturados en V1
  assert.equal(v2.items.some((it) => it.id === "linea-1"), false);

  console.log("✓ Versionado inmutable sin duplicación de cantidades facturadas validado.");
}

console.log("\n=======================================================");
console.log("TODAS LAS PRUEBAS UNITARIAS DE FASE 1.1 PASARON CON ÉXITO.");
console.log("=======================================================\n");
