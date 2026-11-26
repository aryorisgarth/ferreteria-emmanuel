import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  registrarCompra,
  anularCompra,
  emitirFactura,
  crearAjuste,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

console.log("=== INICIANDO PRUEBAS: CORRECCIÓN PUNTUAL ETAPA 2B.1 (ANULACIÓN DE COMPRAS Y CPP) ===\n");

// ============================================================================
// 1. COMPRA SIN MOVIMIENTOS POSTERIORES: ANULACIÓN CORRECTA
// ============================================================================
console.log("1. Probando compra sin movimientos posteriores (anulación correcta)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-01",
    nombre: "Tubo PVC 1/2 Amanco",
    categoria: "Plomería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 100, // Stock: 10 @ C$ 100 = C$ 1,000
    precio: 150,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Distribuidora Amanco",
    fecha: "2026-11-10",
    notas: "Compra de lote",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 120 }], // 10 @ C$ 120 = C$ 1,200
  });

  // Stock total = 20, CPP = (1000 + 1200) / 20 = 110.00
  assert.equal(prod.stockActual, 20);
  assert.equal(prod.costo, 110);

  // Anulación sin movimientos posteriores
  anularCompra(db, compra.id, "Admin");

  assert.equal(compra.anulada, true);
  assert.equal(prod.stockActual, 10, "El stock debe regresar exactamente a 10");
  assert.equal(prod.costo, 100, "El CPP debe restaurarse exactamente a C$ 100.00");

  const movSalida = db.movimientos.find(
    (m) => m.idempotencyKey === `ANULA:COMPRA:${compra.id}:ITEM:${compra.items[0].id}`
  );
  assert(movSalida, "Debe existir movimiento de anulación en Kárdex");
  assert.equal(movSalida.tipo, "SALIDA");
  assert.equal(movSalida.cantidad, 10);
  console.log("   ✓ Compra anulada correctamente; stock y CPP restaurados con exactitud.\n");
}

// ============================================================================
// 2. COMPRA CON VENTA POSTERIOR: ANULACIÓN BLOQUEADA
// ============================================================================
console.log("2. Probando compra con venta posterior (anulación bloqueada)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-02",
    nombre: "Pintura Corona Blanco",
    categoria: "Pinturas",
    marca: "Corona",
    unidadMedida: "GALON",
    inventarioInicial: 10,
    costo: 100,
    precio: 200,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Pinturas SA",
    fecha: "2026-11-10",
    notas: "Compra de pintura",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 120 }],
  });
  assert.equal(prod.stockActual, 20);
  assert.equal(prod.costo, 110);

  // Venta posterior de 2 galones
  emitirFactura(db, {
    cliente: "Constructora San Jerónimo",
    fecha: "2026-11-11",
    notas: "Venta parcial",
    creadoPor: "Vendedor",
    items: [{ productoId: prod.id, cantidad: 2, precio: 200 }],
  });
  assert.equal(prod.stockActual, 18);

  // Intentar anular la compra a pesar de que el stock disponible (18) supera la compra (10)
  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /tiene ventas posteriores registradas|anulación de compra solo es válida para registros erróneos/i,
    "Debe rechazar la anulación porque existen ventas posteriores"
  );

  // Verificar que NO se modificó el CPP ni el stock
  assert.equal(prod.stockActual, 18, "El stock debe permanecer intacto en 18");
  assert.equal(prod.costo, 110, "El CPP no debe modificarse si la anulación se rechaza");
  assert.equal(compra.anulada, false, "La compra no debe quedar marcada como anulada");
  console.log("   ✓ Anulación con ventas posteriores bloqueada; stock y CPP preservados.\n");
}

// ============================================================================
// 3. COMPRA CON COMPRA POSTERIOR: ANULACIÓN BLOQUEADA
// ============================================================================
console.log("3. Probando compra con compra posterior (anulación bloqueada)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-03",
    nombre: "Cemento Tolteca Gris",
    categoria: "Construcción",
    marca: "Tolteca",
    unidadMedida: "BOLSA",
    inventarioInicial: 10,
    costo: 100,
    precio: 160,
    stockMinimo: 5,
  });

  const compra1 = registrarCompra(db, {
    proveedor: "Distribuidora 1",
    fecha: "2026-11-10",
    notas: "Compra 1",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 120 }], // CPP = 110
  });

  const compra2 = registrarCompra(db, {
    proveedor: "Distribuidora 2",
    fecha: "2026-11-12",
    notas: "Compra 2",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 5, precio: 130 }], // CPP = (20*110 + 5*130)/25 = (2200 + 650)/25 = 114
  });
  assert.equal(prod.stockActual, 25);
  assert.equal(prod.costo, 114);

  // Intentar anular la compra 1 teniendo una compra posterior
  assert.throws(
    () => anularCompra(db, compra1.id, "Admin"),
    /tiene compras posteriores que recalcularon el Costo Promedio Ponderado/i,
    "Debe rechazar anulación de compra intermedia"
  );

  assert.equal(prod.stockActual, 25, "El stock no debe modificarse");
  assert.equal(prod.costo, 114, "El CPP no debe alterarse");
  assert.equal(compra1.anulada, false, "La compra 1 no debe quedar anulada");
  console.log("   ✓ Compra intermedia bloqueada; historial contable protegido.\n");
}

// ============================================================================
// 4. COMPRA CON AJUSTE POSTERIOR: ANULACIÓN BLOQUEADA
// ============================================================================
console.log("4. Probando compra con ajuste posterior (anulación bloqueada)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-04",
    nombre: "Varilla de Hierro 3/8",
    categoria: "Hierro",
    marca: "ArcelorMittal",
    unidadMedida: "UNIDAD",
    inventarioInicial: 20,
    costo: 80,
    precio: 120,
    stockMinimo: 10,
  });

  const compra = registrarCompra(db, {
    proveedor: "Aceros SA",
    fecha: "2026-11-10",
    notas: "Lote de varillas",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 20, precio: 90 }], // 40 @ C$ 85
  });
  assert.equal(prod.stockActual, 40);
  assert.equal(prod.costo, 85);

  // Se registra un ajuste posterior por sobrante
  crearAjuste(db, {
    productoId: prod.id,
    tipo: "SOBRANTE",
    cantidad: 2,
    motivo: "Mercancía encontrada en conteo previo",
    usuario: "Auditor",
    fecha: "2026-11-11",
  });
  assert.equal(prod.stockActual, 42);

  // Intentar anular la compra tras el ajuste
  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /tiene ajustes de inventario posteriores/i,
    "Debe rechazar anulación si existen ajustes posteriores"
  );

  assert.equal(prod.stockActual, 42, "El stock no debe cambiar");
  assert.equal(prod.costo, 85, "El CPP no debe cambiar");
  assert.equal(compra.anulada, false);
  console.log("   ✓ Anulación con ajuste posterior bloqueada; integridad de kárdex preservada.\n");
}

// ============================================================================
// 5. DEVOLUCIÓN PARCIAL HIPOTÉTICA: NO TRATAR COMO ANULACIÓN COMPLETA
// ============================================================================
console.log("5. Probando rechazo de devolución parcial tratada como anulación...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-05",
    nombre: "Clavo para Madera 2 pulg",
    categoria: "Fijaciones",
    marca: "Genérica",
    unidadMedida: "LIBRA",
    inventarioInicial: 0,
    costo: 0,
    precio: 35,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Ferretera Central",
    fecha: "2026-11-10",
    notas: "Compra 50 lbs",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 50, precio: 20 }],
  });
  assert.equal(prod.stockActual, 50);

  // Supongamos que solo hay 30 libras disponibles (e.g. 20 se vendieron o se dañaron)
  emitirFactura(db, {
    cliente: "Carpintería Moderna",
    fecha: "2026-11-11",
    notas: "Venta 20 lbs",
    creadoPor: "Vendedor",
    items: [{ productoId: prod.id, cantidad: 20, precio: 35 }],
  });
  assert.equal(prod.stockActual, 30);

  // Se intenta devolver o anular la compra de 50 teniendo solo 30 disponibles
  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /no cuenta con existencias suficientes en bodega|devoluciones físicas al proveedor no deben tratarse como anulaciones completas/i,
    "Debe rechazar la anulación porque no se puede tratar una devolución parcial como anulación completa"
  );

  assert.equal(prod.stockActual, 30);
  assert.equal(compra.anulada, false);
  console.log("   ✓ Devolución parcial rechazada como anulación; distinción conceptual validada.\n");
}

// ============================================================================
// 6. COMPRA YA ANULADA: SEGUNDO INTENTO RECHAZADO (IDEMPOTENCIA)
// ============================================================================
console.log("6. Probando compra ya anulada (segundo intento rechazado)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-06",
    nombre: "Tornillo Gypsum 1 pulg",
    categoria: "Fijaciones",
    marca: "Truper",
    unidadMedida: "CAJA",
    inventarioInicial: 5,
    costo: 40,
    precio: 70,
    stockMinimo: 2,
  });

  const compra = registrarCompra(db, {
    proveedor: "Truper SA",
    fecha: "2026-11-10",
    notas: "Lote tornillos",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 5, precio: 50 }],
  });
  assert.equal(prod.stockActual, 10);
  assert.equal(prod.costo, 45); // (5*40 + 5*50)/10 = 450/10 = 45

  // Primera anulación válida
  anularCompra(db, compra.id, "Admin");
  assert.equal(compra.anulada, true);
  assert.equal(prod.stockActual, 5);
  assert.equal(prod.costo, 40);

  // Segundo intento de anulación
  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /la compra ya está anulada/i,
    "Debe rechazar un segundo intento de anulación de la misma compra"
  );

  assert.equal(prod.stockActual, 5, "El stock no debe cambiar");
  assert.equal(prod.costo, 40, "El CPP no debe cambiar");
  console.log("   ✓ Segundo intento de anulación rechazado con ReglaBodegaError.\n");
}

// ============================================================================
// 7. REVERSIÓN CON STOCK REMANENTE CERO: COSTO CONSISTENTE
// ============================================================================
console.log("7. Probando reversión con stock remanente cero (costo consistente)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-07",
    nombre: "Lija de Agua #220",
    categoria: "Abrasivos",
    marca: "Fandeli",
    unidadMedida: "UNIDAD",
    inventarioInicial: 0,
    costo: 0,
    precio: 25,
    stockMinimo: 5,
  });
  assert.equal(prod.stockActual, 0);
  assert.equal(prod.costo, 0);

  const compra = registrarCompra(db, {
    proveedor: "Distribuidora Fandeli",
    fecha: "2026-11-10",
    notas: "Compra inicial de lijas",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 100, precio: 15 }],
  });
  assert.equal(prod.stockActual, 100);
  assert.equal(prod.costo, 15);

  // Anulación de la única compra sin movimientos posteriores
  anularCompra(db, compra.id, "Admin");

  assert.equal(compra.anulada, true);
  assert.equal(prod.stockActual, 0, "El stock remanente debe ser exactamente 0");
  assert.equal(prod.costo, 0, "El costo debe quedar consistentemente en 0 (sin NaN ni valores residuales)");
  console.log("   ✓ Stock remanente cero produce costo consistente en 0.\n");
}

// ============================================================================
// 8. REVERSIÓN CON VALORES MONETARIOS INVÁLIDOS: OPERACIÓN RECHAZADA
// ============================================================================
console.log("8. Probando reversión con valores monetarios inválidos (operación rechazada)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-08",
    nombre: "Codo PVC 1/2 pulg",
    categoria: "Plomería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 20,
    precio: 35,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Amanco SA",
    fecha: "2026-11-10",
    notas: "Compra de codos",
    creadoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 25 }],
  });
  assert.equal(prod.stockActual, 20);
  assert.equal(prod.costo, 22.5); // (10*20 + 10*25)/20 = 450/20 = 22.5

  // Simulamos un estado forzado de datos donde el valor de inventario fuese menor al valor de la compra
  // (por ejemplo si un precio de compra corrupto superara el valor total actual)
  compra.items[0].precio = 999999; // Provocaría valor remanente fuertemente negativo

  assert.throws(
    () => anularCompra(db, compra.id, "Admin"),
    /produce un costo monetario inválido o negativo/i,
    "Debe rechazar la anulación si la matemática produce costo negativo o inválido"
  );

  // Verificar que el producto y su CPP quedaron intactos
  assert.equal(prod.stockActual, 20);
  assert.equal(prod.costo, 22.5);
  assert.equal(compra.anulada, false);
  console.log("   ✓ Valores monetarios inválidos rechazados; producto y CPP protegidos.\n");
}

console.log("=== TODAS LAS 8 PRUEBAS DE LA CORRECCIÓN DE LA ETAPA 2B.1 PASARON AL 100% ===");
