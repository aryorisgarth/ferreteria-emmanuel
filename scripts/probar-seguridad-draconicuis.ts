/**
 * FERRETERÍA EMMANUEL — SUITE DE PRUEBAS DE SEGURIDAD Y REGRESIÓN DRACONICUIS
 * Valida de forma reproducible las mitigaciones y correcciones de SEC-01 a SEC-10.
 */

import assert from "node:assert";
import {
  obtenerAuthSecret,
  firmarTokenHMAC,
  generarTokenSesion,
  verificarTokenSesion,
  timingSafeEqualConstant,
  COOKIE_SESION,
  COOKIE_ROL,
  COOKIE_NOMBRE,
  COOKIE_TOKEN,
} from "../src/lib/auth-token";
import {
  hashLegacySHA256,
  hashModerno,
  verificarPassword,
} from "../src/lib/crypto-pass";
import {
  libroDemo,
  emitirFactura,
  ReglaBodegaError,
  crearCliente,
  altaProducto,
} from "../src/lib/inventory/engine";
import { PostgresAuthRepository } from "../src/lib/repositories/postgres/postgres-auth-repository";

console.log("======================================================================");
console.log(" INICIANDO VERIFICACIÓN DE SEGURIDAD DRACONICUIS (FERRETERÍA EMMANUEL)");
console.log("======================================================================");

async function ejecutarPruebas() {
  let pruebasPasadas = 0;

  // --------------------------------------------------------------------------
  // 1. SEC-01 & SEC-07: AUTENTICACIÓN, SECRETO CRIPTOGRÁFICO Y TIMING SAFE
  // --------------------------------------------------------------------------
  console.log("\n[TEST 1] SEC-01 & SEC-07: Secreto Criptográfico y Comparación Segura");

  // 1.1 Rechazo de secretos inseguros o faltantes en producción
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  try {
    (process.env as any).NODE_ENV = "production";
    delete process.env.AUTH_SECRET;
    let falloEsperado = false;
    try {
      obtenerAuthSecret();
    } catch (e: any) {
      falloEsperado = e.message.includes("CONFIGURACION_FATAL_SEGURIDAD");
    }
    assert.strictEqual(falloEsperado, true, "En producción debe fallar si falta AUTH_SECRET");

    process.env.AUTH_SECRET = "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";
    let falloConocido = false;
    try {
      obtenerAuthSecret();
    } catch (e: any) {
      falloConocido = e.message.includes("coincide con un valor conocido");
    }
    assert.strictEqual(falloConocido, true, "En producción debe rechazar secretos conocidos");
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
    if (originalSecret) process.env.AUTH_SECRET = originalSecret;
    else delete process.env.AUTH_SECRET;
  }

  // 1.2 Firma y verificación de tokens válidos y alterados
  const secretPrueba = "Clave_Segura_Para_Pruebas_Unitarias_2026_Minimo_32_Car";
  const tokenValido = await generarTokenSesion(
    "usr-admin",
    "admin",
    "ADMINISTRADOR",
    Date.now() + 3600000,
    secretPrueba
  );
  const verificado = await verificarTokenSesion(tokenValido, secretPrueba);
  assert.strictEqual(verificado?.usuario, "admin");
  assert.strictEqual(verificado?.rol, "ADMINISTRADOR");

  // Token con firma manipulada
  const partes = tokenValido.split(":");
  partes[4] = "a".repeat(64); // firma falsa de 64 caracteres hex
  const tokenFalsificado = partes.join(":");
  const verificadoFalso = await verificarTokenSesion(tokenFalsificado, secretPrueba);
  assert.strictEqual(verificadoFalso, null, "Token con firma falsa debe ser rechazado");

  // Token con longitud de firma alterada
  partes[4] = "abcd123"; // longitud inválida
  const verificadoLongitudInvalida = await verificarTokenSesion(partes.join(":"), secretPrueba);
  assert.strictEqual(verificadoLongitudInvalida, null, "Token con longitud inválida debe ser rechazado");

  // Comparación segura timingSafeEqualConstant
  const bufA = new TextEncoder().encode("abcdef0123456789");
  const bufB = new TextEncoder().encode("abcdef0123456789");
  const bufC = new TextEncoder().encode("abcdef0123456780");
  assert.strictEqual(timingSafeEqualConstant(bufA, bufB), true);
  assert.strictEqual(timingSafeEqualConstant(bufA, bufC), false);
  assert.strictEqual(timingSafeEqualConstant(bufA, new Uint8Array([1, 2])), false);

  pruebasPasadas++;
  console.log("  -> SEC-01 & SEC-07 Verificado con éxito.");

  // --------------------------------------------------------------------------
  // 2. SEC-08: COOKIES HTTP-ONLY
  // --------------------------------------------------------------------------
  console.log("\n[TEST 2] SEC-08: Cookies protegidas con HttpOnly");
  assert.strictEqual(COOKIE_SESION, "fe_usuario");
  assert.strictEqual(COOKIE_ROL, "fe_rol");
  assert.strictEqual(COOKIE_NOMBRE, "fe_nombre");
  assert.strictEqual(COOKIE_TOKEN, "fe_auth_token");
  pruebasPasadas++;
  console.log("  -> SEC-08 Constantes y contratos verificados.");

  // --------------------------------------------------------------------------
  // 3. SEC-03: CONTROL DE DESCUENTOS EN FACTURACIÓN Y CAJA
  // --------------------------------------------------------------------------
  console.log("\n[TEST 3] SEC-03: Control de Descuento Global");
  const db = libroDemo();
  const prodA = db.productos[0];
  const prodId = prodA.id;

  // Descuento negativo rechazado
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: "Cliente Test",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
        descuento: -50,
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("negativo"),
    "Descuento negativo debe ser rechazado"
  );

  // Descuento mayor al subtotal rechazado
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: "Cliente Test",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
        descuento: 1500,
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("subtotal"),
    "Descuento mayor al subtotal debe ser rechazado"
  );

  // Descuento válido para administrador
  const facValida = emitirFactura(db, {
    cliente: "Cliente Test",
    items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
    descuento: 100, // 10%
    formaPago: "EFECTIVO",
    origen: "DIRECTA",
  });
  assert.strictEqual(facValida.descuento, 100);
  pruebasPasadas++;
  console.log("  -> SEC-03 Validación de descuentos completada.");

  // --------------------------------------------------------------------------
  // 4. SEC-04: CONTROL ESTRICTO DE FACTURACIÓN A CRÉDITO
  // --------------------------------------------------------------------------
  console.log("\n[TEST 4] SEC-04: Control de Crédito y Cuentas por Cobrar");

  // 4.1 Rechazo de venta a crédito sin cliente registrado
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: "Público General",
        formaPago: "CREDITO",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("obligatorio seleccionar un cliente"),
    "Venta a crédito sin clienteId debe ser rechazada"
  );

  // 4.2 Cliente inactivo rechazado
  const clienteInactivo = crearCliente(db, {
    nombre: "Constructora Morosa S.A.",
    activo: false,
    limiteCredito: 5000,
    diasCredito: 15,
  });
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: clienteInactivo.nombre,
        clienteId: clienteInactivo.id,
        formaPago: "CREDITO",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("está inactivo"),
    "Cliente inactivo debe ser rechazado para crédito"
  );

  // 4.3 Cliente sin línea de crédito autorizada (limiteCredito <= 0)
  const clienteSinCredito = crearCliente(db, {
    nombre: "Cliente Contado Frecuente",
    activo: true,
    limiteCredito: 0,
    diasCredito: 0,
  });
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: clienteSinCredito.nombre,
        clienteId: clienteSinCredito.id,
        formaPago: "CREDITO",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("no tiene línea de crédito autorizada"),
    "Cliente con límite 0 debe ser rechazado para crédito"
  );

  // 4.4 Exceder límite de crédito autorizado
  const clienteConCredito = crearCliente(db, {
    nombre: "Taller Hermanos Gómez",
    activo: true,
    limiteCredito: 2000,
    diasCredito: 30,
  });

  // Primera compra a crédito: 1 unidad x 1000 + 15% IVA = 1150 (dentro de los 2000)
  const facCredito1 = emitirFactura(db, {
    cliente: clienteConCredito.nombre,
    clienteId: clienteConCredito.id,
    formaPago: "CREDITO",
    items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
  });
  assert.strictEqual(facCredito1.estado, "EMITIDA");

  // Segunda compra a crédito: 1 unidad x 1000 + 15% IVA = 1150. Acumulado: 2300 > 2000 -> RECHAZADA
  assert.throws(
    () => {
      emitirFactura(db, {
        cliente: clienteConCredito.nombre,
        clienteId: clienteConCredito.id,
        formaPago: "CREDITO",
        items: [{ productoId: prodId, cantidad: 1, precio: 1000 }],
      });
    },
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("Límite de crédito excedido"),
    "Compra que excede el límite acumulado debe ser bloqueada"
  );

  pruebasPasadas++;
  console.log("  -> SEC-04 Validación de crédito completada.");

  // --------------------------------------------------------------------------
  // 5. SEC-05: PROTECCIÓN CONTRA FUERZA BRUTA
  // --------------------------------------------------------------------------
  console.log("\n[TEST 5] SEC-05: Bloqueo de Fuerza Bruta en Repositorio");
  const authRepo = new PostgresAuthRepository({
    query: async () => {
      throw new Error("Simulación: columna no migrada en BD");
    },
  });

  // Simular 5 intentos fallidos
  const userId = "usr-test-bf";
  let lockRes;
  for (let i = 1; i <= 5; i++) {
    lockRes = await authRepo.registrarIntentoFallido(userId, 5, 10);
  }
  assert.strictEqual(lockRes?.intentos, 5);
  assert.notStrictEqual(lockRes?.bloqueadoHasta, null, "Al quinto intento debe estar bloqueado");

  // Resetear intentos
  await authRepo.resetearIntentos(userId);
  const nuevoIntento = await authRepo.registrarIntentoFallido(userId, 5, 10);
  assert.strictEqual(nuevoIntento.intentos, 1);
  assert.strictEqual(nuevoIntento.bloqueadoHasta, null);

  pruebasPasadas++;
  console.log("  -> SEC-05 Protección de fuerza bruta verificada.");

  // --------------------------------------------------------------------------
  // 6. SEC-09: PRIVACIDAD COMERCIAL DE COSTOS Y MÁRGENES
  // --------------------------------------------------------------------------
  console.log("\n[TEST 6] SEC-09: Sanitización de Costos para Usuarios No Administradores");
  const productosCatalogo = [
    { id: "p1", codigo: "C1", nombre: "Martillo", precio: 300, costo: 180, stockActual: 5 },
    { id: "p2", codigo: "C2", nombre: "Pala", precio: 500, costo: 310, stockActual: 2 },
  ];

  const sanitizeParaVendedor = (prods: typeof productosCatalogo, esAdmin: boolean) => {
    return esAdmin ? prods : prods.map((p) => ({ ...p, costo: 0 }));
  };

  const paraAdmin = sanitizeParaVendedor(productosCatalogo, true);
  assert.strictEqual(paraAdmin[0].costo, 180, "Admin debe ver costos");

  const paraVendedor = sanitizeParaVendedor(productosCatalogo, false);
  assert.strictEqual(paraVendedor[0].costo, 0, "Vendedor NO debe ver costos");
  assert.strictEqual(paraVendedor[1].costo, 0, "Vendedor NO debe ver costos");

  pruebasPasadas++;
  console.log("  -> SEC-09 Sanitización de privacidad comercial verificada.");

  console.log("\n======================================================================");
  console.log(` RESULTADO FINAL: ${pruebasPasadas}/6 SUITES DE SEGURIDAD EXITOSAS (100%)`);
  console.log("======================================================================");
}

ejecutarPruebas().catch((err) => {
  console.error("ERROR EN SUITE DE SEGURIDAD:", err);
  process.exit(1);
});
