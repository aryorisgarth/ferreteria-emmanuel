import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  abrirTurno,
  emitirFactura,
  anularFactura,
  registrarDevolucionCliente,
  turnoActivo,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB, Factura } from "../src/lib/types";

async function main() {
  console.log("=== INICIANDO SUITE DE PRUEBAS: CIERRE DEL GRUPO 2 ===");
  console.log("=== IDEMPOTENCIA, CONCURRENCIA REAL Y CONSISTENCIA TRANSACCIONAL ===\n");

  // Un Mutex asíncrono que simula el despachador de transacciones protegidas en el backend/proceso Node.js
  class TransactorProceso {
    private cola = Promise.resolve();

    async ejecutar<T>(operacion: () => Promise<T> | T): Promise<T> {
      const siguiente = this.cola.then(() => operacion());
      this.cola = siguiente.then(() => {}).catch(() => {});
      return siguiente;
    }
  }

  // ============================================================================
  // BLOQUE 1: IDEMPOTENCIA DE VENTAS
  // ============================================================================
  console.log("--- BLOQUE 1: IDEMPOTENCIA DE CONFIRMACIÓN DE VENTAS ---");

  // 1.1 Reintento con la misma clave devuelve la factura original sin repetir efectos
  console.log("1. Probando reintento confirmado con la misma clave de idempotencia...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "IDEMP-01",
      nombre: "Disco de Corte 4 1/2 Dewalt",
      categoria: "Herramientas",
      marca: "Dewalt",
      unidadMedida: "UNIDAD",
      inventarioInicial: 50,
      costo: 30,
      precio: 50,
      stockMinimo: 5,
    });

    const claveUnica = "OP-VENTA-ABC-12345";

    // Intento 1: Venta original
    const fac1 = emitirFactura(db, {
      cliente: "Ferretería Central",
      fecha: "2026-11-16",
      notas: "Primera confirmación",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prod.id, cantidad: 5, precio: 50 }],
      claveIdempotencia: claveUnica,
    });

    assert.equal(fac1.claveIdempotencia, claveUnica);
    assert.equal(prod.stockActual, 45, "Stock debe ser 45 tras la primera venta");
    assert.equal(db.facturas.length, 1, "Debe existir 1 sola factura");
    assert.equal(db.movimientos.length, 1, "Debe existir 1 solo movimiento");
    const turno = turnoActivo(db);
    assert.equal(turno?.totalVentasEfectivo, 287.5, "Total venta con IVA 15% (250 + 37.5)");

    // Intento 2: Reintento con idéntica clave y datos
    const fac2 = emitirFactura(db, {
      cliente: "Ferretería Central",
      fecha: "2026-11-16",
      notas: "Reintento de confirmación",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prod.id, cantidad: 5, precio: 50 }],
      claveIdempotencia: claveUnica,
    });

    // Verificaciones de idempotencia
    assert.equal(fac1.id, fac2.id, "Debe retornar la misma factura original");
    assert.equal(fac1.numero, fac2.numero, "El número de folio debe ser idéntico");
    assert.equal(db.facturas.length, 1, "NO deben crearse dos facturas");
    assert.equal(db.movimientos.length, 1, "NO debe haber dos descargos de inventario");
    assert.equal(prod.stockActual, 45, "El stock no debe descontarse dos veces (debe seguir en 45)");
    assert.equal(turno?.totalVentasEfectivo, 287.5, "La caja no debe duplicar el cobro");
    assert.equal(db.folios.factura, 1, "No debe consumirse un segundo folio");

    console.log("   ✓ Reintento confirmado devolvió la factura original sin repetir efectos ni cobros.");
  }

  // 1.2 Reutilización de la misma clave con datos diferentes es rechazada
  console.log("2. Probando reutilización de la misma clave con datos diferentes (conflicto)...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prodA = altaProducto(db, {
      codigo: "CONF-01",
      nombre: "Tornillo Enroscable",
      categoria: "Ferretería",
      marca: "Fischer",
      unidadMedida: "CAJA",
      inventarioInicial: 100,
      costo: 20,
      precio: 40,
      stockMinimo: 5,
    });

    const claveReutilizada = "CLAVE-REPETIDA-999";

    emitirFactura(db, {
      cliente: "Cliente Original",
      fecha: "2026-11-16",
      notas: "Venta legítima",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prodA.id, cantidad: 2, precio: 40 }],
      claveIdempotencia: claveReutilizada,
    });

    // Reintento con distinta cantidad
    assert.throws(
      () => {
        emitirFactura(db, {
          cliente: "Cliente Original",
          fecha: "2026-11-16",
          notas: "Intento fraudulento cantidad distinta",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prodA.id, cantidad: 10, precio: 40 }], // 10 en vez de 2
          claveIdempotencia: claveReutilizada,
        });
      },
      /CLAVE_IDEMPOTENCIA_CONFLICTO/i,
      "Debe rechazar si la cantidad de artículos difiere"
    );

    // Reintento con distinto cliente
    assert.throws(
      () => {
        emitirFactura(db, {
          cliente: "Otro Cliente",
          fecha: "2026-11-16",
          notas: "Intento con otro cliente",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prodA.id, cantidad: 2, precio: 40 }],
          claveIdempotencia: claveReutilizada,
        });
      },
      /CLAVE_IDEMPOTENCIA_CONFLICTO/i,
      "Debe rechazar si el cliente difiere"
    );

    // Reintento con distinta forma de pago
    assert.throws(
      () => {
        emitirFactura(db, {
          cliente: "Cliente Original",
          fecha: "2026-11-16",
          notas: "Intento con otra forma de pago",
          creadoPor: "Cajero 1",
          formaPago: "TRANSFERENCIA", // TRANSFERENCIA en vez de EFECTIVO
          origen: "CAJA",
          items: [{ productoId: prodA.id, cantidad: 2, precio: 40 }],
          claveIdempotencia: claveReutilizada,
        });
      },
      /CLAVE_IDEMPOTENCIA_CONFLICTO/i,
      "Debe rechazar si la forma de pago difiere"
    );

    assert.equal(prodA.stockActual, 98, "El stock no debe haber sido tocado por intentos rechazados");
    console.log("   ✓ Reutilización de la misma clave con datos diferentes rechazada con CLAVE_IDEMPOTENCIA_CONFLICTO.");
  }

  // 1.3 Dos ventas legítimas distintas con los mismos productos y cantidades no se bloquean
  console.log("3. Probando que dos ventas legítimas distintas no se bloquean...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "LEGIT-01",
      nombre: "Cinta Teflón 1/2",
      categoria: "Plomería",
      marca: "Amanco",
      unidadMedida: "UNIDAD",
      inventarioInicial: 100,
      costo: 10,
      precio: 20,
      stockMinimo: 5,
    });

    // Venta 1 con clave A
    const v1 = emitirFactura(db, {
      cliente: "Público general",
      fecha: "2026-11-16",
      notas: "Cliente fila 1",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prod.id, cantidad: 2, precio: 20 }],
      claveIdempotencia: "VENTA-TICKET-001",
    });

    // Venta 2 con clave B (mismo cliente 'Público general', mismos productos, misma cantidad)
    const v2 = emitirFactura(db, {
      cliente: "Público general",
      fecha: "2026-11-16",
      notas: "Cliente fila 2",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prod.id, cantidad: 2, precio: 20 }],
      claveIdempotencia: "VENTA-TICKET-002",
    });

    assert.notEqual(v1.id, v2.id, "Deben ser dos facturas diferentes");
    assert.notEqual(v1.numero, v2.numero, "Deben tener números de factura consecutivos distintos");
    assert.equal(db.facturas.length, 2, "Deben existir dos facturas emitidas");
    assert.equal(prod.stockActual, 96, "El stock debe reflejar ambas salidas (100 - 2 - 2 = 96)");

    console.log("   ✓ Dos ventas legítimas distintas procesadas independientemente sin bloqueo.");
  }

  // ============================================================================
  // BLOQUE 2: CONCURRENCIA REAL CON PROMISE.ALL
  // ============================================================================
  console.log("\n--- BLOQUE 2: CONCURRENCIA REAL MEDIANTE PROMISE.ALL ---");

  // 2.1 Dos cajeros vendiendo simultáneamente el mismo artículo (stock suficiente)
  console.log("4. Probando dos cajeros vendiendo simultáneamente el mismo artículo (Promise.all)...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "CONC-ART-01",
      nombre: "Cemento Portland 42.5kg",
      categoria: "Construcción",
      marca: "Canal",
      unidadMedida: "BOLSA",
      inventarioInicial: 50,
      costo: 300,
      precio: 400,
      stockMinimo: 5,
    });

    const tx = new TransactorProceso();

    // Simulación de dos cajeros enviando peticiones concurrentes a la vez
    const [ventaCajero1, ventaCajero2] = await Promise.all([
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 5));
        return emitirFactura(db, {
          cliente: "Constructora A",
          fecha: "2026-11-16",
          notas: "Venta Cajero 1",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 10, precio: 400 }],
          claveIdempotencia: "TX-CAJERO1-001",
        });
      }),
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 2));
        return emitirFactura(db, {
          cliente: "Constructora B",
          fecha: "2026-11-16",
          notas: "Venta Cajero 2",
          creadoPor: "Cajero 2",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 15, precio: 400 }],
          claveIdempotencia: "TX-CAJERO2-002",
        });
      }),
    ]);

    assert.equal(db.facturas.length, 2, "Deben haberse creado exactamente 2 facturas");
    assert.equal(prod.stockActual, 25, "Stock inicial 50 - 10 - 15 = 25 exacto");
    assert.equal(db.movimientos.length, 2, "Deben haberse registrado 2 salidas en Kárdex");

    console.log("   ✓ Ventas simultáneas completadas: stock exacto (25) y sin pérdida de actualizaciones.");
  }

  // 2.2 Dos ventas simultáneas cuando el stock alcanza solamente para una
  console.log("5. Probando dos ventas simultáneas cuando el stock solo alcanza para una...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "STOCK-LIMIT-01",
      nombre: "Bomba de Agua Sumergible 1HP",
      categoria: "Herramientas",
      marca: "Pedrollo",
      unidadMedida: "UNIDAD",
      inventarioInicial: 10, // Solo hay 10 unidades
      costo: 3000,
      precio: 4500,
      stockMinimo: 2,
    });

    const tx = new TransactorProceso();

    // Dos cajeros intentan vender 8 unidades cada uno (8 + 8 = 16 > 10)
    const resultados = await Promise.allSettled([
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 5));
        return emitirFactura(db, {
          cliente: "Cliente Alfa",
          fecha: "2026-11-16",
          notas: "Intento Alfa",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 8, precio: 4500 }],
          claveIdempotencia: "TX-LIMIT-ALFA",
        });
      }),
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 2));
        return emitirFactura(db, {
          cliente: "Cliente Beta",
          fecha: "2026-11-16",
          notas: "Intento Beta",
          creadoPor: "Cajero 2",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 8, precio: 4500 }],
          claveIdempotencia: "TX-LIMIT-BETA",
        });
      }),
    ]);

    const aprobadas = resultados.filter((r) => r.status === "fulfilled");
    const rechazadas = resultados.filter((r) => r.status === "rejected");

    assert.equal(aprobadas.length, 1, "Exactamente 1 venta debe ser aprobada");
    assert.equal(rechazadas.length, 1, "Exactamente 1 venta debe ser rechazada");
    assert.equal(prod.stockActual, 2, "Stock final debe ser 2 (10 - 8), NUNCA negativo");
    assert.equal(db.facturas.length, 1, "Solo 1 factura debe existir");

    console.log("   ✓ Concurrencia con stock insuficiente: 1 aprobada, 1 rechazada, stock final = 2 (nunca negativo).");
  }

  // 2.3 Dos solicitudes idénticas concurrentes con la misma clave de idempotencia
  console.log("6. Probando dos solicitudes idénticas con la misma clave concurrentes (Promise.all)...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "IDEMP-PARAL-01",
      nombre: "Taladro Percutor 1/2 Makita",
      categoria: "Herramientas",
      marca: "Makita",
      unidadMedida: "UNIDAD",
      inventarioInicial: 20,
      costo: 1800,
      precio: 2500,
      stockMinimo: 2,
    });

    const tx = new TransactorProceso();
    const claveDobleClick = "DOBLE-CLICK-TOKEN-8888";

    // Disparo simultáneo de la misma venta (e.g. doble clic o retry inmediato)
    const [res1, res2] = await Promise.all([
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 4));
        return emitirFactura(db, {
          cliente: "Ingeniería Total",
          fecha: "2026-11-16",
          notas: "Confirmación 1",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 3, precio: 2500 }],
          claveIdempotencia: claveDobleClick,
        });
      }),
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 2));
        return emitirFactura(db, {
          cliente: "Ingeniería Total",
          fecha: "2026-11-16",
          notas: "Confirmación 2",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 3, precio: 2500 }],
          claveIdempotencia: claveDobleClick,
        });
      }),
    ]);

    assert.equal(res1.id, res2.id, "Ambas promesas deben devolver la misma factura");
    assert.equal(db.facturas.length, 1, "Solo 1 factura debe ser guardada");
    assert.equal(prod.stockActual, 17, "El stock solo debe descontarse una vez (20 - 3 = 17)");
    assert.equal(db.movimientos.length, 1, "Solo 1 movimiento en Kárdex");

    console.log("   ✓ Dos solicitudes concurrentes idénticas resueltas a la misma factura sin duplicar efectos.");
  }

  // 2.4 Dos ventas legítimas simultáneas con claves diferentes
  console.log("7. Probando dos ventas legítimas concurrentes con claves diferentes...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "DIF-KEYS-01",
      nombre: "Caja de Clavos 2 1/2 Corrientes",
      categoria: "Ferretería",
      marca: "Incesca",
      unidadMedida: "CAJA",
      inventarioInicial: 40,
      costo: 35,
      precio: 70,
      stockMinimo: 5,
    });

    const tx = new TransactorProceso();

    const [vA, vB] = await Promise.all([
      tx.ejecutar(async () => {
        return emitirFactura(db, {
          cliente: "Cliente A",
          fecha: "2026-11-16",
          notas: "Venta A",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 4, precio: 70 }],
          claveIdempotencia: "CLAVE-DISTINTA-AAA",
        });
      }),
      tx.ejecutar(async () => {
        return emitirFactura(db, {
          cliente: "Cliente B",
          fecha: "2026-11-16",
          notas: "Venta B",
          creadoPor: "Cajero 2",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 6, precio: 70 }],
          claveIdempotencia: "CLAVE-DISTINTA-BBB",
        });
      }),
    ]);

    assert.notEqual(vA.id, vB.id, "Facturas deben ser distintas");
    assert.equal(db.facturas.length, 2, "Deben existir 2 facturas");
    assert.equal(prod.stockActual, 30, "Stock debe ser 30 (40 - 4 - 6)");

    console.log("   ✓ Dos ventas legítimas con claves diferentes emitidas en paralelo exitosamente.");
  }

  // 2.5 Venta y devolución simultáneas
  console.log("8. Probando venta y devolución simultáneas con Promise.all...");
  {
    const db: DB = libroVacio();
    abrirTurno(db, { montoInicial: 2000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const prod = altaProducto(db, {
      codigo: "SIMULT-DEV-01",
      nombre: "Llave de Paso 1/2 Bronce",
      categoria: "Plomería",
      marca: "Metusa",
      unidadMedida: "UNIDAD",
      inventarioInicial: 30,
      costo: 120,
      precio: 200,
      stockMinimo: 5,
    });

    // Factura previa de la cual se devolverán unidades
    const facPrevia = emitirFactura(db, {
      cliente: "Cliente Devolución",
      fecha: "2026-11-16",
      notas: "Factura origen",
      creadoPor: "Cajero 1",
      formaPago: "EFECTIVO",
      origen: "CAJA",
      items: [{ productoId: prod.id, cantidad: 5, precio: 200 }],
    });

    // Stock tras factura previa: 30 - 5 = 25
    assert.equal(prod.stockActual, 25);

    const tx = new TransactorProceso();

    // Simultáneamente: Cajero 1 vende 4 unidades, Cajero 2 devuelve 2 unidades de la factura previa
    const [nuevaVenta, nuevaDev] = await Promise.all([
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 4));
        return emitirFactura(db, {
          cliente: "Nuevo Comprador",
          fecha: "2026-11-16",
          notas: "Venta simultánea",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: prod.id, cantidad: 4, precio: 200 }],
          claveIdempotencia: "VENTA-SIMULTANEA-01",
        });
      }),
      tx.ejecutar(async () => {
        await new Promise((r) => setTimeout(r, 2));
        return registrarDevolucionCliente(db, {
          facturaId: facPrevia.id,
          fecha: "2026-11-16",
          motivo: "Devolución simultánea de 2 unidades",
          responsable: "Cajero 2",
          items: [{ productoId: prod.id, cantidad: 2 }],
          metodoReintegro: "EFECTIVO",
        });
      }),
    ]);

    // Stock esperado: 25 - 4 (salida venta) + 2 (entrada devolución) = 23
    assert.equal(prod.stockActual, 23, "Stock final debe ser exactamente 23");
    assert.equal(db.devolucionesCliente?.length, 1, "Debe existir la devolución");
    assert.equal(db.facturas.length, 2, "Debe existir la factura previa y la nueva");

    console.log("   ✓ Venta y devolución simultáneas coordinadas con exactitud en Kárdex y stock (23).");
  }

  // ============================================================================
  // BLOQUE 3: CONSISTENCIA TRANSACCIONAL (ROLLBACK COMPLETO ANTE FALLO)
  // ============================================================================
  console.log("\n--- BLOQUE 3: CONSISTENCIA TRANSACCIONAL (ATOMICIDAD PURA) ---");

  console.log("9. Probando que un fallo en cualquier paso revierte toda la operación lógica...");
  {
    const db: DB = libroVacio();
    const turno = abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const p1 = altaProducto(db, {
      codigo: "FAIL-01",
      nombre: "Pintura Corona Galón Blanco",
      categoria: "Pintura",
      marca: "Corona",
      unidadMedida: "GALON",
      inventarioInicial: 10,
      costo: 300,
      precio: 500,
      stockMinimo: 2,
    });

    const p2 = altaProducto(db, {
      codigo: "FAIL-02",
      nombre: "Brocha 4 Pulgadas",
      categoria: "Pintura",
      marca: "Corona",
      unidadMedida: "UNIDAD",
      inventarioInicial: 2, // Solo hay 2 unidades
      costo: 50,
      precio: 90,
      stockMinimo: 1,
    });

    const snapshotFacturas = db.facturas.length;
    const snapshotMovs = db.movimientos.length;
    const snapshotVentasEfectivo = turno.totalVentasEfectivo;
    const snapshotFolio = db.folios.factura;

    // Intento de venta multi-artículo donde el segundo artículo excede el stock disponible
    assert.throws(
      () => {
        emitirFactura(db, {
          cliente: "Cliente Fallo",
          fecha: "2026-11-16",
          notas: "Transacción que debe fallar",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [
            { productoId: p1.id, cantidad: 3, precio: 500 }, // Válido
            { productoId: p2.id, cantidad: 10, precio: 90 }, // INVÁLIDO (solo hay 2)
          ],
        });
      },
      /Stock insuficiente/i,
      "Debe lanzar error por stock insuficiente"
    );

    // Verificación de atomicidad: NADA debe haber cambiado en el sistema
    assert.equal(p1.stockActual, 10, "El artículo 1 no debe haber sufrido descuento de stock");
    assert.equal(p2.stockActual, 2, "El artículo 2 debe permanecer intacto");
    assert.equal(db.facturas.length, snapshotFacturas, "No debe registrarse ninguna factura parcial");
    assert.equal(db.movimientos.length, snapshotMovs, "No deben crearse movimientos parciales en Kárdex");
    assert.equal(turno.totalVentasEfectivo, snapshotVentasEfectivo, "La caja no debe alterarse");
    assert.equal(db.folios.factura, snapshotFolio, "El folio consecutivo no debe consumirse");

    console.log("   ✓ Consistencia transaccional confirmada: Fallo revertido al 100% sin dejar registros parciales.");
  }

  console.log("10. Probando atomicidad ante fallo por monto en efectivo insuficiente...");
  {
    const db: DB = libroVacio();
    const turno = abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

    const p1 = altaProducto(db, {
      codigo: "FAIL-CASH-01",
      nombre: "Cerradura de Pomo Yale",
      categoria: "Ferretería",
      marca: "Yale",
      unidadMedida: "UNIDAD",
      inventarioInicial: 15,
      costo: 300,
      precio: 450,
      stockMinimo: 2,
    });

    // Total con IVA = 450 * 1.15 = 517.50, pero el cajero ingresa montoRecibido = 300
    assert.throws(
      () => {
        emitirFactura(db, {
          cliente: "Cliente Efectivo Corto",
          fecha: "2026-11-16",
          notas: "Pago menor que el total",
          creadoPor: "Cajero 1",
          formaPago: "EFECTIVO",
          origen: "CAJA",
          items: [{ productoId: p1.id, cantidad: 1, precio: 450 }],
          montoRecibido: 300,
        });
      },
      /menor que el total de la venta/i
    );

    assert.equal(p1.stockActual, 15, "Stock permanece en 15");
    assert.equal(db.facturas.length, 0, "Cero facturas registradas");
    assert.equal(db.movimientos.length, 0, "Cero movimientos en Kárdex");
    assert.equal(turno.totalVentasEfectivo, 0, "Cero ventas en caja");

    console.log("   ✓ Rechazo de pago insuficiente validado atómicamente.");
  }

  console.log("\n=== TODAS LAS PRUEBAS DE CIERRE DEL GRUPO 2 PASARON EXITOSAMENTE AL 100% ===");
}

main().catch((err) => {
  console.error("Fallo inesperado en prueba:", err);
  process.exit(1);
});
