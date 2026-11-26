import {
  libroVacio,
  altaProducto,
  crearPedidoCompra,
  cambiarEstadoPedidoCompra,
  detallePedidoCompra,
  listarPedidosCompra,
  registrarRecepcionCompra,
  detalleRecepcionCompra,
  listarRecepcionesCompra,
  registrarCompra,
  anularCompra,
  detalleCompra,
  registrarAbonoCompra,
  listarCuentasPorPagar,
  historialPagosCompra,
  registrarDevolucionProveedor,
  detalleDevolucionProveedor,
  listarDevolucionesProveedor,
  crearProveedor,
  ReglaBodegaError,
} from "../src/lib/inventory/engine";
import type { DB, Producto } from "../src/lib/types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FALLO DE ASERCIÓN: " + msg);
}

function assertThrows(fn: () => void, msgEsperado: string) {
  try {
    fn();
    throw new Error(`Se esperaba error que contuviera "${msgEsperado}", pero no ocurrió ningún error.`);
  } catch (error: any) {
    if (error.message.includes("Se esperaba error")) throw error;
    if (!error.message.includes(msgEsperado)) {
      throw new Error(`Error inesperado: "${error.message}", se esperaba que contuviera "${msgEsperado}"`);
    }
  }
}

function crearDBAislada(): DB {
  const db: DB = libroVacio();
  db.pedidosCompra = [];
  db.recepcionesCompra = [];
  db.devolucionesProveedor = [];
  db.pagosCompra = [];
  db.folios.pedido = 0;
  db.folios.recepcion = 0;
  db.folios.devolucion = 0;
  db.folios.pago = 0;

  const p1 = altaProducto(db, {
    codigo: "CEM-001",
    codigoBarras: "7430000001",
    nombre: "Cemento Canal 42.5kg",
    marca: "Canal",
    unidadMedida: "BOLSA",
    inventarioInicial: 10,
    costo: 280,
    precio: 350,
    categoria: "Materiales",
    stockMinimo: 5,
  });
  p1.id = "prod-1";

  const p2 = altaProducto(db, {
    codigo: "VAR-001",
    codigoBarras: "7430000002",
    nombre: "Varilla de Hierro 3/8",
    marca: "Sidenor",
    unidadMedida: "UNIDAD",
    inventarioInicial: 50,
    costo: 160,
    precio: 210,
    categoria: "Hierro",
    stockMinimo: 20,
  });
  p2.id = "prod-2";

  crearProveedor(db, {
    nombre: "Distribuidora Holcim",
    telefono: "2249-1111",
    direccion: "Carretera Norte",
    notas: "",
  });

  crearProveedor(db, {
    nombre: "Corporación Sidenor",
    telefono: "2255-2222",
    direccion: "Tipitapa",
    notas: "",
  });

  return db;
}

async function main() {
  console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: ETAPA 3 (COMPRAS Y ABASTECIMIENTO COMERCIAL) ===\n");

  // ----------------------------------------------------
  // PRUEBA 1: Pedidos de compra no alteran existencias ni CPP
  // ----------------------------------------------------
  console.log("1. Probando que los Pedidos de Compra (Órdenes) son compromisos sin impacto físico...");
  {
    const db = crearDBAislada();
    const stockPrevio = db.productos[0].stockActual;
    const costoPrevio = db.productos[0].costo;
    const totalMovsPrevios = db.movimientos.length;

    const pedido = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      proveedorId: "prov-1",
      fechaEmision: "2026-11-05",
      fechaEntregaEstimada: "2026-11-10",
      notas: "Entrega en bodega central",
      creadoPor: "Comprador",
      items: [
        { productoId: "prod-1", cantidadPedida: 100, precioUnitario: 300 },
      ],
    });

    assert(pedido.estado === "EMITIDO", "El estado inicial del pedido debe ser EMITIDO");
    assert(pedido.numero.startsWith("PED-"), "El folio debe tener prefijo PED-");
    assert(db.productos[0].stockActual === stockPrevio, "El stock no debe modificarse al emitir un pedido");
    assert(db.productos[0].costo === costoPrevio, "El CPP no debe modificarse al emitir un pedido");
    assert(db.movimientos.length === totalMovsPrevios, "No deben crearse movimientos en Kárdex al emitir un pedido");
    console.log("   ✓ Pedido de compra creado exitosamente con impacto cero en stock, Kárdex y CPP.");
  }

  // ----------------------------------------------------
  // PRUEBA 2: Estados del Pedido y Cancelación
  // ----------------------------------------------------
  console.log("2. Probando ciclo de estados y cancelación de pedido...");
  {
    const db = crearDBAislada();
    const pedido = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      fechaEmision: "2026-11-05",
      creadoPor: "Comprador",
      items: [{ productoId: "prod-1", cantidadPedida: 50, precioUnitario: 300 }],
    });

    cambiarEstadoPedidoCompra(db, pedido.id, "CANCELADO");
    assert(pedido.estado === "CANCELADO", "El pedido debe quedar cancelado");

    // Intentar recibir mercancía contra un pedido cancelado debe fallar
    assertThrows(() => {
      registrarRecepcionCompra(db, {
        pedidoId: pedido.id,
        proveedor: "Distribuidora Holcim",
        fecha: "2026-11-06",
        responsable: "Bodeguero",
        items: [{ productoId: "prod-1", cantidadRecibida: 50, costoUnitario: 300 }],
      });
    }, "cancelado");
    console.log("   ✓ Pedido cancelado correctamente y bloqueada la recepción contra pedido cancelado.");
  }

  // ----------------------------------------------------
  // PRUEBA 3: Recepción parcial de mercancía y actualización de pedido
  // ----------------------------------------------------
  console.log("3. Probando recepción parcial de mercancía vinculada a pedido...");
  {
    const db = crearDBAislada();
    const pedido = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      fechaEmision: "2026-11-05",
      creadoPor: "Comprador",
      items: [{ productoId: "prod-1", cantidadPedida: 100, precioUnitario: 300 }],
    });

    // Se reciben 40 de los 100 pedidos
    const recepcion = registrarRecepcionCompra(db, {
      pedidoId: pedido.id,
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-06",
      remisionProveedor: "REM-001",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 40, costoUnitario: 300 }],
    });

    assert(recepcion.numero.startsWith("REC-"), "El folio debe tener prefijo REC-");
    assert(recepcion.stockAplicado === true, "La recepción debe marcar stockAplicado = true");
    assert(pedido.estado === "PARCIAL", "El pedido debe pasar a estado PARCIAL");
    assert(pedido.items[0].cantidadRecibida === 40, "La cantidad recibida en el pedido debe ser 40");

    // Stock de prod-1: 10 iniciales + 40 recibidas = 50
    const prod1 = db.productos[0];
    assert(prod1.stockActual === 50, "El stock actual debe ser 50");

    // CPP: (10 * 280 + 40 * 300) / 50 = (2800 + 12000) / 50 = 14800 / 50 = 296
    assert(prod1.costo === 296, `El nuevo CPP debe ser 296, obtenido: ${prod1.costo}`);

    // Kárdex
    const movRec = db.movimientos.find((m) => m.numeroReferencia === recepcion.numero);
    assert(!!movRec, "Debe existir movimiento en Kárdex para la recepción");
    assert(movRec?.tipo === "ENTRADA" && movRec?.cantidad === 40, "Movimiento debe ser ENTRADA por 40");
    console.log("   ✓ Recepción parcial procesada: pedido en PARCIAL, stock incrementado y CPP calculado.");
  }

  // ----------------------------------------------------
  // PRUEBA 4: Bloqueo de recepción en exceso sin autorización
  // ----------------------------------------------------
  console.log("4. Probando que se bloquean recepciones que exceden la cantidad pedida...");
  {
    const db = crearDBAislada();
    const pedido = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      fechaEmision: "2026-11-05",
      creadoPor: "Comprador",
      items: [{ productoId: "prod-1", cantidadPedida: 20, precioUnitario: 300 }],
    });

    assertThrows(() => {
      registrarRecepcionCompra(db, {
        pedidoId: pedido.id,
        proveedor: "Distribuidora Holcim",
        fecha: "2026-11-06",
        responsable: "Bodeguero",
        items: [{ productoId: "prod-1", cantidadRecibida: 25, costoUnitario: 300 }],
      });
    }, "excede la cantidad pendiente");
    console.log("   ✓ Intento de sobre-recepción bloqueado satisfactoriamente.");
  }

  // ----------------------------------------------------
  // PRUEBA 5: Recepción total completa el pedido
  // ----------------------------------------------------
  console.log("5. Probando recepción complementaria que completa el pedido...");
  {
    const db = crearDBAislada();
    const pedido = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      fechaEmision: "2026-11-05",
      creadoPor: "Comprador",
      items: [{ productoId: "prod-1", cantidadPedida: 50, precioUnitario: 300 }],
    });

    // Primera recepción 30
    registrarRecepcionCompra(db, {
      pedidoId: pedido.id,
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-06",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 30, costoUnitario: 300 }],
    });
    assert(pedido.estado === "PARCIAL", "Debe estar en PARCIAL");

    // Segunda recepción 20
    registrarRecepcionCompra(db, {
      pedidoId: pedido.id,
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-07",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 20, costoUnitario: 300 }],
    });
    assert(pedido.estado === "RECIBIDO", "Al completarse todas las cantidades debe pasar a RECIBIDO");
    console.log("   ✓ Pedido completado al 100% pasando a estado RECIBIDO.");
  }

  // ----------------------------------------------------
  // PRUEBA 6: Factura de compra vinculada a recepción NO duplica stock
  // ----------------------------------------------------
  console.log("6. Probando que factura de compra contra recepción NO duplica existencias...");
  {
    const db = crearDBAislada();
    // 1. Recepción previa de 50 unidades
    const recepcion = registrarRecepcionCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 50, costoUnitario: 300 }],
    });

    const stockTrasRecepcion = db.productos[0].stockActual; // 10 + 50 = 60
    const totalMovsTrasRecepcion = db.movimientos.length;

    // 2. Registro posterior de la factura comercial del proveedor
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-08",
      facturaProveedor: "FAC-99120",
      notas: "Factura recibida por correo",
      creadoPor: "Contador",
      recepcionId: recepcion.id,
      items: [{ productoId: "prod-1", cantidad: 50, precio: 300 }],
    });

    assert(compra.recepcionId === recepcion.id, "La compra debe guardar el ID de recepción");
    assert(db.productos[0].stockActual === stockTrasRecepcion, "El stock NO debe incrementarse una segunda vez");
    assert(db.movimientos.length === totalMovsTrasRecepcion, "NO debe crearse un segundo movimiento de entrada en Kárdex");
    console.log("   ✓ Integración Recepción -> Compra validada: Cero duplicación de existencias.");
  }

  // ----------------------------------------------------
  // PRUEBA 7: Compra directa con recepción inmediata
  // ----------------------------------------------------
  console.log("7. Probando compra directa con recepción inmediata...");
  {
    const db = crearDBAislada();
    const stockPrevio = db.productos[1].stockActual; // 50 varillas a C$160
    // Compra directa de 50 varillas a C$180
    const compra = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-05",
      notas: "Compra directa en mostrador",
      creadoPor: "Bodeguero",
      condicionPago: "CONTADO",
      items: [{ productoId: "prod-2", cantidad: 50, precio: 180 }],
    });

    const prod2 = db.productos[1];
    assert(prod2.stockActual === 100, "El stock debe ser 100 varillas");
    // CPP: (50 * 160 + 50 * 180) / 100 = (8000 + 9000) / 100 = 170
    assert(prod2.costo === 170, `El nuevo CPP debe ser 170, obtenido: ${prod2.costo}`);

    const mov = db.movimientos.find((m) => m.numeroReferencia === compra.numero);
    assert(!!mov, "Debe existir movimiento en Kárdex para la compra directa");
    assert(mov?.tipo === "ENTRADA", "Debe ser de tipo ENTRADA");
    console.log("   ✓ Compra directa ejecutada con actualización inmediata de Kárdex y CPP.");
  }

  // ----------------------------------------------------
  // PRUEBA 8: Compras a crédito y saldo inicial de cuenta por pagar
  // ----------------------------------------------------
  console.log("8. Probando compra a crédito y generación de cuenta por pagar...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra a crédito 30 días",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      diasCredito: 30,
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }], // Subtotal: 3000, ISV: 450, Total: 3450
    });

    assert(compra.condicionPago === "CREDITO", "Debe ser a crédito");
    assert(compra.estadoPago === "PENDIENTE", "El estado inicial debe ser PENDIENTE");
    assert(compra.saldoPendiente === 3450, `El saldo pendiente debe ser 3450, obtenido: ${compra.saldoPendiente}`);

    const cxc = listarCuentasPorPagar(db);
    assert(cxc.some((c) => c.compra.id === compra.id), "Debe aparecer en listarCuentasPorPagar");
    console.log("   ✓ Compra a crédito registrada con cuenta por pagar y saldo pendiente exacto.");
  }

  // ----------------------------------------------------
  // PRUEBA 9: Abono a cuenta por pagar NO altera stock ni CPP
  // ----------------------------------------------------
  console.log("9. Probando registro de abonos a compras a crédito...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra a crédito",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }], // Total 3450
    });

    const stockAntesDeAbono = db.productos[0].stockActual;
    const costoAntesDeAbono = db.productos[0].costo;
    const movsAntesDeAbono = db.movimientos.length;

    // Registrar abono de C$ 1,500
    const abono = registrarAbonoCompra(db, {
      compraId: compra.id,
      fecha: "2026-11-12",
      monto: 1500,
      formaPago: "TRANSFERENCIA",
      referencia: "TRANS-88124",
      creadoPor: "Cajero",
    });

    assert(compra.saldoPendiente === 1950, `Saldo restante debe ser 1950, obtenido: ${compra.saldoPendiente}`);
    assert(compra.estadoPago === "PARCIAL", "El estado debe ser PARCIAL");

    // REGLA CRÍTICA: Ningún cambio en stock, Kárdex o CPP
    assert(db.productos[0].stockActual === stockAntesDeAbono, "El abono NO debe tocar stock");
    assert(db.productos[0].costo === costoAntesDeAbono, "El abono NO debe alterar CPP");
    assert(db.movimientos.length === movsAntesDeAbono, "El abono NO debe generar movimientos en Kárdex");

    const pagos = historialPagosCompra(db, compra.id);
    assert(pagos.length === 1 && pagos[0].id === abono.id, "El abono debe quedar en el historial");
    console.log("   ✓ Abono registrado: saldo reducido y existencias/CPP 100% protegidos.");
  }

  // ----------------------------------------------------
  // PRUEBA 10: Pago total completa la cuenta por pagar
  // ----------------------------------------------------
  console.log("10. Probando liquidación total de compra a crédito...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra a crédito",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }], // Total 3450
    });

    registrarAbonoCompra(db, {
      compraId: compra.id,
      fecha: "2026-11-15",
      monto: 3450,
      formaPago: "CHEQUE",
      creadoPor: "Admin",
    });

    assert(compra.saldoPendiente === 0, "Saldo debe ser 0");
    assert(compra.estadoPago === "PAGADO", "Estado debe ser PAGADO");

    const cxc = listarCuentasPorPagar(db);
    assert(!cxc.some((c) => c.compra.id === compra.id), "No debe aparecer en cuentas por pagar activas al estar pagada");
    console.log("   ✓ Cuenta por pagar liquidada en su totalidad.");
  }

  // ----------------------------------------------------
  // PRUEBA 11: Bloqueo de abonos que exceden el saldo pendiente
  // ----------------------------------------------------
  console.log("11. Probando rechazo de abono superior al saldo pendiente...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra a crédito",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }], // Total 3450
    });

    assertThrows(() => {
      registrarAbonoCompra(db, {
        compraId: compra.id,
        fecha: "2026-11-15",
        monto: 5000,
        creadoPor: "Admin",
      });
    }, "excede el saldo pendiente");
    console.log("   ✓ Abono excesivo bloqueado correctamente.");
  }

  // ----------------------------------------------------
  // PRUEBA 12: Devolución a proveedor genera salida en Kárdex
  // ----------------------------------------------------
  console.log("12. Probando devolución de mercancía a proveedor con salida física...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra directa de cemento",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidad: 20, precio: 300 }],
    });

    const stockPrevio = db.productos[0].stockActual; // 10 + 20 = 30

    // Devolución de 5 bolsas por estar rotas
    const devolucion = registrarDevolucionProveedor(db, {
      compraId: compra.id,
      fecha: "2026-11-07",
      motivo: "Bolsas de cemento rotas de fábrica",
      notaCreditoProveedor: "NC-104",
      creadoPor: "Bodeguero",
      items: [{ productoId: "prod-1", cantidad: 5 }],
    });

    assert(devolucion.numero.startsWith("DEV-"), "Folio debe tener prefijo DEV-");
    assert(db.productos[0].stockActual === stockPrevio - 5, "Stock debe haber bajado 5 unidades");

    const movDev = db.movimientos.find((m) => m.numeroReferencia === devolucion.numero);
    assert(!!movDev, "Debe existir movimiento de devolución en Kárdex");
    assert(movDev?.tipo === "SALIDA", "Movimiento debe ser SALIDA");
    assert(movDev?.cantidad === 5, "Cantidad de salida debe ser 5");
    console.log("   ✓ Devolución registrada con salida física en Kárdex y descuento de existencias.");
  }

  // ----------------------------------------------------
  // PRUEBA 13: Bloqueo de devolución que excede la cantidad comprada
  // ----------------------------------------------------
  console.log("13. Probando que no se puede devolver más de lo comprado en la factura...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra de 10 bolsas",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }],
    });

    assertThrows(() => {
      registrarDevolucionProveedor(db, {
        compraId: compra.id,
        fecha: "2026-11-07",
        motivo: "Sobrestock",
        creadoPor: "Bodeguero",
        items: [{ productoId: "prod-1", cantidad: 15 }], // Intenta devolver 15 cuando solo compró 10
      });
    }, "excede el disponible de la compra");
    console.log("   ✓ Devolución con cantidad superior a la compra bloqueada.");
  }

  // ----------------------------------------------------
  // PRUEBA 14: Bloqueo de devolución si no hay stock físico disponible
  // ----------------------------------------------------
  console.log("14. Probando que no se puede devolver si el stock físico actual es insuficiente...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidad: 20, precio: 300 }],
    });

    // Simulamos que el stock fue descargado por ventas
    db.productos[0].stockActual = 2; // Solo quedan 2 bolsas en bodega

    assertThrows(() => {
      registrarDevolucionProveedor(db, {
        compraId: compra.id,
        fecha: "2026-11-07",
        motivo: "Devolución pactada",
        creadoPor: "Bodeguero",
        items: [{ productoId: "prod-1", cantidad: 5 }], // Pide devolver 5 pero solo hay 2
      });
    }, "Stock insuficiente en bodega");
    console.log("   ✓ Devolución sin existencias físicas suficientes bloqueada.");
  }

  // ----------------------------------------------------
  // PRUEBA 15: Devolución en compra a crédito reduce el saldo de la deuda
  // ----------------------------------------------------
  console.log("15. Probando que devolución en compra a crédito descuenta la cuenta por pagar...");
  {
    const db = crearDBAislada();
    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra a crédito",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }], // Subtotal 3000, Total 3450
    });

    const saldoPrevio = compra.saldoPendiente!; // 3450

    // Se devuelven 2 bolsas a C$300 = C$600
    registrarDevolucionProveedor(db, {
      compraId: compra.id,
      fecha: "2026-11-07",
      motivo: "Material dañado",
      creadoPor: "Bodeguero",
      items: [{ productoId: "prod-1", cantidad: 2 }],
    });

    assert(compra.saldoPendiente === saldoPrevio - 600, `El saldo debe haber bajado 600. Saldo actual: ${compra.saldoPendiente}`);
    console.log("   ✓ Saldo de cuenta por pagar reducido automáticamente por el monto de la devolución.");
  }

  // ----------------------------------------------------
  // PRUEBA 16: Bloqueo de anulación de compra con pagos o recepciones vinculadas
  // ----------------------------------------------------
  console.log("16. Probando que compras con recepciones, pagos o devoluciones no se anulan directamente...");
  {
    const db = crearDBAislada();
    // 16a. Con recepción vinculada
    const recepcion = registrarRecepcionCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 10, costoUnitario: 300 }],
    });
    const compraConRec = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-06",
      notas: "Compra contra recepción",
      creadoPor: "Admin",
      recepcionId: recepcion.id,
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }],
    });

    assertThrows(() => {
      anularCompra(db, compraConRec.id, "Admin");
    }, "vinculada a una recepción");

    // 16b. Con pagos registrados
    const compraConPago = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-05",
      notas: "Compra",
      creadoPor: "Admin",
      condicionPago: "CREDITO",
      items: [{ productoId: "prod-2", cantidad: 10, precio: 180 }],
    });
    registrarAbonoCompra(db, {
      compraId: compraConPago.id,
      fecha: "2026-11-06",
      monto: 500,
      creadoPor: "Cajero",
    });

    assertThrows(() => {
      anularCompra(db, compraConPago.id, "Admin");
    }, "pagos o abonos registrados");

    // 16c. Con devoluciones registradas
    const compraConDev = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-05",
      notas: "Compra",
      creadoPor: "Admin",
      items: [{ productoId: "prod-2", cantidad: 10, precio: 180 }],
    });
    registrarDevolucionProveedor(db, {
      compraId: compraConDev.id,
      fecha: "2026-11-06",
      motivo: "Material defectuoso",
      creadoPor: "Bodeguero",
      items: [{ productoId: "prod-2", cantidad: 2 }],
    });

    assertThrows(() => {
      anularCompra(db, compraConDev.id, "Admin");
    }, "devoluciones a proveedor registradas");

    console.log("   ✓ Bloqueos de anulación con dependencias operativas 100% verificados.");
  }

  // ----------------------------------------------------
  // PRUEBA 17: Anulación limpia de compra directa sin movimientos posteriores
  // ----------------------------------------------------
  console.log("17. Probando anulación limpia de compra directa solitaria (regla 2B.1 y 2B.2)...");
  {
    const db = crearDBAislada();
    const stockOrig = db.productos[0].stockActual; // 10
    const costoOrig = db.productos[0].costo; // 280

    const compra = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Compra errónea",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidad: 10, precio: 320 }],
    });

    assert(db.productos[0].stockActual === 20, "Stock debe ser 20");

    anularCompra(db, compra.id, "Admin");

    assert(compra.anulada === true, "La compra debe quedar anulada");
    assert(db.productos[0].stockActual === stockOrig, "El stock debe volver exactamente al original");
    assert(db.productos[0].costo === costoOrig, `El costo debe volver a 280, actual: ${db.productos[0].costo}`);
    console.log("   ✓ Anulación solitaria revirtió stock y CPP de forma matemáticamente exacta.");
  }

  // ----------------------------------------------------
  // PRUEBA 18: Idempotencia estricta en llaves de movimientos
  // ----------------------------------------------------
  console.log("18. Probando unicidad de llaves de idempotencia en todos los flujos...");
  {
    const db = crearDBAislada();
    // 1. Pedido
    const ped = crearPedidoCompra(db, {
      proveedor: "Distribuidora Holcim",
      fechaEmision: "2026-11-05",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidadPedida: 10, precioUnitario: 300 }],
    });
    // 2. Recepción
    const rec = registrarRecepcionCompra(db, {
      pedidoId: ped.id,
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-06",
      responsable: "Bodeguero",
      items: [{ productoId: "prod-1", cantidadRecibida: 10, costoUnitario: 300 }],
    });
    // 3. Compra contra recepción
    const com = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-07",
      notas: "Factura",
      creadoPor: "Admin",
      recepcionId: rec.id,
      items: [{ productoId: "prod-1", cantidad: 10, precio: 300 }],
    });
    // 4. Devolución
    const dev = registrarDevolucionProveedor(db, {
      compraId: com.id,
      fecha: "2026-11-08",
      motivo: "Averiado",
      creadoPor: "Admin",
      items: [{ productoId: "prod-1", cantidad: 1 }],
    });

    const llaves = db.movimientos.map((m) => m.idempotencyKey).filter(Boolean);
    const unicas = new Set(llaves);
    assert(llaves.length === unicas.size, "Todas las llaves de idempotencia generadas deben ser estrictamente únicas");
    console.log("   ✓ Idempotencia garantizada: ninguna colisión ni duplicación en llaves transaccionales.");
  }

  // ----------------------------------------------------
  // PRUEBA 19: Impuesto I.V.A. (General 15%, Exento 0% y Monto Específico)
  // ----------------------------------------------------
  console.log("19. Probando tratamiento de I.V.A. nicaragüense no universal y configurable...");
  {
    const db = crearDBAislada();
    // 19a. Compra exenta de I.V.A. (0%)
    const compraExenta = registrarCompra(db, {
      proveedor: "Distribuidora Holcim",
      fecha: "2026-11-05",
      notas: "Materiales exentos de I.V.A.",
      creadoPor: "Admin",
      iva: 0,
      items: [{ productoId: "prod-1", cantidad: 10, precio: 200 }], // Subtotal: 2000
    });
    assert(compraExenta.iva === 0, "El I.V.A. debe ser exactamente 0 en compra exenta");
    assert(compraExenta.total === 2000, `El total debe ser exactamente 2000, obtenido: ${compraExenta.total}`);

    // 19b. Compra con I.V.A. desglosado específico de factura
    const compraConIvaManual = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-06",
      notas: "Factura con I.V.A. desglosado",
      creadoPor: "Admin",
      iva: 150.50,
      items: [{ productoId: "prod-2", cantidad: 10, precio: 100 }], // Subtotal: 1000
    });
    assert(compraConIvaManual.iva === 150.50, "El I.V.A. debe tomar el valor exacto desglosado");
    assert(compraConIvaManual.total === 1150.50, "Total debe sumar subtotal + IVA desglosado");
    console.log("   ✓ I.V.A. verificado: soporte para exenciones y desglose real sin imposición fija a ciegas.");
  }

  // ----------------------------------------------------
  // PRUEBA 20: Devolución a proveedor cuando el CPP vigente difiere del costo de compra
  // ----------------------------------------------------
  console.log("20. Probando que devolución cuando CPP difiere del costo no corrompe la valoración del saldo...");
  {
    const db = crearDBAislada();
    // Prod 2 inicia con 50 unidades a C$160 (inventario inicial)
    // Compra 1: 50 unidades a C$160 -> Stock: 100, CPP: 160
    const compra1 = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-05",
      notas: "Lote económico",
      creadoPor: "Admin",
      items: [{ productoId: "prod-2", cantidad: 50, precio: 160 }],
    });
    assert(db.productos[1].stockActual === 100, "Stock debe ser 100");
    assert(db.productos[1].costo === 160, "CPP debe ser 160");

    // Compra 2: 50 unidades más caras a C$220 -> Stock: 150
    // CPP nuevo: (100 * 160 + 50 * 220) / 150 = (16000 + 11000) / 150 = 27000 / 150 = 180
    const compra2 = registrarCompra(db, {
      proveedor: "Corporación Sidenor",
      fecha: "2026-11-06",
      notas: "Lote caro posterior",
      creadoPor: "Admin",
      items: [{ productoId: "prod-2", cantidad: 50, precio: 220 }],
    });
    assert(db.productos[1].stockActual === 150, "Stock debe ser 150");
    assert(db.productos[1].costo === 180, `CPP vigente debe ser 180, actual: ${db.productos[1].costo}`);

    // Ahora se devuelven 10 unidades de la Compra 1 (donde el costo original de adquisición fue 160, pero el CPP vigente es 180)
    const devolucion = registrarDevolucionProveedor(db, {
      compraId: compra1.id,
      fecha: "2026-11-08",
      motivo: "Material defectuoso lote 1",
      notaCreditoProveedor: "NC-SID-01",
      creadoPor: "Bodeguero",
      items: [{ productoId: "prod-2", cantidad: 10 }],
    });

    // 1. Stock remanente: 150 - 10 = 140 unidades
    assert(db.productos[1].stockActual === 140, "Stock remanente debe ser 140");

    // 2. Coherencia contable: El CPP vigente de las 140 unidades que quedan en almacén se mantiene estable en 180
    // (no sufre distorsiones artificiales, ni se corrompe a un número erróneo)
    assert(db.productos[1].costo === 180, `El CPP de las unidades remanentes debe conservarse en 180, actual: ${db.productos[1].costo}`);

    // 3. Kárdex: la salida física se valoró al CPP vigente de libros (180)
    const movDev = db.movimientos.find((m) => m.numeroReferencia === devolucion.numero);
    assert(movDev?.costoUnitario === 180, `La salida física en Kárdex debe valorarse a CPP vigente 180, actual: ${movDev?.costoUnitario}`);

    // 4. Nota de crédito con el proveedor: se liquida al costo original facturado (10 * 160 = 1600)
    assert(devolucion.total === 1600, `La nota de crédito comercial debe ser 1600, actual: ${devolucion.total}`);
    console.log("   ✓ Devolución con CPP diferente validada: CPP remanente protegido y Kárdex 100% consistente.");
  }

  console.log("\n=== TODAS LAS 20 PRUEBAS DE LA ETAPA 3 PASARON EXITOSAMENTE AL 100% ===");
}

main().catch((err) => {
  console.error("\n❌ ERROR EN LA SUITE DE PRUEBAS DE LA ETAPA 3:", err);
  process.exit(1);
});
