import { libroVacio, emitirFactura, registrarCompra } from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

function assert(condicion: boolean, mensaje: string) {
  if (!condicion) {
    throw new Error(`FALLO DE ASERCIÓN: ${mensaje}`);
  }
}

console.log("=== EJECUTANDO PRUEBAS UNITARIAS DE LÓGICA TRANSACCIONAL (EN MEMORIA) ===");

const db: DB = libroVacio();

// Inyectar producto de prueba
db.productos.push({
  id: "prod-esmeril",
  codigo: "TRU-101",
  nombre: "Esmeril Angular 4-1/2 Truper",
  marca: "Truper",
  unidadMedida: "UNIDAD",
  inventarioInicial: 5,
  stockActual: 5,
  precio: 1500, // C$ 1,500.00 precio oficial
  costo: 1000,  // C$ 1,000.00 costo base
  categoria: "Herramientas",
  stockMinimo: 2,
  activo: true,
});

// Inyectar cliente de prueba
db.clientes.push({
  id: "cli-juan",
  nombre: "Juan Pérez Contratista",
  telefono: "8888-0000",
  direccion: "Managua",
  notas: "Límite C$ 5,000",
  limiteCredito: 5000,
  saldoPendiente: 0,
});

// ---------------------------------------------------------------------------
// TEST 1: Prevención de Sobreventa
// ---------------------------------------------------------------------------
try {
  emitirFactura(db, {
    cliente: "Cliente Ocasional",
    fecha: "2026-11-15",
    notas: "",
    creadoPor: "cajero",
    items: [{ productoId: "prod-esmeril", cantidad: 6, precio: 1500 }],
  });
  assert(false, "Debió rechazar la venta por stock insuficiente.");
} catch (e: any) {
  assert(e.message.includes("Stock insuficiente"), `Error esperado capturado. Mensaje: ${e.message}`);
  const prod = db.productos.find((p) => p.id === "prod-esmeril");
  assert(prod?.stockActual === 5, "El stock no debe modificarse ante fallo.");
  console.log("✔ TEST 1 PASÓ: Prevención de sobreventa verificada con éxito.");
}

// ---------------------------------------------------------------------------
// TEST 2: Venta Exitosa al Contado y Movimiento en Kárdex
// ---------------------------------------------------------------------------
const factura = emitirFactura(db, {
  cliente: "Cliente Ocasional",
  fecha: "2026-11-15",
  notas: "Venta mostrador",
  creadoPor: "cajero",
  formaPago: "EFECTIVO",
  items: [{ productoId: "prod-esmeril", cantidad: 2, precio: 1500 }],
});

assert(Boolean(factura.numero), "La factura debe generar un consecutivo oficial.");
assert(factura.estado === "PAGADA", "La factura en efectivo debe estar PAGADA.");
const prodDespues = db.productos.find((p) => p.id === "prod-esmeril");
assert(prodDespues?.stockActual === 3, `Stock actual debe ser 3 (era 5 - 2). Actual: ${prodDespues?.stockActual}`);

const movKardex = db.movimientos.find((m) => m.productoId === "prod-esmeril" && m.tipo === "SALIDA");
assert(Boolean(movKardex), "Debe existir un registro de SALIDA en el kárdex.");
assert(movKardex?.cantidad === 2, "La cantidad del kárdex debe coincidir.");
assert(Boolean(movKardex?.idempotencyKey), "El movimiento debe tener idempotencyKey única.");
console.log("✔ TEST 2 PASÓ: Venta al contado y kárdex con idempotencia verificados con éxito.");

// ---------------------------------------------------------------------------
// TEST 3: Compra con Recálculo de Costo Promedio Ponderado (CPP)
// ---------------------------------------------------------------------------
// Estado actual: 3 unidades con costo de C$ 1,000.00 = C$ 3,000.00
// Compramos: 7 unidades a costo C$ 1,200.00 = C$ 8,400.00
// Total existencias nuevas: 10 unidades. Total inversión: C$ 11,400.00
// CPP esperado: 11,400 / 10 = C$ 1,140.00
const compra = registrarCompra(db, {
  proveedor: "Truper Centroamérica",
  fecha: "2026-11-15",
  notas: "Lote nuevo de esmeriles",
  creadoPor: "bodega",
  items: [{ productoId: "prod-esmeril", cantidad: 7, precio: 1200 }],
});

assert(Boolean(compra.numero), "La compra debe generar un consecutivo oficial.");
const prodPostCompra = db.productos.find((p) => p.id === "prod-esmeril");
assert(prodPostCompra?.stockActual === 10, `Stock debe ser 10. Actual: ${prodPostCompra?.stockActual}`);
assert(prodPostCompra?.costo === 1140, `Costo Promedio Ponderado debe ser C$ 1,140.00. Actual: ${prodPostCompra?.costo}`);
console.log("✔ TEST 3 PASÓ: Recálculo de Costo Promedio Ponderado (CPP) verificado con éxito.");

// ---------------------------------------------------------------------------
// TEST 4: Idempotencia en Movimientos
// ---------------------------------------------------------------------------
const primerMov = db.movimientos[0];
assert(db.movimientos.filter((m) => m.idempotencyKey === primerMov.idempotencyKey).length === 1, "No deben existir movimientos duplicados.");
console.log("✔ TEST 4 PASÓ: Llave de idempotencia única comprobada en movimientos.");

console.log("=== TODAS LAS PRUEBAS DE LÓGICA TRANSACCIONAL PASARON CON ÉXITO ===");
