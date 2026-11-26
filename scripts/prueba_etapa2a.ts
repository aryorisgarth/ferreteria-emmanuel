import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  editarProducto,
  buscarProductos,
  crearAjuste,
  historialAjustes,
  crearConteoFisico,
  aplicarConteoFisico,
  historialConteos,
  detalleConteo,
  recalcularProducto,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: ETAPA 2A (INVENTARIO) ===\n");

const db: DB = libroVacio();

// 1. Catálogo de productos con código de barras y búsqueda
console.log("1. Probando creación de producto con código de barras y búsqueda...");
const prod1 = altaProducto(db, {
  codigo: "HER-001",
  codigoBarras: "7430001234567",
  nombre: "Martillo de Uña 16oz Truper",
  categoria: "Herramientas",
  marca: "Truper",
  unidadMedida: "UNIDAD",
  inventarioInicial: 100,
  costo: 150,
  precio: 220,
  stockMinimo: 10,
});
assert.equal(prod1.codigoBarras, "7430001234567");
assert.equal(prod1.stockActual, 100);

const encontrados = buscarProductos(db, "7430001234567");
assert.equal(encontrados.length, 1);
assert.equal(encontrados[0].id, prod1.id);
console.log("   ✓ Producto creado con código de barras y encontrado por búsqueda.\n");

// 2. Edición preservando existencias e histórico
console.log("2. Probando edición de producto con movimientos históricos (stock intacto)...");
// Simulamos un movimiento histórico en kárdex
db.movimientos.push({
  id: "mov-test-1",
  tipo: "SALIDA",
  fecha: "2026-11-10",
  productoId: prod1.id,
  cantidad: 20,
  entradas: 0,
  salidas: 20,
  stockSaldo: 80,
  unidadMedida: "UNIDAD",
  secuencia: 1,
  origen: "FACTURA",
  numeroReferencia: "FAC-001",
  concepto: "Venta de prueba",
  usuario: "Cajero",
  destinatario: "Cliente Test",
  oficinaId: null,
  actaId: null,
  actaItemId: null,
  solicitudId: null,
  solicitudItemId: null,
  idempotencyKey: null,
  esAuditoria: false,
  estadoAuditoria: "NORMAL",
  createdAt: new Date().toISOString(),
});
recalcularProducto(db, prod1.id);
assert.equal(prod1.stockActual, 80);

// Editamos el producto (cambio de nombre, precio, stockMinimo)
editarProducto(db, prod1.id, {
  codigo: "HER-001",
  codigoBarras: "7430001234567",
  nombre: "Martillo de Uña 16oz Truper Ergonómico (Modificado)",
  categoria: "Herramientas",
  marca: "Truper Pro",
  unidadMedida: "UNIDAD",
  inventarioInicial: 999, // Intentamos enviar un inventario inicial diferente
  costo: 155,
  precio: 230,
  stockMinimo: 15,
});
assert.equal(prod1.stockActual, 80, "El stock actual debió conservarse en 80");
assert.equal(prod1.nombre, "Martillo de Uña 16oz Truper Ergonómico (Modificado)");
assert.equal(prod1.precio, 230);
console.log("   ✓ Edición comercial no alteró existencias (se mantuvieron en 80).\n");

// 3. Ajuste SOBRANTE (+)
console.log("3. Probando registro de ajuste SOBRANTE (+10)...");
const ajusteSobrante = crearAjuste(db, {
  productoId: prod1.id,
  tipo: "SOBRANTE",
  cantidad: 10,
  motivo: "Mercadería encontrada sin registrar en gaveta B2",
  fecha: "2026-11-15",
  usuario: "Admin",
});
assert.equal(ajusteSobrante.signo, 1);
assert.equal(ajusteSobrante.stockPrevio, 80);
assert.equal(ajusteSobrante.stockNuevo, 90);
assert.equal(prod1.stockActual, 90);

// Verificar Kárdex
const movAjuste1 = db.movimientos.find((m) => m.idempotencyKey === `AJUSTE:${ajusteSobrante.id}`);
assert(movAjuste1, "Debe existir un movimiento en Kárdex vinculado al ajuste");
assert.equal(movAjuste1.tipo, "AJUSTE");
assert.equal(movAjuste1.entradas, 10);
assert.equal(movAjuste1.salidas, 0);
assert.equal(movAjuste1.stockSaldo, 90);
console.log("   ✓ Ajuste SOBRANTE (+10) incrementó existencias a 90 y registró entrada en Kárdex.\n");

// 4. Ajuste FALTANTE (-)
console.log("4. Probando registro de ajuste FALTANTE (-5)...");
const ajusteFaltante = crearAjuste(db, {
  productoId: prod1.id,
  tipo: "FALTANTE",
  cantidad: 5,
  motivo: "Diferencia identificada en revisión de vitrina",
  fecha: "2026-11-16",
  usuario: "Bodeguero",
});
assert.equal(ajusteFaltante.signo, -1);
assert.equal(ajusteFaltante.stockPrevio, 90);
assert.equal(ajusteFaltante.stockNuevo, 85);
assert.equal(prod1.stockActual, 85);

const movAjuste2 = db.movimientos.find((m) => m.idempotencyKey === `AJUSTE:${ajusteFaltante.id}`);
assert(movAjuste2, "Debe existir movimiento en Kárdex para el faltante");
assert.equal(movAjuste2.entradas, 0);
assert.equal(movAjuste2.salidas, 5);
assert.equal(movAjuste2.stockSaldo, 85);
console.log("   ✓ Ajuste FALTANTE (-5) redujo existencias a 85 y registró salida en Kárdex.\n");

// 5. Ajustes por DAÑO y MERMA
console.log("5. Probando ajustes por DAÑO (-2) y MERMA (-1)...");
const ajusteDano = crearAjuste(db, {
  productoId: prod1.id,
  tipo: "DANO",
  cantidad: 2,
  motivo: "Mango roto por caída en estante",
  fecha: "2026-11-16",
  usuario: "Bodeguero",
});
assert.equal(ajusteDano.signo, -1);
assert.equal(prod1.stockActual, 83);

const ajusteMerma = crearAjuste(db, {
  productoId: prod1.id,
  tipo: "MERMA",
  cantidad: 1,
  motivo: "Oxidación por humedad ambiental",
  fecha: "2026-11-16",
  usuario: "Bodeguero",
});
assert.equal(ajusteMerma.signo, -1);
assert.equal(prod1.stockActual, 82);
console.log("   ✓ Ajustes de DAÑO y MERMA dedujeron existencias a 82 correctamente.\n");

// 6. Política de costeo y validaciones
console.log("6. Probando política de costeo en producto con costo cero...");
const prodSinCosto = altaProducto(db, {
  codigo: "GEN-002",
  nombre: "Tornillo Genérico sin costo inicial",
  categoria: "Ferretería",
  marca: "Genérica",
  unidadMedida: "UNIDAD",
  inventarioInicial: 0,
  costo: 0,
  precio: 5,
  stockMinimo: 50,
});

// Incrementar sin costo de referencia debe fallar
assert.throws(
  () => {
    crearAjuste(db, {
      productoId: prodSinCosto.id,
      tipo: "SOBRANTE",
      cantidad: 100,
      motivo: "Ingreso sin costo",
      fecha: "2026-11-16",
      usuario: "Admin",
    });
  },
  ReglaBodegaError,
  "Debe fallar si no se proporciona costo de referencia para incremento de producto a costo 0"
);

// Con costo de referencia debe tener éxito y fijar costo
const ajusteConRef = crearAjuste(db, {
  productoId: prodSinCosto.id,
  tipo: "SOBRANTE",
  cantidad: 100,
  motivo: "Donación con valoración estimada",
  fecha: "2026-11-16",
  usuario: "Admin",
  costoReferencia: 2.5,
});
assert.equal(ajusteConRef.costoUnitario, 2.5);
assert.equal(prodSinCosto.costo, 2.5);
assert.equal(prodSinCosto.stockActual, 100);
console.log("   ✓ Se exigió costo de referencia (> 0) y se valoró el ingreso adecuadamente.\n");

// 7. Motivo obligatorio
console.log("7. Probando validación de motivo obligatorio...");
assert.throws(
  () => {
    crearAjuste(db, {
      productoId: prod1.id,
      tipo: "SOBRANTE",
      cantidad: 1,
      motivo: "   ",
      fecha: "2026-11-16",
      usuario: "Admin",
    });
  },
  ReglaBodegaError,
  "Debe fallar si el motivo está vacío"
);
console.log("   ✓ Motivo vacío rechazado correctamente con ReglaBodegaError.\n");

// 8. Protección contra stock negativo y rollback atómico
console.log("8. Probando protección contra stock negativo en ajuste...");
const stockAntes = prod1.stockActual;
const movsAntes = db.movimientos.length;
const ajustesAntes = db.ajustesInventario?.length ?? 0;

assert.throws(
  () => {
    // Intentar deducir 1000 cuando solo hay 82
    crearAjuste(db, {
      productoId: prod1.id,
      tipo: "FALTANTE",
      cantidad: 1000,
      motivo: "Intento de deducción excesiva",
      fecha: "2026-11-16",
      usuario: "Admin",
    });
  },
  ReglaBodegaError,
  "Debe fallar por stock insuficiente"
);

assert.equal(prod1.stockActual, stockAntes, "El stock no debió cambiar");
assert.equal(db.movimientos.length, movsAntes, "No debieron agregarse movimientos");
assert.equal(db.ajustesInventario?.length, ajustesAntes, "No debió agregarse el ajuste fallido");
console.log("   ✓ Transacción revertida atómicamente al intentar deducir más stock del disponible.\n");

// 9. Conteo físico no altera existencias al guardar borrador
console.log("9. Probando creación de Conteo Físico en estado BORRADOR (sin modificar stock)...");
const conteoBorrador = crearConteoFisico(db, {
  fecha: "2026-11-16",
  notas: "Auditoría física de prueba",
  usuario: "Auditor Externo",
  items: [
    {
      productoId: prod1.id,
      conteoFisico: 80, // Sistema tiene 82, físico 80 (Diferencia -2)
      observacion: "Faltan 2 unidades en estante",
    },
    {
      productoId: prodSinCosto.id,
      conteoFisico: 110, // Sistema tiene 100, físico 110 (Diferencia +10)
      observacion: "Caja extra en bodega",
    },
  ],
});
assert.equal(conteoBorrador.estado, "BORRADOR");
assert.equal(prod1.stockActual, 82, "El stock de prod1 no debe cambiar en borrador");
assert.equal(prodSinCosto.stockActual, 100, "El stock de prodSinCosto no debe cambiar en borrador");
console.log("   ✓ Conteo Físico guardado en BORRADOR sin alterar existencias ni Kárdex.\n");

// 10. Aplicación de conteo físico y generación de ajustes atómicos
console.log("10. Probando aplicación de Conteo Físico (generación de ajustes e idempotencia)...");
const resultadoAplicacion = aplicarConteoFisico(db, conteoBorrador.id, "Admin Autorizador");
assert.equal(resultadoAplicacion.conteo.estado, "APLICADO");
assert.equal(resultadoAplicacion.ajustesGenerados.length, 2);

// Verificar nuevos stocks
assert.equal(prod1.stockActual, 80, "El stock de prod1 debió conciliarse a 80");
assert.equal(prodSinCosto.stockActual, 110, "El stock de prodSinCosto debió conciliarse a 110");

// Verificar que el ajuste generado tiene conteoId vinculado
for (const aj of resultadoAplicacion.ajustesGenerados) {
  assert.equal(aj.conteoId, conteoBorrador.id);
}

// Intentar aplicar nuevamente debe fallar (idempotencia)
assert.throws(
  () => {
    aplicarConteoFisico(db, conteoBorrador.id, "Admin Autorizador");
  },
  ReglaBodegaError,
  "No debe permitir aplicar un conteo ya aplicado"
);
console.log("   ✓ Conteo aplicado exitosamente, ajustes vinculados y protegida la idempotencia.\n");

console.log("=== TODAS LAS PRUEBAS DE LA ETAPA 2A PASARON AL 100% ===");
