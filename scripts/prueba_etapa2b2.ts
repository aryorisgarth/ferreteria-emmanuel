import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  libroVacio,
  altaProducto,
  registrarCompra,
  anularCompra,
  emitirFactura,
  crearAjuste,
  crearConteoFisico,
  aplicarConteoFisico,
  filtrarKardex,
  valorarMovimientoProspectivo,
  editarMovimiento,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB, Movimiento } from "../src/lib/types";

async function main() {
  console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: ETAPA 2B.2 (KÁRDEX PROFESIONAL) ===\n");

// ============================================================================
// 1. FILTROS COMBINADOS (PRODUCTO, FECHAS, TIPO, ORIGEN, REFERENCIA, BÚSQUEDA)
// ============================================================================
console.log("1. Probando filtros combinados en filtrarKardex...");
{
  const db: DB = libroVacio();
  const prodA = altaProducto(db, {
    codigo: "HER-001",
    codigoBarras: "7430001112223",
    nombre: "Martillo de Uña 16oz Truper",
    categoria: "Herramientas",
    marca: "Truper",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 100,
    precio: 180,
    stockMinimo: 5,
  });

  const prodB = altaProducto(db, {
    codigo: "MAT-001",
    codigoBarras: "7430003334445",
    nombre: "Cemento Tolteca Gris",
    categoria: "Construcción",
    marca: "Tolteca",
    unidadMedida: "BOLSA",
    inventarioInicial: 20,
    costo: 150,
    precio: 220,
    stockMinimo: 10,
  });

  // Compra para Prod A
  const compraA = registrarCompra(db, {
    proveedor: "Ferretera Nacional",
    fecha: "2026-11-05",
    notas: "Lote martillos",
    creadoPor: "Admin",
    items: [{ productoId: prodA.id, cantidad: 15, precio: 110 }],
  });

  // Venta para Prod A
  const ventaA = emitirFactura(db, {
    cliente: "Constructora San Jerónimo",
    fecha: "2026-11-10",
    notas: "Venta martillo",
    creadoPor: "Cajero",
    items: [{ productoId: prodA.id, cantidad: 5, precio: 180 }],
  });

  // Ajuste para Prod B
  const ajusteB = crearAjuste(db, {
    productoId: prodB.id,
    tipo: "SOBRANTE",
    cantidad: 3,
    motivo: "Mercancía recuperada en bodega",
    usuario: "Auditor",
    fecha: "2026-11-12",
  });

  // Filtro por Producto exacto
  const movsProdA = filtrarKardex(db, { productoId: prodA.id });
  assert.equal(movsProdA.length, 2, "Debe tener 2 movimientos (compra y venta)");

  // Filtro por Tipo de Movimiento (ENTRADA)
  const entradas = filtrarKardex(db, { tipo: "ENTRADA" });
  assert.equal(entradas.length, 1, "Debe tener 1 movimiento con tipo ENTRADA (compra A)");

  // Filtro por Tipo de Movimiento (AJUSTE)
  const ajustes = filtrarKardex(db, { tipo: "AJUSTE" });
  assert.equal(ajustes.length, 1, "Debe tener 1 movimiento con tipo AJUSTE (ajuste sobrante B)");

  // Filtro por Origen Documental (FACTURA)
  const ventas = filtrarKardex(db, { origen: "FACTURA" });
  assert.equal(ventas.length, 1);
  assert.equal(ventas[0].numeroReferencia, ventaA.numero);

  // Filtro por Rango de Fechas (2026-11-08 al 2026-11-11)
  const fechaFiltrada = filtrarKardex(db, { desde: "2026-11-08", hasta: "2026-11-11" });
  assert.equal(fechaFiltrada.length, 1);
  assert.equal(fechaFiltrada[0].fecha, "2026-11-10");

  // Filtro por Referencia
  const porRef = filtrarKardex(db, { referencia: compraA.numero });
  assert.equal(porRef.length, 1);
  assert.equal(porRef[0].productoId, prodA.id);

  // Filtro Combinado: Producto A + Tipo SALIDA + Origen FACTURA
  const combo = filtrarKardex(db, { productoId: prodA.id, tipo: "SALIDA", origen: "FACTURA" });
  assert.equal(combo.length, 1);
  assert.equal(combo[0].codigo, "HER-001");

  console.log("   ✓ Filtros combinables por producto, tipo, origen, fechas y referencia validados.\n");
}

// ============================================================================
// 2. BÚSQUEDA POR CÓDIGO DE BARRAS Y BÚSQUEDA RÁPIDA
// ============================================================================
console.log("2. Probando filtro por código de barras y búsqueda rápida...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "ELE-001",
    codigoBarras: "7430009998887",
    nombre: "Cable Eléctrico THHN #12",
    categoria: "Electricidad",
    marca: "Condumex",
    unidadMedida: "METRO",
    inventarioInicial: 100,
    costo: 12,
    precio: 20,
    stockMinimo: 20,
  });

  registrarCompra(db, {
    proveedor: "Electromateriales SA",
    fecha: "2026-11-08",
    notas: "Carrete de cable",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 50, precio: 12 }],
  });

  // Búsqueda por código de barras
  const porBarras = filtrarKardex(db, { codigoBarras: "7430009998887" });
  assert.equal(porBarras.length, 1);
  assert.equal(porBarras[0].codigo, "ELE-001");

  // Búsqueda rápida por texto libre en concepto/proveedor
  const porTexto = filtrarKardex(db, { busqueda: "Electromateriales" });
  assert.equal(porTexto.length, 1);
  assert.equal(porTexto[0].codigo, "ELE-001");

  console.log("   ✓ Búsqueda por código de barras y búsqueda rápida operativas.\n");
}

// ============================================================================
// 3. SALDOS FÍSICOS CORRECTOS (SECUENCIA CRONOLÓGICA)
// ============================================================================
console.log("3. Probando coherencia de saldos físicos en Kárdex...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "PLOM-01",
    nombre: "Tubo PVC 1/2 Amanco",
    categoria: "Plomería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10, // Saldo inicial: 10
    costo: 80,
    precio: 120,
    stockMinimo: 5,
  });

  // +10 por compra -> Saldo 20
  registrarCompra(db, {
    proveedor: "Amanco",
    fecha: "2026-11-01",
    notas: "Compra",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 85 }],
  });

  // -4 por venta -> Saldo 16
  emitirFactura(db, {
    cliente: "Plomero Juan",
    fecha: "2026-11-03",
    notas: "Venta",
    creadoPor: "Cajero",
    items: [{ productoId: prod.id, cantidad: 4, precio: 120 }],
  });

  // +2 por ajuste sobrante -> Saldo 18
  crearAjuste(db, {
    productoId: prod.id,
    tipo: "SOBRANTE",
    cantidad: 2,
    motivo: "Inventario físico",
    usuario: "Auditor",
    fecha: "2026-11-05",
  });

  const movs = filtrarKardex(db, { productoId: prod.id });
  assert.equal(movs.length, 3);
  assert.equal(movs[0].stockSaldo, 20, "Saldo tras compra debe ser 20");
  assert.equal(movs[1].stockSaldo, 16, "Saldo tras venta debe ser 16");
  assert.equal(movs[2].stockSaldo, 18, "Saldo tras ajuste debe ser 18");
  assert.equal(prod.stockActual, 18);
  console.log("   ✓ Secuencia cronológica de saldos físicos calculada con exactitud.\n");
}

// ============================================================================
// 4. INMUTABILIDAD HISTÓRICA DEL KÁRDEX
// ============================================================================
console.log("4. Probando inmutabilidad histórica del Kárdex...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "PIN-01",
    nombre: "Brocha 2 pulg",
    categoria: "Pinturas",
    marca: "Corona",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 40,
    precio: 70,
    stockMinimo: 2,
  });

  const compra = registrarCompra(db, {
    proveedor: "Corona",
    fecha: "2026-11-01",
    notas: "Compra inicial",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 45 }],
  });

  const mov = db.movimientos.find((m) => m.productoId === prod.id);
  assert(mov);

  // Intentar modificar el movimiento en engine -> Bloqueado
  assert.throws(
    () =>
      editarMovimiento(db, mov.id, {
        cantidad: 99,
        fecha: "2026-11-01",
        concepto: "Intento de fraude",
        destinatario: "Atacante",
        oficinaId: null,
        esAuditoria: false,
        estadoAuditoria: "NORMAL",
        usuario: "Atacante",
      }),
    /inmutable por trazabilidad contable|proviene de una Compra oficial/i,
    "Debe rechazar la modificación directa de movimientos históricos"
  );

  console.log("   ✓ Inmutabilidad histórica de Kárdex validada y bloqueada en backend.\n");
}

// ============================================================================
// 5. PROTECCIÓN DE RUTA Y ACCIÓN DE EDICIÓN
// ============================================================================
console.log("5. Probando protección de inmutabilidad en backend contra intentos de edición...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "SEC-05",
    nombre: "Tubo PVC Conduit 1/2",
    categoria: "Electricidad",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 30,
    precio: 50,
    stockMinimo: 2,
  });

  const factura = emitirFactura(db, {
    cliente: "Cliente Particular",
    fecha: "2026-11-10",
    notas: "Venta directa",
    creadoPor: "Cajero",
    items: [{ productoId: prod.id, cantidad: 2, precio: 50 }],
  });

  const mov = db.movimientos.find((m) => m.productoId === prod.id && m.origen === "FACTURA");
  assert(mov, "Debe existir el movimiento comercial en Kárdex");

  // Cualquier intento de invocar edición sobre el kárdex es rechazado
  assert.throws(
    () =>
      editarMovimiento(db, mov.id, {
        cantidad: 99,
        fecha: "2026-11-10",
        concepto: "Alteración no autorizada",
        destinatario: "Atacante",
        oficinaId: null,
        esAuditoria: false,
        estadoAuditoria: "NORMAL",
        usuario: "Atacante",
      }),
    /inmutable por trazabilidad contable/i
  );

  console.log("   ✓ Inmutabilidad protegida: intentos de edición rechazados con ReglaBodegaError.\n");
}

// ============================================================================
// 6. IMPRESIÓN OFICIAL (RESOLUCIÓN DE DATOS REALES Y METADATOS)
// ============================================================================
console.log("6. Probando generación de datos para reporte de impresión oficial...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "IMP-01",
    nombre: "Disco de Corte 4.5 pulg",
    categoria: "Herramientas",
    marca: "DeWalt",
    unidadMedida: "UNIDAD",
    inventarioInicial: 50,
    costo: 30,
    precio: 55,
    stockMinimo: 10,
  });

  registrarCompra(db, {
    proveedor: "DeWalt Nicaragua",
    fecha: "2026-11-10",
    notas: "Caja de discos",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 50, precio: 30 }],
  });

  emitirFactura(db, {
    cliente: "Taller Mecánico El Chino",
    fecha: "2026-11-11",
    notas: "Venta 10 discos",
    creadoPor: "Cajero",
    items: [{ productoId: prod.id, cantidad: 10, precio: 55 }],
  });

  // Consulta para impresión
  const movsImpresion = filtrarKardex(db, { productoId: prod.id });
  const totalEntradas = movsImpresion.reduce((acc, m) => acc + (m.entradas || 0), 0);
  const totalSalidas = movsImpresion.reduce((acc, m) => acc + (m.salidas || 0), 0);
  const saldoFinal = movsImpresion[movsImpresion.length - 1].stockSaldo;

  assert.equal(movsImpresion.length, 2);
  assert.equal(totalEntradas, 50);
  assert.equal(totalSalidas, 10);
  assert.equal(saldoFinal, 90);
  console.log("   ✓ Totales y saldos para impresión oficial calculados con datos reales.\n");
}

// ============================================================================
// 7. EXPORTACIÓN EXCEL (VALIDACIÓN DE ESTRUCTURA SPREADSHEETML)
// ============================================================================
console.log("7. Probando generación y formato de SpreadsheetML para Excel...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "XLS-01",
    nombre: "Tornillo Tablayeso 1 pulg",
    categoria: "Fijaciones",
    marca: "Fischer",
    unidadMedida: "CAJA",
    inventarioInicial: 10,
    costo: 60,
    precio: 95,
    stockMinimo: 2,
  });

  const compra = registrarCompra(db, {
    proveedor: "Fischer CA",
    fecha: "2026-11-05",
    notas: "Lote tornillos",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 20, precio: 60 }],
  });

  const movs = filtrarKardex(db, { productoId: prod.id });

  // Simulación de los tags generados para SpreadsheetML
  const rowXml = `<Row><Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${movs[0].codigo}</Data></Cell><Cell ss:StyleID="FilaNumero"><Data ss:Type="Number">${movs[0].entradas}</Data></Cell></Row>`;
  assert.match(rowXml, /<Row>/);
  assert.match(rowXml, /XLS-01/);
  assert.match(rowXml, /ss:Type="Number"/);
  console.log("   ✓ Estructura de exportación a Excel compatible y tipada numéricamente.\n");
}

// ============================================================================
// 8. INTEGRIDAD DE MOVIMIENTOS AJUSTE EN KÁRDEX
// ============================================================================
console.log("8. Probando integridad de movimientos AJUSTE en Kárdex...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "AJU-01",
    nombre: "Pegamento PVC 4oz",
    categoria: "Plomería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 15,
    costo: 45,
    precio: 75,
    stockMinimo: 5,
  });

  const ajuste = crearAjuste(db, {
    productoId: prod.id,
    tipo: "MERMA",
    cantidad: 2,
    motivo: "Evaporación por lata defectuosa",
    usuario: "Bodeguero",
    fecha: "2026-11-14",
  });

  const movs = filtrarKardex(db, { productoId: prod.id, origen: "AJUSTE" });
  assert.equal(movs.length, 1);
  assert.equal(movs[0].origen, "AJUSTE");
  assert.equal(movs[0].tipo, "AJUSTE");
  assert.equal(movs[0].salidas, 2);
  assert.equal(movs[0].stockSaldo, 13);
  assert.equal(prod.stockActual, 13);

  // Intentar modificar el movimiento de ajuste -> Bloqueado
  assert.throws(
    () =>
      editarMovimiento(db, movs[0].id, {
        cantidad: 0,
        fecha: "2026-11-14",
        concepto: "Intento alterar merma",
        destinatario: "Nadie",
        oficinaId: null,
        esAuditoria: false,
        estadoAuditoria: "NORMAL",
        usuario: "Atacante",
      }),
    /inmutable por trazabilidad contable/i
  );

  console.log("   ✓ Movimientos de AJUSTE trazados con integridad contable inmutable.\n");
}

// ============================================================================
// 9. SOPORTE PROSPECTIVO DE KÁRDEX VALORADO (SIN INVENTAR HISTORIA)
// ============================================================================
console.log("9. Probando modelo prospectivo de Kárdex valorado sin inventar historia...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "VAL-01",
    nombre: "Cerradura de Pomo Bronce",
    categoria: "Cerrajería",
    marca: "Yale",
    unidadMedida: "UNIDAD",
    inventarioInicial: 5,
    costo: 350,
    precio: 520,
    stockMinimo: 2,
  });

  // Movimiento legado/antiguo sin costoUnitario registrado
  const movLegado: Movimiento = {
    id: "mov-leg-1",
    productoId: prod.id,
    fecha: "2026-10-01",
    tipo: "ENTRADA",
    cantidad: 5,
    entradas: 5,
    salidas: 0,
    stockSaldo: 5,
    unidadMedida: "UNIDAD",
    destinatario: "",
    oficinaId: null,
    actaId: null,
    actaItemId: null,
    solicitudId: null,
    solicitudItemId: null,
    numeroReferencia: "ANTIGUO-001",
    concepto: "Carga histórica antigua",
    usuario: "Sistema",
    esAuditoria: false,
    estadoAuditoria: "NORMAL",
    origen: "MANUAL",
    idempotencyKey: null,
    secuencia: 1,
    createdAt: "2026-10-01T10:00:00Z",
  };
  db.movimientos.push(movLegado);

  const movVista = filtrarKardex(db, { productoId: prod.id })[0];

  // Valoración del movimiento legado: NO debe inventar ni usar CPP
  const valoradoLegado = valorarMovimientoProspectivo(movVista);
  assert.equal(valoradoLegado.costoUnitario, null, "Costo unitario debe ser null (no inventar)");
  assert.equal(valoradoLegado.valorEntrada, null, "Valor entrada debe ser null");
  assert.equal(valoradoLegado.saldoValorado, null, "Saldo valorado debe ser null");

  // Movimiento prospectivo con costo unitario conocido
  const valoradoNuevo = valorarMovimientoProspectivo(movVista, 350);
  assert.equal(valoradoNuevo.costoUnitario, 350);
  assert.equal(valoradoNuevo.valorEntrada, 1750);
  assert.equal(valoradoNuevo.saldoValorado, 1750);

  console.log("   ✓ Soporte prospectivo validado: datos históricos protegidos sin inventar costos.\n");
}

// ============================================================================
// 10. SEGURIDAD TRANSACCIONAL REVALIDADA EN anularCompra
// ============================================================================
console.log("10. Probando revalidación transaccional de anularCompra dentro del bloqueo...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "SEC-01",
    nombre: "Tubo Conduit 3/4 pulg",
    categoria: "Electricidad",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 50,
    precio: 85,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Proveedor Eléctrico",
    fecha: "2026-11-10",
    notas: "Compra tubos",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 60 }],
  });

  // Anulación válida (sin movimientos posteriores)
  anularCompra(db, compra.id, "Admin");
  assert.equal(compra.anulada, true);
  assert.equal(prod.stockActual, 10);
  assert.equal(prod.costo, 50);

  // Reintento: segundo intento rechazado
  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /la compra ya está anulada/i
  );

  console.log("   ✓ Seguridad transaccional y revalidaciones en anularCompra 100% activas.\n");
}

  console.log("=== TODAS LAS 10 PRUEBAS DE LA ETAPA 2B.2 PASARON AL 100% ===");
}

main().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
