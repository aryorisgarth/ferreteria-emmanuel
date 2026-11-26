/**
 * PRUEBAS UNITARIAS DE DOMINIO — FASE 1.2: CotizacionesService
 * 
 * Cobertura de los 12 escenarios obligatorios:
 * 1. Cotización autorizada.
 * 2. Cotización pendiente de autorización.
 * 3. Precio negociado sin autorización.
 * 4. Intento de autorización por cajero.
 * 5. Venta parcial válida.
 * 6. Sobrefacturación (detección de integridad).
 * 7. Solicitud con líneas duplicadas.
 * 8. Nueva versión con historial facturado.
 * 9. Intento de facturar versión sustituida.
 * 10. Anulación sin reapertura de cantidades.
 * 11. Cálculos monetarios y redondeo (IVA 15%, descuentos, cantidades fraccionarias).
 * 12. Inmutabilidad estricta de objetos originales.
 */

import assert from "node:assert/strict";
import {
  AdaptadorAutorizacionMemoria,
  CotizacionesService,
} from "../../src/lib/domain/cotizaciones/service";
import {
  ErrorAutorizacionCotizacion,
  ErrorTransicionCotizacion,
  type CotizacionVersionada,
  type ReferenciaFacturaLineaCotizada,
  type SesionAutenticadaServidor,
} from "../../src/lib/domain/cotizaciones/types";

console.log("Iniciando pruebas unitarias de CotizacionesService (Fase 1.2)...");

const authAdapter = new AdaptadorAutorizacionMemoria();
const service = new CotizacionesService(authAdapter);

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
// ESCENARIO 1: Cotización autorizada
// ============================================================================
{
  const cotizacionBase: CotizacionVersionada = {
    id: "cot-1",
    numero: "COT-001",
    cliente: "Cliente Uno",
    clienteId: "cli-1",
    fecha: "2026-11-18",
    estado: "PENDIENTE_AUTORIZACION",
    notas: "Nota inicial",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-1",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-1",
        cotizacionId: "cot-1",
        productoId: "prod-1",
        cantidad: 10,
        precio: 100,
        unidadMedida: "UNIDAD",
      },
    ],
  };

  const cotAutorizada = service.autorizarCotizacion(cotizacionBase, sesionDuenio, "Aprobado para volumen");
  assert.equal(cotAutorizada.estado, "AUTORIZADA");
  assert.equal(cotAutorizada.autorizadaPor, "usr-admin-1");
  assert.ok(cotAutorizada.autorizadaEn);
  assert.match(cotAutorizada.notas, /Aprobado para volumen/);
  console.log("✓ Escenario 1: Cotización autorizada por dueño validada.");
}

// ============================================================================
// ESCENARIO 2: Cotización pendiente de autorización (precios negociados)
// ============================================================================
{
  const cotizacionBorrador: CotizacionVersionada = {
    id: "cot-2",
    numero: "COT-002",
    cliente: "Cliente Dos",
    clienteId: "cli-2",
    fecha: "2026-11-18",
    estado: "BORRADOR",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-2",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-2",
        cotizacionId: "cot-2",
        productoId: "prod-cemento",
        cantidad: 20,
        precio: 280, // Negociado, catálogo es 300
        unidadMedida: "BOLSA",
      },
    ],
  };

  const catalogo = new Map([["prod-cemento", 300]]);
  const prep = service.prepararParaAutorizacion(cotizacionBorrador, catalogo, sesionCajero);

  assert.equal(prep.requiereAutorizacion, true);
  assert.equal(prep.cotizacion.estado, "PENDIENTE_AUTORIZACION");
  assert.equal(prep.itemsNegociados.length, 1);
  assert.equal(prep.itemsNegociados[0].precioCatalogo, 300);
  assert.equal(prep.itemsNegociados[0].precioSolicitado, 280);
  console.log("✓ Escenario 2: Cotización pendiente de autorización detectada.");
}

// ============================================================================
// ESCENARIO 3: Precio negociado sin autorización
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-3",
    numero: "COT-003",
    cliente: "Cliente Tres",
    clienteId: "cli-3",
    fecha: "2026-11-18",
    estado: "BORRADOR",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-3",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-3",
        cotizacionId: "cot-3",
        productoId: "prod-hierro",
        cantidad: 5,
        precio: 450, // Catálogo es 500
        unidadMedida: "UNIDAD",
      },
    ],
  };

  const catalogo = new Map([["prod-hierro", 500]]);
  const resultado = service.validarPreciosNegociados(cotizacion, catalogo, []);

  assert.equal(resultado.todosValidos, false);
  assert.equal(resultado.resultados[0].valido, false);
  assert.match(resultado.resultados[0].error!, /no cuenta con autorización/);
  console.log("✓ Escenario 3: Precio negociado sin autorización rechazado.");
}

// ============================================================================
// ESCENARIO 4: Intento de autorización por cajero (denegado)
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-4",
    numero: "COT-004",
    cliente: "Cliente Cuatro",
    clienteId: "cli-4",
    fecha: "2026-11-18",
    estado: "PENDIENTE_AUTORIZACION",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-4",
    versionPadreId: null,
    esVersionActual: true,
    items: [],
  };

  assert.throws(
    () => {
      service.autorizarCotizacion(cotizacion, sesionCajero);
    },
    (err: any) => {
      assert.ok(err instanceof ErrorAutorizacionCotizacion);
      assert.match(err.message, /no tiene privilegios de propietario/);
      return true;
    }
  );
  console.log("✓ Escenario 4: Intento de autorización por cajero bloqueado con ErrorAutorizacionCotizacion.");
}

// ============================================================================
// ESCENARIO 5: Venta parcial válida
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-5",
    numero: "COT-005",
    cliente: "Cliente Cinco",
    clienteId: "cli-5",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-5",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-5a",
        cotizacionId: "cot-5",
        productoId: "cemento",
        cantidad: 100,
        precio: 300,
        unidadMedida: "BOLSA",
      },
    ],
  };

  // Historial previo: 30 bolsas ya facturadas
  const historial: ReferenciaFacturaLineaCotizada[] = [
    {
      facturaId: "fac-1",
      facturaNumero: "FAC-001",
      facturaEstado: "EMITIDA",
      cotizacionId: "cot-5",
      cotizacionItemId: "linea-5a",
      productoId: "cemento",
      cantidadFacturada: 30,
      precioUnitario: 300,
      fechaFactura: "2026-11-17",
    },
  ];

  // Solicitud: facturar 40 bolsas adicionales (quedarán 30 pendientes)
  const solicitud = {
    cotizacionId: "cot-5",
    clienteId: "cli-5",
    usuario: "cajero",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-5a", cantidadAFacturar: 40 }],
  };

  const res = service.validarSolicitudFacturacion(cotizacion, historial, solicitud);
  assert.equal(res.valida, true);
  assert.equal(res.subtotal, 12000); // 40 * 300
  assert.equal(res.iva, 1800);       // 12000 * 0.15
  assert.equal(res.total, 13800);
  assert.equal(res.itemsValidados[0].cantidadPendienteRestante, 30);
  assert.equal(res.todosSaldosLiquidados, false);
  console.log("✓ Escenario 5: Venta parcial válida calculada correctamente.");
}

// ============================================================================
// ESCENARIO 6: Sobrefacturación (detección de integridad)
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-6",
    numero: "COT-006",
    cliente: "Cliente Seis",
    clienteId: "cli-6",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-6",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-6",
        cotizacionId: "cot-6",
        productoId: "varilla",
        cantidad: 10,
        precio: 150,
        unidadMedida: "UNIDAD",
      },
    ],
  };

  // Historial corrupto/anómalo donde se facturaron 12 unidades de 10 cotizadas
  const historialSobrefacturado: ReferenciaFacturaLineaCotizada[] = [
    {
      facturaId: "fac-x",
      facturaNumero: "FAC-999",
      facturaEstado: "EMITIDA",
      cotizacionId: "cot-6",
      cotizacionItemId: "linea-6",
      productoId: "varilla",
      cantidadFacturada: 12,
      precioUnitario: 150,
      fechaFactura: "2026-11-17",
    },
  ];

  const saldos = service.calcularSaldos(cotizacion, historialSobrefacturado);
  assert.equal(saldos.tieneInconsistencias, true);
  assert.ok(saldos.inconsistencias && saldos.inconsistencias.length > 0);
  assert.match(saldos.inconsistencias[0], /excede la cotizada/);

  // Intentar facturar sobre esta cotización debe fallar de inmediato
  const sol = {
    cotizacionId: "cot-6",
    clienteId: "cli-6",
    usuario: "cajero",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-6", cantidadAFacturar: 1 }],
  };
  const val = service.validarSolicitudFacturacion(cotizacion, historialSobrefacturado, sol);
  assert.equal(val.valida, false);
  assert.ok(val.errores && val.errores.some((e) => /Anomalía de integridad/.test(e)));
  console.log("✓ Escenario 6: Detección y rechazo por sobrefacturación histórica validado.");
}

// ============================================================================
// ESCENARIO 7: Solicitud con líneas duplicadas (rechazada)
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-7",
    numero: "COT-007",
    cliente: "Cliente Siete",
    clienteId: "cli-7",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-7",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-7",
        cotizacionId: "cot-7",
        productoId: "arena",
        cantidad: 50,
        precio: 400,
        unidadMedida: "METRO_CUBICO",
      },
    ],
  };

  const solDuplicada = {
    cotizacionId: "cot-7",
    clienteId: "cli-7",
    usuario: "cajero",
    fecha: "2026-11-18",
    items: [
      { cotizacionItemId: "linea-7", cantidadAFacturar: 10 },
      { cotizacionItemId: "linea-7", cantidadAFacturar: 15 }, // Repetido
    ],
  };

  const res = service.validarSolicitudFacturacion(cotizacion, [], solDuplicada);
  assert.equal(res.valida, false);
  assert.ok(res.errores && res.errores.some((e) => /líneas duplicadas/.test(e)));
  console.log("✓ Escenario 7: Solicitud con líneas duplicadas rechazada.");
}

// ============================================================================
// ESCENARIO 8: Nueva versión con historial facturado
// ============================================================================
{
  const cotizacionV1: CotizacionVersionada = {
    id: "cot-8-v1",
    numero: "COT-008",
    cliente: "Constructora Alfa",
    clienteId: "cli-8",
    fecha: "2026-11-10",
    estado: "PARCIALMENTE_FACTURADA",
    notas: "Inicial",
    creadoPor: "vendedor",
    facturaId: "fac-prev",
    version: 1,
    cotizacionRaizId: "cot-8-v1",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-8-cemento",
        cotizacionId: "cot-8-v1",
        productoId: "cemento",
        cantidad: 100,
        precio: 320,
        unidadMedida: "BOLSA",
      },
    ],
  };

  const historial = [
    {
      facturaId: "fac-prev",
      facturaNumero: "F-001",
      facturaEstado: "PAGADA" as const,
      cotizacionId: "cot-8-v1",
      cotizacionItemId: "linea-8-cemento",
      productoId: "cemento",
      cantidadFacturada: 40,
      precioUnitario: 320,
      fechaFactura: "2026-11-12",
    },
  ];

  // Se renegocian los 60 restantes para aumentar a 80 con nuevo precio
  const { versionActualSustituida, nuevaVersion } = service.prepararNuevaVersionInmutable(
    cotizacionV1,
    historial,
    {
      nuevoId: "cot-8-v2",
      nuevoNumero: "COT-008-V2",
      fecha: "2026-11-18",
      sesion: sesionDuenio,
      motivo: "Ajuste de volumen sobre saldo pendiente",
      nuevosItemsPendientes: [
        {
          id: "linea-8-v2-cemento", // ID nuevo estricto
          productoId: "cemento",
          cantidad: 80,
          precio: 310,
          unidadMedida: "BOLSA",
        },
      ],
    }
  );

  assert.equal(versionActualSustituida.estado, "SUSTITUIDA");
  assert.equal(versionActualSustituida.esVersionActual, false);

  assert.equal(nuevaVersion.version, 2);
  assert.equal(nuevaVersion.cotizacionRaizId, "cot-8-v1");
  assert.equal(nuevaVersion.versionPadreId, "cot-8-v1");
  assert.equal(nuevaVersion.esVersionActual, true);
  assert.equal(nuevaVersion.estado, "PENDIENTE_AUTORIZACION");
  assert.equal(nuevaVersion.items.length, 1);
  assert.equal(nuevaVersion.items[0].id, "linea-8-v2-cemento");
  assert.equal(nuevaVersion.items[0].cantidad, 80);
  assert.equal(nuevaVersion.items[0].precio, 310);
  console.log("✓ Escenario 8: Nueva versión con historial facturado creada limpiamente.");
}

// ============================================================================
// ESCENARIO 9: Intento de facturar versión sustituida (rechazado)
// ============================================================================
{
  const cotizacionSustituida: CotizacionVersionada = {
    id: "cot-9",
    numero: "COT-009",
    cliente: "Cliente Nueve",
    clienteId: "cli-9",
    fecha: "2026-11-10",
    estado: "SUSTITUIDA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-9",
    versionPadreId: null,
    esVersionActual: false,
    items: [
      {
        id: "linea-9",
        cotizacionId: "cot-9",
        productoId: "cemento",
        cantidad: 50,
        precio: 300,
        unidadMedida: "BOLSA",
      },
    ],
  };

  const sol = {
    cotizacionId: "cot-9",
    clienteId: "cli-9",
    usuario: "cajero",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-9", cantidadAFacturar: 10 }],
  };

  const res = service.validarSolicitudFacturacion(cotizacionSustituida, [], sol);
  assert.equal(res.valida, false);
  assert.ok(res.errores && res.errores.some((e) => /versión sustituida o inactiva/.test(e)));

  const prepPOS = service.prepararDatosParaPOS(cotizacionSustituida, []);
  assert.equal(prepPOS.esFacturable, false);
  assert.match(prepPOS.motivoNoFacturable!, /sustituida o inactiva/);
  console.log("✓ Escenario 9: Intento de facturar versión sustituida bloqueado.");
}

// ============================================================================
// ESCENARIO 10: Anulación sin reapertura de cantidades
// ============================================================================
{
  const cotizacion: CotizacionVersionada = {
    id: "cot-10",
    numero: "COT-010",
    cliente: "Cliente Diez",
    clienteId: "cli-10",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-10",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-10",
        cotizacionId: "cot-10",
        productoId: "tubo-pvc",
        cantidad: 20,
        precio: 250,
        unidadMedida: "UNIDAD",
      },
    ],
  };

  // Se emitió una factura de 15 tubos que posteriormente fue ANULADA en el módulo de ventas
  const historialConAnulada: ReferenciaFacturaLineaCotizada[] = [
    {
      facturaId: "fac-anulada-1",
      facturaNumero: "FAC-ANULADA-001",
      facturaEstado: "ANULADA",
      cotizacionId: "cot-10",
      cotizacionItemId: "linea-10",
      productoId: "tubo-pvc",
      cantidadFacturada: 15, // Consumida
      precioUnitario: 250,
      fechaFactura: "2026-11-17",
    },
  ];

  // Regla definitiva: La anulación NO reabre los 15 tubos a la cotización
  const saldos = service.calcularSaldos(cotizacion, historialConAnulada);
  assert.equal(saldos.items[0].cantidadFacturada, 15);
  assert.equal(saldos.items[0].cantidadPendiente, 5, "El saldo pendiente legítimo debe ser 5, no 20.");
  console.log("✓ Escenario 10: Anulación sin reapertura de cantidades cotizadas confirmada.");
}

// ============================================================================
// ESCENARIO 11: Cálculos monetarios, IVA 15%, descuentos y cantidades fraccionarias
// ============================================================================
{
  const cotizacionFracc: CotizacionVersionada = {
    id: "cot-11",
    numero: "COT-011",
    cliente: "Cliente Once",
    clienteId: "cli-11",
    fecha: "2026-11-18",
    estado: "AUTORIZADA",
    notas: "",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-11",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-fracc-1",
        cotizacionId: "cot-11",
        productoId: "cable-electrico",
        cantidad: 15.75, // Fraccionario
        precio: 42.5,   // Decimal
        descuento: 2.5, // Descuento unitario (Precio efectivo = 40.0)
        unidadMedida: "METRO",
        exentoIva: false,
      },
      {
        id: "linea-fracc-2",
        cotizacionId: "cot-11",
        productoId: "medicina-industrial",
        cantidad: 2.5,
        precio: 120.0,
        unidadMedida: "CAJA",
        exentoIva: true, // Exento de IVA
      },
    ],
  };

  const saldos = service.calcularSaldos(cotizacionFracc, []);
  // Línea 1: 15.75 * 40.0 = 630.00. IVA (15%): 94.50. Total: 724.50
  // Línea 2: 2.5 * 120.0 = 300.00. IVA (exento): 0.00. Total: 300.00
  // Subtotal global: 930.00. IVA global: 94.50. Total global: 1024.50
  assert.equal(saldos.subtotalOriginal, 930.0);
  assert.equal(saldos.totalOriginal, 1024.5);

  // Facturar parcialmente solo 10.25 metros de cable
  const sol = {
    cotizacionId: "cot-11",
    clienteId: "cli-11",
    usuario: "cajero",
    fecha: "2026-11-18",
    items: [{ cotizacionItemId: "linea-fracc-1", cantidadAFacturar: 10.25 }],
  };

  const res = service.validarSolicitudFacturacion(cotizacionFracc, [], sol);
  assert.equal(res.valida, true);
  // 10.25 * 40.0 = 410.00. IVA: 61.50. Total: 471.50
  assert.equal(res.subtotal, 410.0);
  assert.equal(res.iva, 61.5);
  assert.equal(res.total, 471.5);
  assert.equal(res.itemsValidados[0].cantidadPendienteRestante, 5.5);
  console.log("✓ Escenario 11: Cálculos monetarios, IVA, descuentos y fraccionarios exactos.");
}

// ============================================================================
// ESCENARIO 12: Inmutabilidad estricta de objetos originales
// ============================================================================
{
  const cotizacionOriginal: CotizacionVersionada = {
    id: "cot-12",
    numero: "COT-012",
    cliente: "Cliente Doce",
    clienteId: "cli-12",
    fecha: "2026-11-18",
    estado: "PENDIENTE_AUTORIZACION",
    notas: "Original intacto",
    creadoPor: "vendedor",
    facturaId: null,
    version: 1,
    cotizacionRaizId: "cot-12",
    versionPadreId: null,
    esVersionActual: true,
    items: [
      {
        id: "linea-12",
        cotizacionId: "cot-12",
        productoId: "prod-x",
        cantidad: 10,
        precio: 100,
        unidadMedida: "UNIDAD",
      },
    ],
  };

  // Congelar objeto para comprobar que ninguna función muta la entrada
  const copiaCongelada = Object.freeze(structuredClone(cotizacionOriginal));
  Object.freeze(copiaCongelada.items);
  Object.freeze(copiaCongelada.items[0]);

  const autorizada = service.autorizarCotizacion(copiaCongelada, sesionDuenio, "Autorizado");

  assert.equal(cotizacionOriginal.estado, "PENDIENTE_AUTORIZACION", "El original debe conservar su estado intacto.");
  assert.equal(autorizada.estado, "AUTORIZADA", "La copia retornada debe tener el nuevo estado.");
  assert.notEqual(cotizacionOriginal, autorizada, "Deben ser referencias en memoria distintas.");

  console.log("✓ Escenario 12: Inmutabilidad estricta de objetos originales comprobada.");
}

console.log("\n=======================================================");
console.log("LOS 12 ESCENARIOS DE CotizacionesService PASARON EXITOSAMENTE.");
console.log("=======================================================\n");
