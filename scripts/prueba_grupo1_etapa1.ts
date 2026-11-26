import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  editarProducto,
  emitirFactura,
  editarMovimiento,
  registrarEntrada,
  registrarCompra,
  vistaProductos,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";

console.log("==================================================================");
console.log("   FERRETERÍA EMMANUEL — PRUEBAS DE REGRESIÓN GRUPO 1 (ETAPA 1)   ");
console.log("==================================================================");

// Usamos una base de datos 100% aislada en memoria (libroVacio)
const db = libroVacio();

// -----------------------------------------------------------------------------
// 1. PRUEBA DE INVENTARIO: CORRECCIÓN DE EXISTENCIAS AL EDITAR ARTÍCULOS
// -----------------------------------------------------------------------------
console.log("\n--- 1. PRUEBA: EDICIÓN DE ARTÍCULO CON VENTAS HISTÓRICAS ---");

// Crear producto con inventario inicial = 100
const prod = altaProducto(db, {
  codigo: "TEST-PROD-01",
  nombre: "Martillo de Uña 16oz Original",
  marca: "Truper",
  unidadMedida: "UNIDAD",
  inventarioInicial: 100,
  precio: 250,
  costo: 180,
  categoria: "Herramientas",
  stockMinimo: 10,
});
assert.equal(prod.stockActual, 100, "Stock inicial debe ser 100");

// Simular venta histórica de 20 unidades
emitirFactura(db, {
  cliente: "Constructora Modelo",
  fecha: "2026-11-16",
  notas: "Factura inicial de prueba",
  creadoPor: "Tester",
  items: [{ productoId: prod.id, cantidad: 20, precio: 250 }],
});

assert.equal(prod.stockActual, 80, "Tras vender 20 unidades, el stock debe ser 80");
const movsAntes = db.movimientos.filter((m) => m.productoId === prod.id).length;
assert.equal(movsAntes, 1, "Debe existir exactamente 1 movimiento de salida en Kárdex");

// Intento de edición comercial (cambiar nombre y precio):
// Aunque el formulario antiguo hubiese enviado inventarioInicial = 80 (el stock actual),
// el backend DEBE ignorar la alteración del inventario inicial porque el producto ya tiene movimientos.
editarProducto(db, prod.id, {
  codigo: "TEST-PROD-01",
  nombre: "Martillo de Uña 16oz Edición Actualizada",
  marca: "Truper Pro",
  unidadMedida: "UNIDAD",
  inventarioInicial: 80, // El valor que enviaba el formulario erróneo
  precio: 280, // Precio actualizado
  costo: 180,
  categoria: "Herramientas",
  stockMinimo: 15,
});

assert.equal(prod.nombre, "Martillo de Uña 16oz Edición Actualizada");
assert.equal(prod.precio, 280);
assert.equal(prod.stockMinimo, 15);
assert.equal(prod.inventarioInicial, 100, "El inventario inicial NO debe ser corrompido");
assert.equal(prod.stockActual, 80, "¡ÉXITO! El stock actual continúa estrictamente en 80 unidades");

const movsDespues = db.movimientos.filter((m) => m.productoId === prod.id).length;
assert.equal(movsDespues, movsAntes, "El Kárdex permanece 100% intacto tras la edición del producto");
console.log("✔ TEST 1 SUPERADO: La edición del producto preserva el inventario inicial y el stock actual (80 un).");

// -----------------------------------------------------------------------------
// 2. PRUEBA DE KÁRDEX: INMUTABILIDAD DE MOVIMIENTOS COMERCIALES E HISTÓRICOS
// -----------------------------------------------------------------------------
console.log("\n--- 2. PRUEBA: INTENTO DE EDICIÓN DE MOVIMIENTO DE FACTURA ---");

const movFactura = db.movimientos.find((m) => m.productoId === prod.id && m.origen === "FACTURA");
assert.ok(movFactura, "Debe existir el movimiento de la factura");
assert.equal(movFactura.cantidad, 20);

// Intentar alterar la cantidad histórica del movimiento de la factura a 4 unidades
assert.throws(
  () =>
    editarMovimiento(db, movFactura.id, {
      cantidad: 4, // Intento de reducir la salida a 4
      fecha: "2026-11-16",
      concepto: "Intento de alteración",
      destinatario: "Constructora Modelo",
      oficinaId: null,
      esAuditoria: false,
      estadoAuditoria: "NORMAL",
      usuario: "Atacante",
    }),
  /proviene de una Factura \/ Venta oficial y es inmutable/i,
  "Debe rechazar la modificación de un movimiento originado por Factura"
);

// Verificar que ni el Kárdex, ni la Factura, ni el Stock fueron alterados
assert.equal(movFactura.cantidad, 20, "La cantidad del movimiento debe continuar en 20");
assert.equal(prod.stockActual, 80, "El stock debe permanecer estrictamente en 80");
const factura = db.facturas.find((f) => f.items.some((i) => i.productoId === prod.id));
assert.ok(factura);
assert.equal(factura.items[0].cantidad, 20, "La factura permanece intacta sin modificaciones");
console.log("✔ TEST 2 SUPERADO: Intento de edición de movimiento comercial rechazado. Factura, Kárdex y Stock intactos.");

// -----------------------------------------------------------------------------
// 3. PRUEBA DE BODEGA: RECHAZO DE ENTRADAS MANUALES SIN COSTO Y PRESERVACIÓN DEL CPP
// -----------------------------------------------------------------------------
console.log("\n--- 3. PRUEBA: ENTRADAS MANUALES SIN VALORACIÓN Y COMPRAS VÁLIDAS ---");

const stockAntesEntrada = prod.stockActual;
const totalMovsAntes = db.movimientos.length;

// A. Intento de entrada manual sin costo (origen MANUAL)
assert.throws(
  () =>
    registrarEntrada(db, {
      productoId: prod.id,
      cantidad: 50,
      fecha: "2026-11-16",
      concepto: "Entrada manual sin costeo",
      usuario: "Bodeguero",
      esAuditoria: false,
      origen: "MANUAL",
    }),
  /Entrada no autorizada/i,
  "Debe rechazar la entrada manual no autorizada"
);

// B. Intento con costo inválido (<= 0)
assert.throws(
  () =>
    registrarEntrada(db, {
      productoId: prod.id,
      cantidad: 50,
      fecha: "2026-11-16",
      concepto: "Entrada manual costo cero",
      usuario: "Bodeguero",
      esAuditoria: false,
      costoUnitario: 0,
      origen: "COMPRA",
    }),
  /costo de adquisición unitario mayor que cero/i,
  "Debe rechazar entrada con costo <= 0"
);

assert.equal(prod.stockActual, stockAntesEntrada, "El stock no debe alterarse tras intentos de entrada inválidos");
assert.equal(db.movimientos.length, totalMovsAntes, "No se deben haber agregado movimientos al Kárdex");

// C. Compra comercial válida con recálculo de Costo Promedio Ponderado (CPP)
// Situación actual de prod: stock = 80, costo = C$ 180.
// Compraremos 20 unidades a C$ 220 cada una.
// Fórmula CPP: (80 * 180 + 20 * 220) / (80 + 20) = (14400 + 4400) / 100 = 18800 / 100 = C$ 188.00
const compra = registrarCompra(db, {
  proveedor: "Distribuidora Nacional Truper SA",
  fecha: "2026-11-16",
  notas: "Factura COM-9921",
  creadoPor: "EncargadoCompras",
  items: [{ productoId: prod.id, cantidad: 20, precio: 220 }],
});

assert.ok(compra, "La compra válida debe procesarse exitosamente");
assert.equal(prod.stockActual, 100, "Tras comprar 20 unidades, el stock debe ser 80 + 20 = 100");
assert.equal(prod.costo, 188, "¡CPP EXACTO! El costo promedio ponderado debe ser exactamente C$ 188.00");

const movCompra = db.movimientos.find((m) => m.numeroReferencia === compra.numero);
assert.ok(movCompra, "La compra debe asentar automáticamente su ENTRADA en Kárdex");
assert.equal(movCompra.entradas, 20);
assert.equal(movCompra.stockSaldo, 100);
console.log("✔ TEST 3 SUPERADO: Entradas manuales sin costeo rechazadas. Compras comerciales y CPP operan con exactitud matemática.");

console.log("\n==================================================================");
console.log("   ¡TODAS LAS PRUEBAS DE LA ETAPA 1 PASARON CON ÉXITO (100%)!    ");
console.log("==================================================================");
