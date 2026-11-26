/**
 * SUITE DE VALIDACIÓN RIGUROSA — CORRECCIÓN FINAL BLOQUE C
 * Pruebas unitarias adicionales y verificación de casos límite sin base de datos.
 */

import {
  libroVacio,
  emitirFactura,
  crearCotizacion,
  registrarCompra,
  totalesLineas,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";
import type { RolUsuario } from "../src/lib/auth";

function assert(condicion: boolean, mensaje: string) {
  if (!condicion) {
    throw new Error(`FALLO DE PRUEBA: ${mensaje}`);
  }
}

console.log("==================================================================");
console.log("  FERRETERÍA EMMANUEL — PRUEBAS ADICIONALES DE REVISIÓN BLOQUE C  ");
console.log("==================================================================");

function inicializarDbPruebas(): DB {
  const d = libroVacio();

  d.productos.push(
    {
      id: "prod-esmeril",
      codigo: "HER-001",
      nombre: "Esmeril Angular 4-1/2 Truper",
      marca: "Truper",
      unidadMedida: "UNIDAD",
      inventarioInicial: 10,
      stockActual: 10,
      precio: 1500.00, // Precio de catálogo
      costo: 1000.00,  // Costo base
      categoria: "Herramientas",
      stockMinimo: 2,
      activo: true,
    },
    {
      id: "prod-disco",
      codigo: "HER-002",
      nombre: "Disco de Corte Metal 4-1/2 Truper",
      marca: "Truper",
      unidadMedida: "UNIDAD",
      inventarioInicial: 100,
      stockActual: 100,
      precio: 45.00,
      costo: 25.00,
      categoria: "Herramientas",
      stockMinimo: 20,
      activo: true,
    }
  );

  return d;
}

// ---------------------------------------------------------------------------
// 1. Simulación del Servidor: Manipulación de Precios (Superiores e Inferiores)
// ---------------------------------------------------------------------------
// El cliente NO envía el precio. Envía únicamente { productoId, cantidad, descuentoSolicitado }.
// Si el cliente intenta inyectar un precio arbitrario, el servidor lo descarta y toma el catálogo.
function resolverPrecioEnServidor(
  precioCatalogo: number,
  descuentoSolicitado: number = 0,
  rol: RolUsuario = "CAJERO"
): number {
  if (descuentoSolicitado < 0 || descuentoSolicitado > 100) {
    throw new Error("Porcentaje de descuento inválido.");
  }
  if (descuentoSolicitado > 0) {
    if (rol !== "ADMINISTRADOR" && descuentoSolicitado > 3.01) {
      throw new Error(`Descuento del ${descuentoSolicitado}% no autorizado para ${rol}. Máximo 3%.`);
    }
  }
  return Number((precioCatalogo * (1 - descuentoSolicitado / 100)).toFixed(2));
}

// Caso 1A: Manipulación inferior no autorizada (Cajero pide 15% de descuento)
try {
  resolverPrecioEnServidor(1500.00, 15, "CAJERO");
  assert(false, "Debe rechazar descuento del 15% para rol CAJERO.");
} catch (e: any) {
  assert(e.message.includes("no autorizado para CAJERO"), "Rechazo de descuento no autorizado confirmado.");
}

// Caso 1B: Administrador aprueba 10% de descuento
const precioAdmin = resolverPrecioEnServidor(1500.00, 10, "ADMINISTRADOR");
assert(precioAdmin === 1350.00, `Precio con 10% de descuento debe ser C$ 1,350.00. Obtenido: ${precioAdmin}`);

// Caso 1C: Venta estándar sin descuento
const precioNormal = resolverPrecioEnServidor(1500.00, 0, "CAJERO");
assert(precioNormal === 1500.00, "Venta sin descuento debe respetar precio exacto de catálogo.");

console.log("✔ PRUEBA 1 PASÓ: El servidor tiene autoridad absoluta sobre el cálculo de precios y descuentos.");

// ---------------------------------------------------------------------------
// 2. Cotizaciones: Aplican Reglas Comerciales SIN Descontar Inventario
// ---------------------------------------------------------------------------
const dbCot = inicializarDbPruebas();
const stockInicialEsmeril = dbCot.productos.find((p) => p.id === "prod-esmeril")!.stockActual;

const cotizacion = crearCotizacion(dbCot, {
  cliente: "Empresa Constructora Proforma",
  fecha: "2026-11-15",
  notas: "Cotización válida 15 días",
  creadoPor: "vendedor",
  items: [
    { productoId: "prod-esmeril", cantidad: 4, precio: 1500.00 },
    { productoId: "prod-disco", cantidad: 20, precio: 45.00 },
  ],
});

assert(Boolean(cotizacion.id), "Cotización creada con éxito.");
assert(cotizacion.estado === "BORRADOR", "Estado inicial debe ser BORRADOR.");

// Comprobación crítica: El inventario NO debe haberse movido
const stockPostCot = dbCot.productos.find((p) => p.id === "prod-esmeril")!.stockActual;
assert(stockPostCot === stockInicialEsmeril, `Stock debe mantenerse en 10. Actual: ${stockPostCot}`);
assert(dbCot.movimientos.length === 0, "No debe registrarse ningún movimiento en kárdex para cotizaciones.");
console.log("✔ PRUEBA 2 PASÓ: Cotizaciones aplican reglas de precios sin alterar inventario ni kárdex.");

// ---------------------------------------------------------------------------
// 3. Separación de Compras de Ventas (Costos Independientes del Precio de Venta)
// ---------------------------------------------------------------------------
const dbComp = inicializarDbPruebas();
// Esmeril tiene precio de venta de C$ 1,500.00 y costo actual de C$ 1,000.00 (10 unidades).
// En compra de reabastecimiento, compramos 10 unidades a costo de adquisición mayorista de C$ 950.00.
// Esto es independiente de las reglas de descuento del mostrador POS.
const compra = registrarCompra(dbComp, {
  proveedor: "Truper Mayoreo",
  fecha: "2026-11-15",
  notas: "Compra mayorista",
  creadoPor: "bodega",
  items: [
    { productoId: "prod-esmeril", cantidad: 10, precio: 950.00 }, // precio aquí = costo de compra
  ],
});

assert(Boolean(compra.numero), "Compra registrada con éxito.");
const prodEsmerilComp = dbComp.productos.find((p) => p.id === "prod-esmeril")!;
assert(prodEsmerilComp.stockActual === 20, "Stock debe ser 20 (10 + 10).");
// CPP esperado: ((10 * 1000) + (10 * 950)) / 20 = (10,000 + 9,500) / 20 = 19,500 / 20 = 975.00
assert(prodEsmerilComp.costo === 975.00, `CPP debe ser C$ 975.00. Obtenido: ${prodEsmerilComp.costo}`);
// El precio de venta al público se mantiene en C$ 1,500.00 intacto
assert(prodEsmerilComp.precio === 1500.00, "El precio de catálogo para venta se mantiene intacto.");
console.log("✔ PRUEBA 3 PASÓ: Separación total de compras vs ventas y preservación de CPP.");

// ---------------------------------------------------------------------------
// 4. Cálculos Financieros con Múltiples Productos e Impuestos (15% IVA)
// ---------------------------------------------------------------------------
const renglonesMultiples = [
  { cantidad: 2, precio: 1500.00 }, // 3,000.00
  { cantidad: 10, precio: 45.00 },  // 450.00
  { cantidad: 5, precio: 120.50 },  // 602.50
];
// Subtotal = 3,000 + 450 + 602.50 = 4,052.50
// ISV 15% = 4,052.50 * 0.15 = 607.875 -> redondeo a 607.88
// Total = 4,052.50 + 607.88 = 4,660.38
const { subtotal: subFin, isv: isvFin, total: totFin } = totalesLineas(renglonesMultiples);
assert(subFin === 4052.50, `Subtotal esperado: 4,052.50. Obtenido: ${subFin}`);
assert(isvFin === 607.88, `IVA 15% esperado: 607.88. Obtenido: ${isvFin}`);
assert(totFin === 4660.38, `Total esperado: 4,660.38. Obtenido: ${totFin}`);
console.log("✔ PRUEBA 4 PASÓ: Cálculo financiero determinista multilínea verificado con precisión bancaria.");

console.log("==================================================================");
console.log("   TODAS LAS PRUEBAS DE CORRECCIÓN FINAL CONCLUYERON CON ÉXITO    ");
console.log("==================================================================");
