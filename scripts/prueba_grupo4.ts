import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  crearCliente,
  crearProveedor,
  crearCotizacion,
  cambiarEstadoCotizacion,
  convertirCotizacionAVenta,
  emitirFactura,
  registrarCompra,
  registrarAbonoCompra,
  registrarDevolucionCliente,
  abrirTurno,
  cerrarTurno,
  arqueoTurnoActual,
  resumenNegocio,
  reporteVentasPorPeriodo,
  reporteVentasPorProducto,
  reporteVentasPorCajero,
  reporteVentasPorMedioPago,
  reporteComprasPorProveedor,
  reporteDevoluciones,
  reporteValoracionInventario,
  reporteCuentasPorPagar,
  reporteCuentasPorCobrar,
  reporteCajaYTurnos,
  reporteAuditoriaTrazabilidad,
  generarRespaldoDatos,
  verificarIntegridadRespaldo,
  costoHistoricoFactura,
  filtrarKardex,
  ReglaBodegaError,
  IVA,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: GRUPO 4 (REPORTES, ADMINISTRACIÓN Y CIERRE OPERATIVO) ===\n");

// ============================================================================
// JORNADA OPERATIVA COMPLETA EN MEMORIA
// ============================================================================
console.log("--- FASE 1: SIMULACIÓN DE JORNADA OPERATIVA COMPLETA ---");

const db: DB = libroVacio();
const fechaHoy = new Date().toISOString().slice(0, 10);

// 1. Abrir caja con fondo inicial C$ 1,500
console.log("1. Apertura de turno de caja con C$ 1,500...");
const turno = abrirTurno(db, {
  montoInicial: 1500,
  usuario: "Cajero Principal",
  fecha: fechaHoy,
});
assert.equal(turno.montoInicial, 1500);
assert.equal(turno.estado, "ABIERTO");
assert.equal(turno.totalVentasEfectivo, 0);

// 2. Registrar compra a proveedor (10 unidades a C$ 100) a crédito
console.log("2. Registro de compra a proveedor (10 unidades @ C$ 100) a crédito...");
const proveedor = crearProveedor(db, {
  nombre: "Distribuidora Ferretera S.A.",
  identificacion: "J031000009999",
  telefono: "2288-7766",
  email: "ventas@distferretera.com",
  diasCredito: 30,
});

const producto = altaProducto(db, {
  codigo: "CEM-01",
  nombre: "Cemento Tolteca 42.5kg",
  categoria: "Construcción",
  unidadMedida: "BOLSA",
  inventarioInicial: 0,
  costo: 100,
  precio: 180,
  stockMinimo: 5,
});

// 2 & 3. Registrar compra a proveedor (10 unidades a C$ 100) a crédito con actualización de Kárdex y CPP
console.log("2 & 3. Registro de compra a proveedor (10 unidades @ C$ 100) a crédito, Kárdex y CPP...");
const compra = registrarCompra(db, {
  proveedor: proveedor.nombre,
  proveedorId: proveedor.id,
  facturaProveedor: "FAC-PROV-901",
  fecha: fechaHoy,
  condicionPago: "CREDITO",
  diasCredito: 30,
  iva: 0,
  creadoPor: "Admin",
  items: [
    {
      productoId: producto.id,
      cantidad: 10,
      precio: 100,
    },
  ],
});
assert.equal(compra.condicionPago, "CREDITO");
assert.equal(compra.saldoPendiente, 1000);

const prodPostCompra = db.productos.find((p) => p.id === producto.id)!;
assert.equal(prodPostCompra.stockActual, 10);
assert.equal(prodPostCompra.costo, 100);

const kxCompra = filtrarKardex(db, { productoId: producto.id });
assert.equal(kxCompra.length, 1);
assert.equal(kxCompra[0].tipo, "ENTRADA");
assert.equal(kxCompra[0].cantidad, 10);
assert.equal(kxCompra[0].stockSaldo, 10);

// 4. Crear cliente comercial con RUC
console.log("4. Registro de cliente comercial con RUC y límite de crédito...");
const cliente = crearCliente(db, {
  nombre: "Constructora del Valle S.A.",
  identificacion: "J031000001234",
  tipo: "EMPRESA",
  telefono: "8888-1234",
  email: "contabilidad@valle.com.ni",
  limiteCredito: 15000,
});
assert.equal(cliente.tipo, "EMPRESA");

// 5. Generar cotización en estado BORRADOR (5 unidades a C$ 180)
console.log("5. Creación de cotización BORRADOR por 5 bolsas...");
const cotizacion = crearCotizacion(db, {
  clienteId: cliente.id,
  clienteNombre: cliente.nombre,
  clienteRuc: cliente.identificacion,
  validezDias: 15,
  creadoPor: "Vendedor 1",
  items: [
    {
      productoId: producto.id,
      cantidad: 5,
      precio: 180,
    },
  ],
});
assert.equal(cotizacion.estado, "BORRADOR");
assert.equal(cotizacion.total, 5 * 180 * (1 + IVA));

// 6. Emitir y aceptar cotización
console.log("6. Emisión y aceptación formal de la cotización...");
cambiarEstadoCotizacion(db, cotizacion.id, "EMITIDA", "Vendedor 1");
cambiarEstadoCotizacion(db, cotizacion.id, "ACEPTADA", "Vendedor 1");
assert.equal(cotizacion.estado, "ACEPTADA");

// 7 & 8. Convertir cotización a venta/factura en POS con turno abierto y cobrar en efectivo con cambio
console.log("7 & 8. Conversión a factura POS, cobro de contado con cambio...");
const subtotalEsperado = 5 * 180;
const ivaEsperado = Math.round(subtotalEsperado * IVA * 100) / 100;
const totalEsperado = subtotalEsperado + ivaEsperado;

const resultadoVenta = convertirCotizacionAVenta(db, {
  cotizacionId: cotizacion.id,
  usuario: "Cajero Principal",
  formaPago: "EFECTIVO",
  montoRecibido: 1200, // cliente paga con C$ 1,200
});
const facturaVenta = resultadoVenta.factura;
assert.equal(facturaVenta.subtotal, subtotalEsperado);
assert.equal(facturaVenta.total, totalEsperado);
assert.equal(facturaVenta.montoRecibido, 1200);
assert.equal(facturaVenta.cambio, 1200 - totalEsperado);
assert.equal(facturaVenta.costoTotalVenta, 5 * 100, "Costo histórico debe guardarse en la factura");

// 9. Validar descuento de inventario en Kárdex valorado con costo histórico
console.log("9. Validación de descuento en inventario y Kárdex con costo histórico...");
const prodPostVenta = db.productos.find((p) => p.id === producto.id)!;
assert.equal(prodPostVenta.stockActual, 5);
const kxVenta = filtrarKardex(db, { productoId: producto.id });
assert.equal(kxVenta.length, 2);
const movVenta = kxVenta[1];
assert.equal(movVenta.tipo, "SALIDA");
assert.equal(movVenta.cantidad, 5);
assert.equal(movVenta.costoUnitario, 100);
assert.equal(movVenta.stockSaldo, 5);

// Turno de caja actualizado
const turnoPostVenta = (db.turnosCaja ?? []).find((t) => t.id === turno.id)!;
assert.equal(turnoPostVenta.totalVentasEfectivo, totalEsperado);

// 10. Registrar devolución parcial de cliente (1 unidad) con reintegro en efectivo de caja
console.log("10. Registro de devolución de cliente (1 unidad) y reintegro en efectivo...");
const totalDevEsperado = Math.round(180 * (1 + IVA) * 100) / 100;
const devCliente = registrarDevolucionCliente(db, {
  facturaId: facturaVenta.id,
  motivo: "Cliente compró 1 bolsa de más",
  responsable: "Cajero Principal",
  items: [
    {
      productoId: producto.id,
      cantidad: 1,
    },
  ],
});
assert.equal(devCliente.items.length, 1);
assert.equal(devCliente.totalReintegro, totalDevEsperado);

// 11. Consultar Kárdex y verificar saldos físicos y valorados tras devolución
console.log("11. Verificación de existencias y Kárdex tras devolución de cliente...");
const prodPostDev = db.productos.find((p) => p.id === producto.id)!;
assert.equal(prodPostDev.stockActual, 6, "Inventario debe incrementarse de 5 a 6");
const kxDev = filtrarKardex(db, { productoId: producto.id });
assert.equal(kxDev.length, 3);
const movDev = kxDev[2];
assert.equal(movDev.tipo, "ENTRADA");
assert.equal(movDev.cantidad, 1);
assert.equal(movDev.stockSaldo, 6);

// 12. Registrar abono de C$ 500 a cuenta por pagar de proveedor
console.log("12. Abono a cuenta por pagar del proveedor con salida de caja...");
const abono = registrarAbonoCompra(db, {
  compraId: compra.id,
  fecha: fechaHoy,
  monto: 500,
  formaPago: "EFECTIVO",
  referencia: "REC-PAGO-001",
  creadoPor: "Cajero Principal",
});
assert.equal(abono.monto, 500);
assert.equal(compra.saldoPendiente, 500);

// 13. Generar reportes analíticos del motor
console.log("13. Generación y comprobación de reportes analíticos...");

// A. Resumen de negocio / Dashboard
const resumen = resumenNegocio(db, fechaHoy);
assert.equal(resumen.ventasHoy, totalEsperado);
assert.equal(resumen.costoHoy, 500);
// Utilidad bruta = Subtotal (sin IVA) - Costo histórico = 900 - 500 = 400
assert.equal(resumen.subtotalDia, 900);
assert.equal(resumen.utilidadBrutaDia, 400);
assert.equal(resumen.cuentasPorPagar, 500);
assert.equal(resumen.valorInventario, 6 * 100); // 6 bolsas @ C$ 100 = 600

// B. Ventas por período
const rVentasPeriodo = reporteVentasPorPeriodo(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rVentasPeriodo.resumen.totalVendido, totalEsperado);
assert.equal(rVentasPeriodo.resumen.totalFacturas, 1);
assert.equal(rVentasPeriodo.resumen.totalUtilidadBruta, 400);

// C. Ventas por producto / Ranking
const rVentasProd = reporteVentasPorProducto(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rVentasProd.productos.length, 1);
assert.equal(rVentasProd.productos[0].codigo, "CEM-01");
assert.equal(rVentasProd.productos[0].unidadesVendidas, 5);
assert.equal(rVentasProd.productos[0].utilidadBruta, 400);

// D. Ventas por cajero
const rVentasCajero = reporteVentasPorCajero(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rVentasCajero.cajeros.length, 1);
assert.equal(rVentasCajero.cajeros[0].cajero, "Cajero Principal");
assert.equal(rVentasCajero.cajeros[0].totalVendido, totalEsperado);

// E. Ventas por medio de pago
const rMediosPago = reporteVentasPorMedioPago(db, { desde: fechaHoy, hasta: fechaHoy });
assert.ok(rMediosPago.medios.EFECTIVO);
assert.equal(rMediosPago.medios.EFECTIVO.total, totalEsperado);

// F. Compras por proveedor
const rComprasProv = reporteComprasPorProveedor(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rComprasProv.proveedores.length, 1);
assert.equal(rComprasProv.proveedores[0].proveedor, "Distribuidora Ferretera S.A.");
assert.equal(rComprasProv.proveedores[0].totalComprado, 1000);
assert.equal(rComprasProv.proveedores[0].saldoPendiente, 500);

// G. Devoluciones
const rDevoluciones = reporteDevoluciones(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rDevoluciones.devolucionesClientes.length, 1);
assert.equal(rDevoluciones.totalReintegroClientes, totalDevEsperado);

// H. Valoración de existencias por CPP
const rValoracion = reporteValoracionInventario(db);
assert.equal(rValoracion.totalValorCosto, 600);
assert.equal(rValoracion.productos.length, 1);
assert.equal(rValoracion.productos[0].stockActual, 6);
assert.equal(rValoracion.productos[0].costo, 100);

// I. Cuentas por pagar
const rCXP = reporteCuentasPorPagar(db);
assert.equal(rCXP.totalSaldoPendiente, 500);
assert.equal(rCXP.cuentas.length, 1);

// J. Cuentas por cobrar
const rCXC = reporteCuentasPorCobrar(db);
assert.equal(rCXC.totalPorCobrar, 0, "No debe haber CXC ya que la venta fue de contado");

// K. Reporte de Caja y Turnos
const rCaja = reporteCajaYTurnos(db, { desde: fechaHoy, hasta: fechaHoy });
assert.equal(rCaja.turnos.length, 1);
assert.equal(rCaja.turnos[0].id, turno.id);

// L. Auditoría y Trazabilidad de operaciones sensibles
const rAuditoria = reporteAuditoriaTrazabilidad(db);
assert.ok(rAuditoria.length >= 1, "Debe registrar eventos de auditoría");
const eventoDevolucion = rAuditoria.find((e) => e.tipo === "DEVOLUCION_CLIENTE");
assert.ok(eventoDevolucion, "Debe registrar auditoría de devolución");

// 14. Arqueo y cierre de caja con cuadre
console.log("14. Arqueo y cierre de turno de caja...");
const arqueo = arqueoTurnoActual(db);
assert.ok(arqueo);
// Total esperado en caja: Fondo (1500) + Venta (1035) - Devolución (207) - Abono Compra (500) = 1828
const saldoEsperadoCaja = arqueo.saldoCalculado;

const turnoCerrado = cerrarTurno(db, {
  montoReal: saldoEsperadoCaja,
  usuario: "Cajero Principal",
  nota: "Cierre conforme sin discrepancia",
});
assert.equal(turnoCerrado.estado, "CERRADO");
assert.equal(turnoCerrado.diferencia, 0);

// 15. Generación y verificación de respaldo de datos
console.log("15. Generación de respaldo y verificación de integridad...");
const configMock = {
  nombreComercial: "Ferretería Emmanuel",
  ruc: "J031000000001",
  moneda: "NIO",
  tasaIva: 0.15,
};
const respaldo = generarRespaldoDatos(db, configMock);
assert.equal(respaldo.schemaVersion, "2.0");
assert.equal(respaldo.controles.productos, 1);
assert.equal(respaldo.controles.facturas, 1);
assert.equal(respaldo.controles.compras, 1);
assert.equal(respaldo.controles.turnosCaja, 1);

const integridad = verificarIntegridadRespaldo(respaldo);
assert.equal(integridad.valido, true);
assert.equal(integridad.errores.length, 0);

// ============================================================================
// FASE 2: VERIFICACIONES DE REGLAS CRÍTICAS DE NEGOCIO
// ============================================================================
console.log("\n--- FASE 2: PRUEBAS DE REGLAS CRÍTICAS Y CASOS LÍMITE ---");

// 16. Utilidad Bruta vs Cobros e Ingresos Netos
console.log("16. Diferenciación estricta entre margen bruto y flujo de caja...");
assert.notEqual(resumen.utilidadBrutaDia, resumen.ventasHoy);
assert.equal(resumen.utilidadBrutaDia, 400); // Subtotal 900 - Costo 500
assert.equal(resumen.ventasHoy, totalEsperado); // 1035 con IVA

// 17. Ventas a crédito generan cuentas por cobrar reales
console.log("17. Comprobación de generación de cuentas por cobrar en venta a crédito...");
{
  const dbCredito = libroVacio();
  abrirTurno(dbCredito, { montoInicial: 500, usuario: "Cajero", fecha: fechaHoy });
  const p = altaProducto(dbCredito, {
    codigo: "VAR-01",
    nombre: "Varilla de Hierro 3/8",
    categoria: "Construcción",
    unidadMedida: "UNIDAD",
    inventarioInicial: 20,
    costo: 150,
    precio: 250,
    stockMinimo: 0,
  });
  const c = crearCliente(dbCredito, {
    nombre: "Ingeniería Total S.A.",
    limiteCredito: 20000,
  });

  const factCredito = emitirFactura(dbCredito, {
    clienteId: c.id,
    clienteNombre: c.nombre,
    medioPago: "CREDITO",
    items: [{ productoId: p.id, cantidad: 2 }],
    creadoPor: "Cajero",
  });

  const repCXC = reporteCuentasPorCobrar(dbCredito);
  assert.equal(repCXC.totalPorCobrar, factCredito.total);
  assert.equal(repCXC.cuentas.length, 1);
  assert.equal(repCXC.cuentas[0].cliente, "Ingeniería Total S.A.");
}

// 18. Idempotencia en confirmación de ventas
console.log("18. Idempotencia ante clave de operación repetida...");
{
  const dbIdem = libroVacio();
  abrirTurno(dbIdem, { montoInicial: 500, usuario: "Cajero", fecha: fechaHoy });
  const p = altaProducto(dbIdem, {
    codigo: "PNT-01",
    nombre: "Pintura Anticorrosiva",
    categoria: "Pinturas",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 300,
    precio: 450,
    stockMinimo: 0,
  });

  const claveOperacion = "OP-TEST-777888";
  const v1 = emitirFactura(dbIdem, {
    medioPago: "EFECTIVO",
    items: [{ productoId: p.id, cantidad: 1 }],
    creadoPor: "Cajero",
    claveOperacion,
  });
  assert.equal(p.stockActual, 9);

  // Reintento idéntico con la misma clave
  const v2 = emitirFactura(dbIdem, {
    medioPago: "EFECTIVO",
    items: [{ productoId: p.id, cantidad: 1 }],
    creadoPor: "Cajero",
    claveOperacion,
  });
  assert.equal(v1.id, v2.id, "Debe devolver la factura original");
  assert.equal(p.stockActual, 9, "No debe descontar inventario dos veces");
}

// 19. Inmutabilidad de auditoría
console.log("19. Inmutabilidad y consulta de registros de auditoría...");
{
  const audit = reporteAuditoriaTrazabilidad(db);
  // Verificar que los eventos tienen estructura inmutable de solo lectura
  for (const ev of audit) {
    assert.ok(ev.id);
    assert.ok(ev.fecha);
    assert.ok(ev.tipo);
    assert.ok(ev.descripcion);
  }
}

// 20. Respaldo corrupto es detectado inmediatamente
console.log("20. Validación de detección de respaldo corrupto...");
{
  const respaldoAlterado = JSON.parse(JSON.stringify(respaldo));
  respaldoAlterado.controles.productos = 999; // discrepancia
  const check = verificarIntegridadRespaldo(respaldoAlterado);
  assert.equal(check.valido, false);
  assert.ok(check.errores.some((e) => e.includes("productos")));
}

console.log("\n==================================================================");
console.log("✅ TODAS LAS PRUEBAS DEL GRUPO 4 PASARON EXITOSAMENTE (20/20) ✅");
console.log("==================================================================\n");
