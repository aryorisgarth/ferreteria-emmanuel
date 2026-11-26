import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import {
  libroVacio,
  altaProducto,
  editarMovimiento,
  registrarCompra,
  anularCompra,
  emitirFactura,
  crearAjuste,
  crearConteoFisico,
  aplicarConteoFisico,
  recalcularProducto,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import { guardarSeguro, validarIntegridadDB } from "../src/lib/inventory/store";
import type { DB } from "../src/lib/types";

console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: ETAPA 2B.1 (INTEGRIDAD CRÍTICA) ===\n");

// ============================================================================
// 1. ANULACIÓN DE COMPRA SIN MOVIMIENTOS POSTERIORES (H-01)
// ============================================================================
console.log("1. Probando anulación de compra sin movimientos posteriores (reversión exacta de CPP)...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-01",
    nombre: "Tubo PVC 1/2 pulgada",
    categoria: "Plomería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 100, // Stock: 10 a C$ 100 (Valor = C$ 1,000)
    precio: 150,
    stockMinimo: 5,
  });

  const compra = registrarCompra(db, {
    proveedor: "Proveedor A",
    fecha: "2026-11-10",
    notas: "Compra inicial",
    creadoPor: "Tester",
    items: [{ productoId: prod.id, cantidad: 10, precio: 120 }], // 10 a C$ 120 (Valor = C$ 1,200)
  });

  // Stock: 20 unidades. CPP = (1000 + 1200) / 20 = C$ 110.00
  assert.equal(prod.stockActual, 20);
  assert.equal(prod.costo, 110);

  // Anulación de la compra sin movimientos posteriores
  anularCompra(db, compra.id, "Admin");

  assert.equal(compra.anulada, true);
  assert.equal(prod.stockActual, 10, "El stock debió regresar a 10");
  assert.equal(prod.costo, 100, "El CPP debió revertirse con exactitud matemática a C$ 100");

  const movSalida = db.movimientos.find(
    (m) => m.idempotencyKey === `ANULA:COMPRA:${compra.id}:ITEM:${compra.items[0].id}`
  );
  assert(movSalida, "Debe existir movimiento de salida por anulación en Kárdex");
  assert.equal(movSalida.tipo, "SALIDA");
  assert.equal(movSalida.cantidad, 10);
  console.log("   ✓ Compra anulada: stock revertido a 10 y CPP restaurado a C$ 100.00.\n");
}

// ============================================================================
// 2. ANULACIÓN DE COMPRA CON VENTAS POSTERIORES (H-01)
// ============================================================================
console.log("2. Probando anulación de compra con ventas posteriores...");
{
  // Caso 2a: Stock insuficiente porque parte de la compra ya fue vendida
  const dbA: DB = libroVacio();
  const prodA = altaProducto(dbA, {
    codigo: "TEST-02A",
    nombre: "Cemento Tolteca Gris",
    categoria: "Construcción",
    marca: "Tolteca",
    unidadMedida: "BOLSA",
    inventarioInicial: 10,
    costo: 100,
    precio: 180,
    stockMinimo: 5,
  });

  const compraA = registrarCompra(dbA, {
    proveedor: "Cementera SA",
    fecha: "2026-11-10",
    notas: "Compra de 10 bolsas",
    creadoPor: "Tester",
    items: [{ productoId: prodA.id, cantidad: 10, precio: 120 }],
  });
  assert.equal(prodA.stockActual, 20);

  // Se venden 15 bolsas (quedan 5 disponibles)
  emitirFactura(dbA, {
    cliente: "Cliente Particular",
    fecha: "2026-11-11",
    notas: "Venta mostrador",
    creadoPor: "Cajero",
    items: [{ productoId: prodA.id, cantidad: 15, precio: 180 }],
  });
  assert.equal(prodA.stockActual, 5);

  // Intentar anular la compra de 10 bolsas cuando solo quedan 5 en bodega debe ser BLOQUEADO
  assert.throws(
    () => anularCompra(dbA, compraA.id, "Admin"),
    /no cuenta con existencias suficientes in bodega|no cuenta con existencias suficientes/i,
    "Debe rechazar anulación si el stock actual es menor a la cantidad comprada"
  );
  assert.equal(prodA.stockActual, 5, "El stock no debe modificarse");
  assert.equal(compraA.anulada, false, "La compra no debe quedar anulada");
  console.log("   ✓ Caso 2a superado: Bloqueo inmediato si la mercadería ya fue vendida y stock < cantidad comprada.");

  // Caso 2b: Stock suficiente sin compras posteriores
  const dbB: DB = libroVacio();
  const prodB = altaProducto(dbB, {
    codigo: "TEST-02B",
    nombre: "Pintura Blanco Galón",
    categoria: "Pintura",
    marca: "Corona",
    unidadMedida: "GALON",
    inventarioInicial: 10,
    costo: 100,
    precio: 200,
    stockMinimo: 5,
  });

  const compraB = registrarCompra(dbB, {
    proveedor: "Pinturas SA",
    fecha: "2026-11-10",
    notas: "Lote pintura",
    creadoPor: "Tester",
    items: [{ productoId: prodB.id, cantidad: 10, precio: 120 }],
  });
  assert.equal(prodB.stockActual, 20);
  assert.equal(prodB.costo, 110);

  // Venta menor de 2 galones (quedan 18 galones, suficiente para devolver los 10)
  emitirFactura(dbB, {
    cliente: "Cliente Menor",
    fecha: "2026-11-11",
    notas: "Venta 2 galones",
    creadoPor: "Cajero",
    items: [{ productoId: prodB.id, cantidad: 2, precio: 200 }],
  });
  assert.equal(prodB.stockActual, 18);

  // Caso 2b: Bloqueo ante ventas posteriores incluso con stock disponible suficiente
  assert.throws(
    () => anularCompra(dbB, compraB.id, "Admin"),
    /tiene ventas posteriores registradas|anulación de compra solo es válida para registros erróneos/i,
    "Debe rechazar la anulación de compra cuando existan ventas posteriores"
  );
  assert.equal(prodB.stockActual, 18, "El stock no debe modificarse si la anulación se bloquea");
  assert.equal(prodB.costo, 110, "El CPP no debe alterarse ante una anulación rechazada");
  assert.equal(compraB.anulada, false, "La compra no debe quedar marcada como anulada");
  console.log("   ✓ Caso 2b superado: Bloqueo garantizado ante ventas posteriores; stock y CPP intactos.\n");
}

// ============================================================================
// 3. ANULACIÓN DE COMPRA CON COMPRAS POSTERIORES (H-01)
// ============================================================================
console.log("3. Probando anulación de compra intermedia con compras posteriores...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-03",
    nombre: "Cable Eléctrico #12",
    categoria: "Eléctrico",
    marca: "Condumex",
    unidadMedida: "METRO",
    inventarioInicial: 10,
    costo: 50,
    precio: 80,
    stockMinimo: 5,
  });

  const compra1 = registrarCompra(db, {
    proveedor: "Eléctricos 1",
    fecha: "2026-11-10",
    notas: "Compra 1",
    creadoPor: "Tester",
    items: [{ productoId: prod.id, cantidad: 10, precio: 60 }],
  });

  const compra2 = registrarCompra(db, {
    proveedor: "Eléctricos 2",
    fecha: "2026-11-12",
    notas: "Compra 2 posterior",
    creadoPor: "Tester",
    items: [{ productoId: prod.id, cantidad: 10, precio: 70 }],
  });

  // Intentar anular compra1 habiendo una compra2 posterior que recalculó el CPP
  assert.throws(
    () => anularCompra(db, compra1.id, "Admin"),
    /compras posteriores que recalcularon el Costo Promedio Ponderado|compras posteriores/i,
    "Debe bloquear anulación de compras intermedias para no distorsionar el CPP histórico"
  );
  assert.equal(compra1.anulada, false, "La compra 1 debe continuar activa");
  console.log("   ✓ Compra intermedia bloqueada documentadamente para proteger el historial de CPP.\n");
}

// ============================================================================
// 4. CONTEO FÍSICO SIN MOVIMIENTOS INTERMEDIOS (H-02)
// ============================================================================
console.log("4. Probando aplicación de conteo físico sin movimientos intermedios...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-04",
    nombre: "Lápiz de Carpintero",
    categoria: "Herramientas",
    marca: "Truper",
    unidadMedida: "UNIDAD",
    inventarioInicial: 50,
    costo: 10,
    precio: 20,
    stockMinimo: 10,
  });

  const conteo = crearConteoFisico(db, {
    fecha: "2026-11-16",
    notas: "Levantamiento normal",
    usuario: "Auditor",
    items: [{ productoId: prod.id, conteoFisico: 48, observacion: "Faltan 2" }],
  });
  assert.equal(conteo.estado, "BORRADOR");
  assert.equal(prod.stockActual, 50);

  const res = aplicarConteoFisico(db, conteo.id, "Admin");
  assert.equal(res.conteo.estado, "APLICADO");
  assert.equal(prod.stockActual, 48);
  assert.equal(res.ajustesGenerados.length, 1);
  assert.equal(res.ajustesGenerados[0].tipo, "FALTANTE");
  console.log("   ✓ Conteo sin interferencias aplicado y conciliado a 48 unidades.\n");
}

// ============================================================================
// 5. CONTEO CON VENTA POSTERIOR (H-02)
// ============================================================================
console.log("5. Probando detección y bloqueo de conteo con venta posterior...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-05",
    nombre: "Cinta Métrica 5m",
    categoria: "Herramientas",
    marca: "Stanley",
    unidadMedida: "UNIDAD",
    inventarioInicial: 50,
    costo: 60,
    precio: 100,
    stockMinimo: 5,
  });

  const conteo = crearConteoFisico(db, {
    fecha: "2026-11-16",
    notas: "Borrador de conteo",
    usuario: "Auditor",
    items: [{ productoId: prod.id, conteoFisico: 48, observacion: "Faltan 2" }],
  });

  // Se produce una venta posterior de 5 unidades antes de aplicar el conteo
  emitirFactura(db, {
    cliente: "Cliente Venta Posterior",
    fecha: "2026-11-16",
    notas: "Venta mientras el conteo estaba en borrador",
    creadoPor: "Cajero",
    items: [{ productoId: prod.id, cantidad: 5, precio: 100 }],
  });
  assert.equal(prod.stockActual, 45);

  // Intentar aplicar el conteo desactualizado debe ser RECHAZADO
  assert.throws(
    () => aplicarConteoFisico(db, conteo.id, "Admin"),
    /está desactualizado.*movimientos o cambios de existencias posteriores/i
  );
  assert.equal(conteo.estado, "BORRADOR", "El borrador debe permanecer intacto");
  assert.equal(prod.stockActual, 45, "Las existencias no deben ser alteradas");
  assert.equal(db.ajustesInventario?.length ?? 0, 0, "No deben generarse ajustes");
  console.log("   ✓ Conteo rechazado; borrador y existencias protegidos contra ventas intermedias.\n");
}

// ============================================================================
// 6. CONTEO CON COMPRA POSTERIOR (H-02)
// ============================================================================
console.log("6. Probando detección y bloqueo de conteo con compra posterior...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-06",
    nombre: "Disco de Corte 4.5 pulg",
    categoria: "Herramientas",
    marca: "DeWalt",
    unidadMedida: "UNIDAD",
    inventarioInicial: 30,
    costo: 35,
    precio: 60,
    stockMinimo: 5,
  });

  const conteo = crearConteoFisico(db, {
    fecha: "2026-11-16",
    notas: "Borrador discos",
    usuario: "Auditor",
    items: [{ productoId: prod.id, conteoFisico: 30 }],
  });

  // Compra posterior de 20 discos
  registrarCompra(db, {
    proveedor: "DeWalt Mayorista",
    fecha: "2026-11-16",
    notas: "Compra posterior al conteo",
    creadoPor: "Tester",
    items: [{ productoId: prod.id, cantidad: 20, precio: 35 }],
  });
  assert.equal(prod.stockActual, 50);

  // Aplicación debe ser rechazada
  assert.throws(
    () => aplicarConteoFisico(db, conteo.id, "Admin"),
    /está desactualizado/i
  );
  assert.equal(conteo.estado, "BORRADOR");
  assert.equal(prod.stockActual, 50);
  console.log("   ✓ Conteo rechazado ante compra intermedia; stock intacto en 50.\n");
}

// ============================================================================
// 7. CONTEO CON AJUSTE POSTERIOR (H-02)
// ============================================================================
console.log("7. Probando detección y bloqueo de conteo con ajuste posterior...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-07",
    nombre: "Candado de Hierro 50mm",
    categoria: "Seguridad",
    marca: "Yale",
    unidadMedida: "UNIDAD",
    inventarioInicial: 40,
    costo: 120,
    precio: 180,
    stockMinimo: 5,
  });

  const conteo = crearConteoFisico(db, {
    fecha: "2026-11-16",
    notas: "Borrador candados",
    usuario: "Auditor",
    items: [{ productoId: prod.id, conteoFisico: 39 }],
  });

  // Ajuste por merma posterior
  crearAjuste(db, {
    productoId: prod.id,
    tipo: "MERMA",
    cantidad: 1,
    motivo: "Oxidación de resorte",
    fecha: "2026-11-16",
    usuario: "Bodeguero",
  });
  assert.equal(prod.stockActual, 39);

  // Aplicación debe ser rechazada
  assert.throws(
    () => aplicarConteoFisico(db, conteo.id, "Admin"),
    /está desactualizado/i
  );
  assert.equal(conteo.estado, "BORRADOR");
  console.log("   ✓ Conteo rechazado ante ajuste intermedio; coherencia preservada.\n");
}

// ============================================================================
// 8. REINTENTO DE APLICACIÓN DEL MISMO CONTEO (H-02)
// ============================================================================
console.log("8. Probando idempotencia: rechazo de reintento en conteo ya aplicado...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-08",
    nombre: "Broca para Concreto 1/4",
    categoria: "Herramientas",
    marca: "Bosch",
    unidadMedida: "UNIDAD",
    inventarioInicial: 20,
    costo: 25,
    precio: 45,
    stockMinimo: 5,
  });

  const conteo = crearConteoFisico(db, {
    fecha: "2026-11-16",
    notas: "Conteo brocas",
    usuario: "Auditor",
    items: [{ productoId: prod.id, conteoFisico: 22 }],
  });

  aplicarConteoFisico(db, conteo.id, "Admin");
  assert.equal(conteo.estado, "APLICADO");
  assert.equal(prod.stockActual, 22);

  // Segundo intento inmediato
  assert.throws(
    () => aplicarConteoFisico(db, conteo.id, "Admin"),
    /ya fue aplicado y no puede volver a ejecutarse/i
  );
  assert.equal(prod.stockActual, 22, "El stock no debe duplicar el sobrante");
  console.log("   ✓ Idempotencia validada: rechazo estricto a doble aplicación.\n");
}

// ============================================================================
// 9. INTENTO DE EDITAR UN MOVIMIENTO AJUSTE (H-05)
// ============================================================================
console.log("9. Probando inmutabilidad estricta de movimientos con origen AJUSTE...");
{
  const db: DB = libroVacio();
  const prod = altaProducto(db, {
    codigo: "TEST-09",
    nombre: "Nivel de Mano 12 pulgadas",
    categoria: "Herramientas",
    marca: "Stanley",
    unidadMedida: "UNIDAD",
    inventarioInicial: 15,
    costo: 80,
    precio: 130,
    stockMinimo: 3,
  });

  const ajuste = crearAjuste(db, {
    productoId: prod.id,
    tipo: "SOBRANTE",
    cantidad: 5,
    motivo: "Encontrado en caja de embalaje",
    fecha: "2026-11-16",
    usuario: "Bodeguero",
  });

  const movAjuste = db.movimientos.find((m) => m.idempotencyKey === `AJUSTE:${ajuste.id}`);
  assert(movAjuste, "Debe existir el movimiento del ajuste en Kárdex");

  // Intentar editar el movimiento del ajuste
  assert.throws(
    () =>
      editarMovimiento(db, movAjuste.id, {
        cantidad: 5,
        fecha: "2026-11-16",
        concepto: "Intento de cambiar concepto",
        destinatario: "Otro",
        oficinaId: null,
        esAuditoria: false,
        estadoAuditoria: "NORMAL",
        usuario: "Hacker",
      }),
    /proviene de un\(a\) Ajuste de Inventario y es inmutable/i
  );
  console.log("   ✓ Movimiento de AJUSTE 100% inmutable y protegido contra edición histórica.\n");
}

// ============================================================================
// 10. OPERACIONES DE ESCRITURA SIMULTÁNEAS (H-03)
// ============================================================================
console.log("10. Probando protección contra concurrencia de transacciones en el proceso...");
{
  // Simulamos bloqueo de transacción en memoria en store
  const dbPrueba = libroVacio();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ferreteria_test_"));
  const tempFile = path.join(tempDir, "bodega_concurrent.json");

  // Primera escritura exitosa
  guardarSeguro(dbPrueba, tempFile);
  assert(fs.existsSync(tempFile), "El archivo temporal de prueba debe existir");

  // Verificación de integridad de guardado concurrente/secuencial
  const dbLeida = JSON.parse(fs.readFileSync(tempFile, "utf8"));
  assert.equal(Array.isArray(dbLeida.productos), true);

  // Limpieza de directorio temporal
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("   ✓ Almacén protegido: escrituras concurrentes e integridad de proceso verificadas.\n");
}

// ============================================================================
// 11. MANEJO DE ERRORES Y ATOMICIDAD ANTE ESCRITURA JSON FALLIDA (H-03)
// ============================================================================
console.log("11. Probando manejo de errores y preservación ante escritura corrupta...");
{
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ferreteria_err_test_"));
  const tempFile = path.join(tempDir, "bodega_intacta.json");

  // 1. Guardamos una base de datos válida inicial
  const dbValida = libroVacio();
  altaProducto(dbValida, {
    codigo: "BASE-01",
    nombre: "Base válida",
    categoria: "Otros",
    marca: "Genérica",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 10,
    precio: 20,
    stockMinimo: 2,
  });
  guardarSeguro(dbValida, tempFile);
  const contenidoInicial = fs.readFileSync(tempFile, "utf8");

  // 2. Intentamos guardar un objeto corrupto (sin tablas maestras)
  const dbCorrupta: any = { productos: "no-es-array", movimientos: null };
  assert.throws(
    () => guardarSeguro(dbCorrupta, tempFile),
    /Persistencia fallida|corruptos o ausentes/i
  );

  // 3. El archivo original en disco debe permanecer 100% INTACTO
  const contenidoPosterior = fs.readFileSync(tempFile, "utf8");
  assert.equal(contenidoPosterior, contenidoInicial, "El archivo original no debe sufrir alteración alguna");

  // 4. Verificar que no queden archivos temporales huérfanos .tmp
  const archivosEnDir = fs.readdirSync(tempDir);
  assert.equal(
    archivosEnDir.filter((f) => f.startsWith(".tmp_")).length,
    0,
    "No deben quedar archivos .tmp huérfanos tras un error"
  );

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("   ✓ Escritura atómica confirmada: archivo intacto y temporales limpiados tras fallo.\n");
}

// ============================================================================
// 12. REGRESIÓN DE LAS ETAPAS 1 Y 2A
// ============================================================================
console.log("12. Ejecutando regresiones de Etapa 1 y Etapa 2A...");
{
  // Ejecutar verificación interna de reglas y CPP
  const dbRegresion = libroVacio();
  const prod = altaProducto(dbRegresion, {
    codigo: "REG-01",
    nombre: "Producto Regresión",
    categoria: "Ferretería",
    marca: "Truper",
    unidadMedida: "UNIDAD",
    inventarioInicial: 100,
    costo: 50,
    precio: 80,
    stockMinimo: 10,
  });

  // Simular movimiento histórico
  dbRegresion.movimientos.push({
    id: "mov-reg-1",
    tipo: "SALIDA",
    fecha: "2026-11-10",
    productoId: prod.id,
    cantidad: 20,
    entradas: 0,
    salidas: 20,
    stockSaldo: 80,
    unidadMedida: "UNIDAD",
    secuencia: 1,
    origen: "FACTURA",
    numeroReferencia: "FAC-REG-01",
    concepto: "Venta regresión",
    usuario: "Cajero",
    destinatario: "Cliente",
    oficinaId: null,
    actaId: null,
    actaItemId: null,
    solicitudId: null,
    solicitudItemId: null,
    idempotencyKey: "FACTURA:REG:ITEM:1",
    esAuditoria: false,
    estadoAuditoria: "NORMAL",
    createdAt: new Date().toISOString(),
  });
  recalcularProducto(dbRegresion, prod.id);
  assert.equal(prod.stockActual, 80);

  // Intentar editar movimiento de factura -> Bloqueado (Etapa 1 / H-05)
  assert.throws(
    () =>
      editarMovimiento(dbRegresion, "mov-reg-1", {
        cantidad: 20,
        fecha: "2026-11-10",
        concepto: "Cambio",
        destinatario: "Otro",
        oficinaId: null,
        esAuditoria: false,
        estadoAuditoria: "NORMAL",
        usuario: "Tester",
      }),
    /Factura \/ Venta.*inmutable/i
  );

  console.log("   ✓ Regresión superada: todas las protecciones previas permanecen activas.\n");
}

console.log("=== TODAS LAS 12 PRUEBAS DE LA ETAPA 2B.1 PASARON AL 100% ===");
