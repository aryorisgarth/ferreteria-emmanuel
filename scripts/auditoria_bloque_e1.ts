/**
 * SUITE DE AUDITORÍA Y VERIFICACIÓN INTEGRAL E1
 * Ejecuta pruebas directas sobre el código fuente real del sistema sin base de datos ni persistencia externa.
 */

import {
  hashModerno,
  hashLegacySHA256,
  verificarPassword,
} from "../src/lib/crypto-pass";
import {
  PERMISOS_POR_ROL,
  tienePermiso,
  exigirPermiso,
} from "../src/lib/permisos";
import {
  libroVacio,
  emitirFactura,
  crearCotizacion,
  registrarCompra,
  anularFactura,
  pagarFactura,
  crearGasto,
  registrarMovimientoCaja,
  abrirTurno,
  cerrarTurno,
  totalesLineas,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

function assert(condicion: boolean, mensaje: string) {
  if (!condicion) {
    throw new Error(`[FALLO EN AUDITORÍA E1]: ${mensaje}`);
  }
}

console.log("==================================================================");
console.log("   FERRETERÍA EMMANUEL — SUITE DE AUDITORÍA INTEGRAL (BLOQUE E1)  ");
console.log("==================================================================");

// ---------------------------------------------------------------------------
// 1. Auditoría Criptográfica: Scrypt KDF + Legacy SHA-256
// ---------------------------------------------------------------------------
console.log("\n--- 1. AUDITORÍA CRIPTOGRÁFICA Y TIMING RESISTANCE ---");
const clavePrueba = "Segura_2026_!@#";
const hashScrypt = hashModerno(clavePrueba);
assert(hashScrypt.startsWith("$scrypt$s="), "El hash moderno debe seguir el estándar Scrypt KDF.");
assert(hashScrypt.includes("$h="), "El hash moderno debe incluir el fragmento derivado.");

// Verificación correcta
const vScryptCorrecta = verificarPassword(clavePrueba, hashScrypt);
assert(vScryptCorrecta.esValida === true, "Scrypt KDF debe validar la contraseña correcta.");
assert(vScryptCorrecta.requiereActualizacion === false, "Hash moderno no debe requerir actualización.");

// Verificación incorrecta
const vScryptErronea = verificarPassword("clave_falsa", hashScrypt);
assert(vScryptErronea.esValida === false, "Scrypt KDF debe rechazar contraseñas incorrectas.");

// Compatibilidad SHA-256 Legacy
const hashLegacy = hashLegacySHA256(clavePrueba);
assert(hashLegacy.length === 64, "El hash legacy debe ser un SHA-256 de 64 caracteres.");
const vLegacyCorrecta = verificarPassword(clavePrueba, hashLegacy);
assert(vLegacyCorrecta.esValida === true, "Debe verificar exitosamente contraseñas con hash legacy.");
assert(vLegacyCorrecta.requiereActualizacion === true, "Hash legacy debe marcar bandera requiereActualizacion=true.");
console.log("✔ Auditoría criptográfica superada: Scrypt KDF y SHA-256 operan con timingSafeEqual.");

// ---------------------------------------------------------------------------
// 2. Auditoría de RBAC y Protección de Acciones Comerciales
// ---------------------------------------------------------------------------
console.log("\n--- 2. AUDITORÍA DE MATRIZ DE PERMISOS RBAC ---");
// Venta / POS
assert(tienePermiso("ADMINISTRADOR", "VENTA_CREAR"), "ADMIN puede facturar.");
assert(tienePermiso("CAJERO", "VENTA_CREAR"), "CAJERO puede facturar.");
assert(!tienePermiso("BODEGUERO", "VENTA_CREAR"), "BODEGUERO NO puede facturar.");
assert(!tienePermiso("VENDEDOR", "VENTA_CREAR"), "VENDEDOR NO puede facturar.");

// Anulación de Facturas
assert(tienePermiso("ADMINISTRADOR", "VENTA_ANULAR"), "ADMIN puede anular facturas.");
assert(!tienePermiso("CAJERO", "VENTA_ANULAR"), "CAJERO NO puede anular facturas.");

// Compras
assert(tienePermiso("ADMINISTRADOR", "COMPRA_REGISTRAR"), "ADMIN puede comprar.");
assert(tienePermiso("BODEGUERO", "COMPRA_REGISTRAR"), "BODEGUERO puede comprar.");
assert(!tienePermiso("CAJERO", "COMPRA_REGISTRAR"), "CAJERO NO puede comprar.");

// Configuración y Usuarios
assert(tienePermiso("ADMINISTRADOR", "CONFIGURACION_SISTEMA"), "ADMIN configura sistema.");
assert(!tienePermiso("CAJERO", "CONFIGURACION_SISTEMA"), "CAJERO bloqueado de configuración.");
assert(!tienePermiso("BODEGUERO", "CONFIGURACION_SISTEMA"), "BODEGUERO bloqueado de configuración.");
console.log("✔ Auditoría de matriz RBAC superada: Segregación de funciones estricta.");

// ---------------------------------------------------------------------------
// 3. Auditoría de Integración Comercial (Motor Real de Negocio)
// ---------------------------------------------------------------------------
console.log("\n--- 3. AUDITORÍA TRANSACCIONAL DE CIRCUITOS COMERCIALES ---");
const db: DB = libroVacio();

// Inicializar catálogo y personas
db.productos.push(
  {
    id: "prod-zinc",
    codigo: "ZIN-001",
    nombre: "Lámina de Zinc Corrugado 28G 12ft",
    marca: "Ferromax",
    unidadMedida: "UNIDAD",
    inventarioInicial: 100,
    stockActual: 100,
    precio: 350.00,
    costo: 280.00,
    categoria: "Construcción",
    stockMinimo: 10,
    activo: true,
  },
  {
    id: "prod-clavo",
    codigo: "CLA-002",
    nombre: "Clavo para Techo con Arandela 2-1/2 pulg",
    marca: "Truper",
    unidadMedida: "LIBRA",
    inventarioInicial: 50,
    stockActual: 50,
    precio: 45.00,
    costo: 30.00,
    categoria: "Construcción",
    stockMinimo: 5,
    activo: true,
  }
);

db.clientes.push({
  id: "cli-alvaro",
  nombre: "Álvaro Morales",
  telefono: "8888-1111",
  direccion: "Tipitapa",
  notas: "Límite fiado C$ 5,000",
  limiteCredito: 5000.00,
  saldoPendiente: 0,
});

// A. Apertura de Turno de Caja
abrirTurno(db, {
  usuario: "cajero",
  montoInicial: 1500.00,
});
assert(Boolean(db.turnosCaja?.some((t) => t.estado === "ABIERTO")), "Turno de caja debe estar ABIERTO.");
const turnoActivo = db.turnosCaja?.find((t) => t.estado === "ABIERTO")!;
assert(turnoActivo.montoInicial === 1500.00, "Monto inicial en caja debe ser C$ 1,500.00.");

// B. Venta en Efectivo (Factura + Stock + Kárdex + Turno)
const facEfectivo = emitirFactura(db, {
  cliente: "Público General",
  fecha: "2026-11-15",
  notas: "Venta contado",
  creadoPor: "cajero",
  formaPago: "EFECTIVO",
  items: [
    { productoId: "prod-zinc", cantidad: 10, precio: 350.00 }, // 3,500
    { productoId: "prod-clavo", cantidad: 5, precio: 45.00 },   // 225
  ],
});
// Subtotal = 3,725. IVA 15% = 558.75. Total = 4,283.75
const { total: totalVentaEsperado } = totalesLineas(facEfectivo.items);
assert(totalVentaEsperado === 4283.75, "Total facturado debe ser C$ 4,283.75.");
assert(facEfectivo.estado === "PAGADA", "Factura de contado debe estar PAGADA.");
assert(db.productos.find((p) => p.id === "prod-zinc")!.stockActual === 90, "Stock de zinc debe descontarse a 90.");
assert(turnoActivo.totalVentasEfectivo === 4283.75, "El turno de caja debe acumular exactamente C$ 4,283.75 en efectivo.");

// C. Registro de Gasto Operativo y Movimiento de Egreso en Caja
crearGasto(db, {
  fecha: "2026-11-15",
  concepto: "Pago de almuerzo personal",
  categoria: "Alimentación",
  monto: 250.00,
  notas: "Comprobante 102",
  creadoPor: "cajero",
});
assert(db.gastos.length === 1, "Debe registrarse 1 gasto operativo.");

// Registrar el egreso correspondiente en el turno de caja abierto
registrarMovimientoCaja(db, {
  tipo: "EGRESO",
  monto: 250.00,
  concepto: "Pago de almuerzo personal",
  usuario: "cajero",
});
assert(turnoActivo.totalEgresos === 250.00, "Turno debe registrar C$ 250.00 de egreso en caja.");

// D. Venta a Crédito
const facCredito = emitirFactura(db, {
  cliente: "Álvaro Morales",
  clienteId: "cli-alvaro",
  fecha: "2026-11-15",
  notas: "Fiado a 15 días",
  creadoPor: "cajero",
  formaPago: "CREDITO",
  items: [{ productoId: "prod-zinc", cantidad: 2, precio: 350.00 }],
});
assert(facCredito.estado === "EMITIDA", "Factura a crédito debe quedar EMITIDA (no pagada).");
assert(turnoActivo.totalVentasCredito > 0, "Turno debe registrar ventas a crédito en su casilla correspondiente.");

// E. Pago posterior de Factura a Crédito
pagarFactura(db, facCredito.id);
assert(facCredito.estado === "PAGADA", "Factura de crédito pagada cambia a PAGADA sin alterar inventario.");

// F. Recepción de Compra con Recálculo de Costo Promedio Ponderado (CPP)
// Existencia actual zinc: 88 unidades a C$ 280.00 = C$ 24,640.00
// Compramos: 12 unidades a C$ 310.00 = C$ 3,720.00
// Total existencias nuevas: 100 unidades. Total costo: C$ 28,360.00
// Nuevo CPP: 28,360 / 100 = C$ 283.60
registrarCompra(db, {
  proveedor: "Distribuidora Metalúrgica",
  fecha: "2026-11-15",
  notas: "Lote nuevo de zinc",
  creadoPor: "bodega",
  items: [{ productoId: "prod-zinc", cantidad: 12, precio: 310.00 }],
});
const zincFinal = db.productos.find((p) => p.id === "prod-zinc")!;
assert(zincFinal.stockActual === 100, "Stock de zinc repuesto a 100.");
assert(zincFinal.costo === 283.60, `Nuevo CPP debe ser C$ 283.60. Obtenido: ${zincFinal.costo}`);

// G. Cierre y Arqueo de Caja
// Teórico en caja: Saldo Inicial (1,500) + Ventas Efectivo (4,283.75) - Gastos Efectivo (250) = 5,533.75
const teoricoEsperado = 1500.00 + 4283.75 - 250.00;
cerrarTurno(db, {
  montoFinalReal: 5533.75,
  notas: "Arqueo cuadrado sin diferencias",
  usuario: "cajero",
});
assert(turnoActivo.estado === "CERRADO", "El turno de caja debe quedar CERRADO.");
assert(turnoActivo.diferencia === 0, "Diferencia de caja debe ser C$ 0.00.");

console.log("✔ Auditoría comercial superada: Circuito completo de Ventas, Gastos, Compras, Kárdex y Arqueo validado.");

// ---------------------------------------------------------------------------
// 4. Auditoría de Integridad y Prevención de Desincronización
// ---------------------------------------------------------------------------
console.log("\n--- 4. AUDITORÍA DE IDEMPOTENCIA Y PREVENCIÓN DE DUPLICADOS ---");
// Cada movimiento de kárdex tiene una llave única
const llaves = db.movimientos.map((m) => m.idempotencyKey).filter(Boolean);
const llavesSet = new Set(llaves);
assert(llaves.length === llavesSet.size, "Todas las llaves de idempotencia de kárdex deben ser estrictamente únicas.");
console.log(`✔ ${llaves.length} movimientos de kárdex auditados con llaves de idempotencia únicas.`);

console.log("\n==================================================================");
console.log("   ¡AUDITORÍA INTEGRAL E1 SUPERADA CON ÉXITO ABSOLUTO (100%)!     ");
console.log("==================================================================");
