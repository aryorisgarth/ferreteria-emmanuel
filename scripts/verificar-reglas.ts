import assert from "node:assert/strict";
import { COLUMNAS_KARDEX, RENGLONES_POR_HOJA, paginar } from "../src/lib/format";
import {
  aprobarSolicitud,
  crearSolicitud,
  editarMovimiento,
  entregarSolicitud,
  libroDemo,
  registrarCompra,
  registrarEntrada,
  salidaDirecta,
  totalDelDia,
  vistaProductos,
} from "../src/lib/inventory/engine";
import { idProducto } from "../src/lib/inventory/seed";

const db = libroDemo();

function stock(codigo: string) {
  const producto = vistaProductos(db).find((p) => p.codigo === codigo);
  assert.ok(producto, codigo);
  return producto;
}

assert.equal(COLUMNAS_KARDEX.length, 12);
assert.equal(RENGLONES_POR_HOJA, 20);
assert.deepEqual(COLUMNAS_KARDEX, [
  "Fecha",
  "Código/Producto",
  "U. Medida",
  "Tipo Mov.",
  "Entradas",
  "Salidas",
  "Stock Saldo",
  "Destinatario/Oficina",
  "No. Acta/Ref",
  "Concepto/Observación",
  "Usuario",
  "Estado Auditoría",
]);

for (const producto of vistaProductos(db)) {
  assert.equal(
    producto.stockActual,
    Math.round((producto.inventarioInicial + producto.totalEntradas - producto.totalSalidas) * 1000) / 1000,
  );
}

assert.equal(stock("FE-001").stockActual, 281);
assert.equal(stock("FE-001").unidadMedida, "UNIDAD");
assert.equal(stock("FE-004").stockActual, 47);
assert.equal(stock("FE-003").stockActual, 1480);
assert.equal(stock("FE-010").stockActual, 80);
assert.equal(stock("FE-012").stockActual, 22);
assert.equal(stock("FE-024").stockActual, 0);

const dia = totalDelDia(db, "2026-11-01");
const clavo = dia.find((r) => r.codigo === "FE-001");
const cemento = dia.find((r) => r.codigo === "FE-004");
const clavo3 = dia.find((r) => r.codigo === "FE-002");
const cable = dia.find((r) => r.codigo === "FE-008");
assert.ok(clavo && cemento && clavo3 && cable);
assert.equal(clavo.total, 14);
assert.equal(clavo.unidadMedida, "UNIDAD");
assert.ok(clavo.destinatarios.length >= 2);
assert.equal(cemento.total, 3);
assert.equal(cemento.unidadMedida, "BOLSA");
assert.equal(clavo3.total, 7);
assert.equal(cable.unidadMedida, "METRO");
assert.equal(dia.filter((r) => r.codigo === "FE-001").length, 1);
assert.equal(dia.some((r) => r.unidadMedida === "UNIDAD" && r.unidadMedida === cemento.unidadMedida && r.codigo !== cemento.codigo), false);

const antesDiscos = stock("FE-010").stockActual;
const antesCemento = stock("FE-004").stockActual;
const movimientosAntes = db.movimientos.length;
const solicitud = crearSolicitud(db, {
  solicitante: "Prueba de bodega",
  oficinaId: "of-servicios",
  destinatario: "Prueba de bodega",
  observaciones: "No debe mover stock",
  fecha: "2026-11-01",
  creadoPor: "Tester",
  items: [
    { productoId: idProducto("FE-010"), cantidad: 5 },
    { productoId: idProducto("FE-004"), cantidad: 2 },
  ],
});
assert.equal(solicitud.estado, "PENDIENTE_DE_REVISION");
assert.equal(stock("FE-010").stockActual, antesDiscos);
assert.equal(stock("FE-004").stockActual, antesCemento);
assert.equal(db.movimientos.length, movimientosAntes);

const acta = aprobarSolicitud(db, solicitud.id);
assert.equal(solicitud.estado, "APROBADO");
assert.equal(acta.ejecutada, false);
assert.equal(solicitud.actaId, acta.id);
assert.equal(stock("FE-010").stockActual, antesDiscos);
assert.equal(db.movimientos.some((m) => m.solicitudId === solicitud.id), false);

entregarSolicitud(db, solicitud.id, "Tester");
assert.equal(solicitud.estado, "ENTREGADO");
assert.equal(solicitud.stockAplicado, true);
assert.equal(acta.ejecutada, true);
assert.equal(stock("FE-010").stockActual, antesDiscos - 5);
assert.equal(stock("FE-004").stockActual, antesCemento - 2);
const descargos = db.movimientos.filter((m) => m.solicitudId === solicitud.id);
assert.equal(descargos.length, 2);
assert.equal(new Set(descargos.map((m) => m.actaId)).size, 1);
assert.equal(descargos[0].unidadMedida === descargos[1].unidadMedida, false);

const stockTrasDescargo = stock("FE-010").stockActual;
assert.throws(() => entregarSolicitud(db, solicitud.id, "Tester"), /DESCARGO_DUPLICADO/);
assert.equal(stock("FE-010").stockActual, stockTrasDescargo);
assert.equal(db.movimientos.filter((m) => m.solicitudId === solicitud.id).length, 2);

const clavoAntes = stock("FE-001").stockActual;
assert.throws(() => entregarSolicitud(db, "sol-ent-1", "Tester"), /DESCARGO_DUPLICADO/);
assert.equal(stock("FE-001").stockActual, clavoAntes);

const actasAntes = db.actas.length;
const directa = salidaDirecta(db, {
  destinatario: "María López",
  oficinaId: "of-servicios",
  fecha: "2026-11-01",
  concepto: "Salida de mostrador",
  usuario: "Tester",
  esAuditoria: false,
  items: [
    { productoId: idProducto("FE-016"), cantidad: 1 },
    { productoId: idProducto("FE-015"), cantidad: 2 },
  ],
});
assert.equal(db.actas.length, actasAntes + 1);
assert.equal(directa.esSalidaDirecta, true);
assert.equal(directa.ejecutada, true);
const movDir = db.movimientos.filter((m) => m.actaId === directa.id);
assert.equal(movDir.length, 2);
assert.ok(movDir.every((m) => m.destinatario === "María López"));
assert.equal(movDir[0].numeroReferencia, movDir[1].numeroReferencia);

const brocha = stock("FE-016").stockActual;
assert.throws(
  () =>
    registrarEntrada(db, {
      productoId: idProducto("FE-016"),
      cantidad: 4,
      fecha: "2026-11-01",
      concepto: "Entrada manual sin costeo",
      usuario: "Tester",
      esAuditoria: false,
    }),
  /Entrada no autorizada/i,
);
assert.equal(stock("FE-016").stockActual, brocha);

// Verificación de protección de Kárdex: Se rechaza modificar cantidad o fecha histórica
assert.equal(db.movimientos.find((m) => m.id === "mov-alambre-salida")?.stockSaldo, 1480);
assert.throws(
  () =>
    editarMovimiento(db, "mov-excel-alambre", {
      cantidad: 100, // Intento de alterar cantidad histórica de 1000 a 100
      fecha: "2026-10-10",
      concepto: "Corrección de carga Excel",
      destinatario: "",
      oficinaId: null,
      esAuditoria: true,
      estadoAuditoria: "EN_AUDITORIA",
      usuario: "Tester",
    }),
  /no se permite modificar la cantidad ni la fecha/i,
);
// El stock y el saldo permanecen intactos
assert.equal(db.movimientos.find((m) => m.id === "mov-excel-alambre")?.stockSaldo, 1500);
assert.equal(stock("FE-003").stockActual, 1480);

// Edición permitida: Modificación de glosa o estado de auditoría sin alterar cantidad ni fecha
editarMovimiento(db, "mov-excel-alambre", {
  cantidad: 1000, // Misma cantidad original
  fecha: "2026-10-10", // Misma fecha original
  concepto: "Revisión de glosa auditada",
  destinatario: "",
  oficinaId: null,
  esAuditoria: true,
  estadoAuditoria: "EN_AUDITORIA",
  usuario: "Tester",
});
assert.equal(db.movimientos.find((m) => m.id === "mov-excel-alambre")?.concepto, "Revisión de glosa auditada");
assert.equal(db.movimientos.find((m) => m.id === "mov-excel-alambre")?.esAuditoria, true);
assert.equal(stock("FE-003").stockActual, 1480);

const auditoria = db.movimientos.find((m) => m.id === "mov-audit-thinner");
assert.equal(auditoria?.esAuditoria, true);
assert.equal(auditoria?.estadoAuditoria, "EN_AUDITORIA");

const actasSinDestino = db.actas.length;
assert.throws(
  () =>
    salidaDirecta(db, {
      destinatario: "   ",
      oficinaId: "of-servicios",
      fecha: "2026-11-01",
      concepto: "Sin destino",
      usuario: "Tester",
      esAuditoria: false,
      items: [{ productoId: idProducto("FE-016"), cantidad: 1 }],
    }),
  /destinatario/i,
);
assert.equal(db.actas.length, actasSinDestino);

const hojaProductos = paginar(vistaProductos(db), 1);
const hojaSiguiente = paginar(vistaProductos(db), 2);
assert.equal(hojaProductos.rows.length, 20);
assert.equal(hojaSiguiente.rows.length, vistaProductos(db).length - 20);
assert.ok(paginar(db.movimientos, 2).rows.length <= 20);
assert.ok(paginar(db.movimientos, 2).rows.length > 0);

// Verificación de Costo Promedio Ponderado (CPP) en Compras
const prodTest = db.productos.find((p) => p.codigo === "FE-016");
assert.ok(prodTest);
const stockInicialTest = prodTest.stockActual;
prodTest.costo = 50; // Costo base C$ 50

// Comprar 10 unidades a C$ 70
registrarCompra(db, {
  proveedor: "Distribuidora Ferretera SA",
  fecha: "2026-11-01",
  notas: "Factura CPP Test",
  creadoPor: "Tester",
  items: [{ productoId: prodTest.id, cantidad: 10, precio: 70 }],
});

// Fórmula: (stockInicial * 50 + 10 * 70) / (stockInicial + 10)
const costoEsperado = Math.round(((stockInicialTest * 50 + 10 * 70) / (stockInicialTest + 10)) * 100) / 100;
assert.equal(prodTest.costo, costoEsperado);
assert.equal(prodTest.stockActual, stockInicialTest + 10);

console.log("Reglas de bodega y Costo Promedio Ponderado (CPP) verificados exitosamente.");
