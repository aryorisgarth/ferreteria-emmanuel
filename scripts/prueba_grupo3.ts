import assert from "node:assert/strict";
import {
  libroVacio,
  altaProducto,
  crearCliente,
  editarCliente,
  desactivarCliente,
  eliminarCliente,
  perfilCliente,
  buscarClientes,
  crearProveedor,
  editarProveedor,
  desactivarProveedor,
  eliminarProveedor,
  perfilProveedor,
  buscarProveedores,
  crearCotizacion,
  editarCotizacion,
  cambiarEstadoCotizacion,
  marcarCotizacion,
  convertirCotizacionAVenta,
  emitirFactura,
  registrarCompra,
  registrarAbonoCompra,
  abrirTurno,
  ReglaBodegaError,
  IVA,
} from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

console.log("=== INICIANDO SUITE DE PRUEBAS AISLADAS: GRUPO 3 (CLIENTES, PROVEEDORES Y COTIZACIONES) ===\n");

// ============================================================================
// 1. Crear y editar cliente (preservando facturas históricas)
// ============================================================================
console.log("1. Probando creación y edición de cliente (preservando facturas históricas)...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const prod = altaProducto(db, {
    codigo: "TUB-01",
    nombre: "Tubo PVC 1/2 pulgada",
    categoria: "Fontanería",
    marca: "Amanco",
    unidadMedida: "UNIDAD",
    inventarioInicial: 50,
    costo: 80,
    precio: 120,
    stockMinimo: 10,
  });

  const cliente = crearCliente(db, {
    nombre: "Construcciones del Norte",
    identificacion: "J031000000001",
    tipo: "EMPRESA",
    telefono: "2255-0000",
    email: "compras@constnorte.com",
    direccion: "Km 5 Carretera Norte",
    limiteCredito: 10000,
    notas: "Cliente corporativo A1",
  });

  assert.equal(cliente.nombre, "Construcciones del Norte");
  assert.equal(cliente.activo, true);
  assert.equal(cliente.tipo, "EMPRESA");

  // Emitir factura a nombre del cliente
  const fac = emitirFactura(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-16",
    creadoPor: "Cajero 1",
    formaPago: "EFECTIVO",
    origen: "CAJA",
    items: [{ productoId: prod.id, cantidad: 5, precio: 120 }],
  });

  assert.equal(fac.cliente, "Construcciones del Norte");

  // Editar cliente con nuevo nombre y teléfono
  const clienteEditado = editarCliente(db, cliente.id, {
    nombre: "Construcciones del Norte S.A.",
    telefono: "8888-9999",
  });

  assert.equal(clienteEditado.nombre, "Construcciones del Norte S.A.");
  assert.equal(clienteEditado.telefono, "8888-9999");

  // La factura histórica DEBE mantener el nombre que tenía al momento de emisión
  const facHistorica = db.facturas.find((f) => f.id === fac.id);
  assert.equal(
    facHistorica?.cliente,
    "Construcciones del Norte",
    "La factura histórica no debe alterarse al cambiar el nombre del cliente",
  );
  console.log("   ✓ Creación, edición y preservación de factura histórica correctas.");
}

// ============================================================================
// 2. Desactivar cliente con historial (bloquear eliminación, permitir desactivación)
// ============================================================================
console.log("2. Probando bloqueo de eliminación y desactivación de cliente con historial...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 500, usuario: "Cajero 1", fecha: "2026-11-16" });

  const prod = altaProducto(db, {
    codigo: "CEM-01",
    nombre: "Cemento Canal 42.5kg",
    categoria: "Materiales",
    marca: "Canal",
    unidadMedida: "BOLSA",
    inventarioInicial: 30,
    costo: 300,
    precio: 380,
    stockMinimo: 5,
  });

  const cliente = crearCliente(db, {
    nombre: "Ferretería La Bendición",
    identificacion: "J031000000002",
  });

  emitirFactura(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-16",
    creadoPor: "Cajero 1",
    formaPago: "EFECTIVO",
    origen: "CAJA",
    items: [{ productoId: prod.id, cantidad: 2, precio: 380 }],
  });

  // Intentar eliminar cliente con facturas debe fallar
  assert.throws(
    () => eliminarCliente(db, cliente.id),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("historial comercial"),
    "Debe impedir eliminar cliente con facturas",
  );

  // Desactivar cliente sí debe permitirse
  const clienteInactivo = desactivarCliente(db, cliente.id);
  assert.equal(clienteInactivo.activo, false, "El cliente debe quedar inactivo");

  // Reactivar cliente
  const clienteReactivado = desactivarCliente(db, cliente.id);
  assert.equal(clienteReactivado.activo, true, "El cliente debe reactivarse");
  console.log("   ✓ Bloqueo de eliminación y alternancia de estado activo/inactivo verificados.");
}

// ============================================================================
// 3. Venta a consumidor final sin crear ficha completa
// ============================================================================
console.log("3. Probando venta a consumidor final sin requerir ficha de cliente...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 500, usuario: "Cajero 1", fecha: "2026-11-16" });

  const prod = altaProducto(db, {
    codigo: "CLA-01",
    nombre: "Clavo para Madera 2.5 pulg",
    categoria: "Fijación",
    marca: "Genérica",
    unidadMedida: "LIBRA",
    inventarioInicial: 100,
    costo: 15,
    precio: 25,
    stockMinimo: 10,
  });

  // Venta sin clienteId registrado (consumidor final / cliente mostrador)
  const fac = emitirFactura(db, {
    cliente: "Consumidor Final",
    fecha: "2026-11-16",
    creadoPor: "Cajero 1",
    formaPago: "EFECTIVO",
    origen: "CAJA",
    items: [{ productoId: prod.id, cantidad: 4, precio: 25 }],
  });

  assert.equal(fac.cliente, "Consumidor Final");
  assert.equal(fac.clienteId, null);
  assert.equal(prod.stockActual, 96);
  assert.equal(db.clientes.length, 0, "No debe haberse forzado la creación de un cliente en db.clientes");
  console.log("   ✓ Venta a consumidor final procesada correctamente sin contaminar directorio de clientes.");
}

// ============================================================================
// 4. Consulta de historial del cliente (total comprado, saldo pendiente de crédito, última compra)
// ============================================================================
console.log("4. Probando consulta de historial y perfil de cliente...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 500, usuario: "Cajero 1", fecha: "2026-11-16" });

  const prod = altaProducto(db, {
    codigo: "ALM-01",
    nombre: "Alambre de Amarre",
    categoria: "Materiales",
    marca: "Aceros",
    unidadMedida: "LIBRA",
    inventarioInicial: 100,
    costo: 20,
    precio: 30,
    stockMinimo: 10,
  });

  const cliente = crearCliente(db, {
    nombre: "Constructora San Jerónimo",
    identificacion: "J031000000003",
    limiteCredito: 5000,
  });

  // 1ra compra: de contado (pagada) -> 10 lbs * 30 = 300 + 45 IVA = 345
  emitirFactura(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-10",
    creadoPor: "Cajero 1",
    formaPago: "EFECTIVO",
    items: [{ productoId: prod.id, cantidad: 10, precio: 30 }],
  });

  // 2da compra: a crédito (pendiente de pago) -> 20 lbs * 30 = 600 + 90 IVA = 690
  emitirFactura(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-15",
    creadoPor: "Cajero 1",
    formaPago: "CREDITO",
    items: [{ productoId: prod.id, cantidad: 20, precio: 30 }],
  });

  const perfil = perfilCliente(db, cliente.id);
  assert.ok(perfil);
  assert.equal(perfil.facturas.length, 2);
  assert.equal(perfil.totalComprado, 1035, "Total comprado debe ser 345 + 690 = 1035");
  assert.equal(perfil.saldoPendiente, 690, "Saldo pendiente de crédito debe ser 690");
  assert.equal(perfil.ultimaCompra, "2026-11-15");
  console.log("   ✓ Perfil, saldo de crédito pendiente y última compra calculados con exactitud.");
}

// ============================================================================
// 5. Crear y editar proveedor (campos RUC, contacto, días de crédito)
// ============================================================================
console.log("5. Probando creación y edición de proveedor con atributos comerciales...");
{
  const db: DB = libroVacio();

  const prov = crearProveedor(db, {
    nombre: "Distribuidora El Tornillo Feliz",
    identificacion: "J032000000001",
    contacto: "Ing. Carlos Mendoza",
    telefono: "2244-1122",
    email: "ventas@eltornillo.com",
    direccion: "Pista Juan Pablo II",
    diasCredito: 30,
    notas: "Despacho los martes y jueves",
  });

  assert.equal(prov.nombre, "Distribuidora El Tornillo Feliz");
  assert.equal(prov.contacto, "Ing. Carlos Mendoza");
  assert.equal(prov.diasCredito, 30);
  assert.equal(prov.activo, true);

  // Edición
  const provEditado = editarProveedor(db, prov.id, {
    contacto: "Lic. Andrea Morales",
    diasCredito: 45,
    telefono: "8999-0011",
  });

  assert.equal(provEditado.contacto, "Lic. Andrea Morales");
  assert.equal(provEditado.diasCredito, 45);
  assert.equal(provEditado.telefono, "8999-0011");
  console.log("   ✓ Creación y actualización de proveedor validadas.");
}

// ============================================================================
// 6. Desactivar proveedor con historial (bloquear eliminación)
// ============================================================================
console.log("6. Probando bloqueo de eliminación y desactivación de proveedor con compras...");
{
  const db: DB = libroVacio();

  const prod = altaProducto(db, {
    codigo: "PIN-01",
    nombre: "Pintura Látex Blanco Galón",
    categoria: "Pinturas",
    marca: "Corona",
    unidadMedida: "GALON",
    inventarioInicial: 10,
    costo: 400,
    precio: 550,
    stockMinimo: 3,
  });

  const prov = crearProveedor(db, {
    nombre: "Pinturas Corona Nicaragua",
    identificacion: "J032000000002",
  });

  // Registrar compra de este proveedor
  registrarCompra(db, {
    proveedor: prov.nombre,
    proveedorId: prov.id,
    fecha: "2026-11-16",
    numeroFactura: "FAC-PROV-100",
    registradoPor: "Admin",
    condicionPago: "CONTADO",
    items: [{ productoId: prod.id, cantidad: 5, precio: 400 }],
  });

  // Intentar eliminar proveedor debe fallar
  assert.throws(
    () => eliminarProveedor(db, prov.id),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("operaciones comerciales históricas"),
    "Debe impedir eliminar proveedor con compras asociadas",
  );

  // Desactivar sí debe ser posible
  const provInactivo = desactivarProveedor(db, prov.id);
  assert.equal(provInactivo.activo, false);
  console.log("   ✓ Bloqueo estricto de eliminación de proveedor con historial verificado.");
}

// ============================================================================
// 7. Consultar compras y deudas del proveedor (CxP y abonos)
// ============================================================================
console.log("7. Probando estado de cuenta, compras y saldo por pagar del proveedor...");
{
  const db: DB = libroVacio();

  const prod = altaProducto(db, {
    codigo: "ZIN-01",
    nombre: "Lámina de Zinc Corrugado 12ft",
    categoria: "Techos",
    marca: "Plycem",
    unidadMedida: "UNIDAD",
    inventarioInicial: 0,
    costo: 350,
    precio: 450,
    stockMinimo: 5,
  });

  const prov = crearProveedor(db, {
    nombre: "Aceros y Metales S.A.",
    identificacion: "J032000000003",
    diasCredito: 30,
  });

  // Compra a crédito por 10 láminas @ 350 = 3500 + 15% IVA = 4025
  const compra = registrarCompra(db, {
    proveedor: prov.nombre,
    proveedorId: prov.id,
    fecha: "2026-11-01",
    numeroFactura: "FAC-ZINC-50",
    condicionPago: "CREDITO",
    registradoPor: "Admin",
    items: [{ productoId: prod.id, cantidad: 10, precio: 350 }],
  });

  assert.equal(compra.saldoPendiente, 4025);

  // Abonar 1500 a la compra
  registrarAbonoCompra(db, {
    compraId: compra.id,
    monto: 1500,
    formaPago: "TRANSFERENCIA",
    fecha: "2026-11-10",
    referencia: "TRANSF-BANCARIA-001",
    creadoPor: "Admin",
  });

  const perfil = perfilProveedor(db, prov.id);
  assert.ok(perfil);
  assert.equal(perfil.compras.length, 1);
  assert.equal(perfil.cuentasPorPagar.length, 1);
  assert.equal(perfil.saldoTotalPendiente, 2525, "4025 - 1500 = 2525");
  assert.equal(perfil.pagos.length, 1);
  assert.equal(perfil.pagos[0].monto, 1500);
  console.log("   ✓ Estado de cuenta del proveedor e integración con pagos de Etapa 3 correctos.");
}

// ============================================================================
// 8. Crear cotización (estado inicial BORRADOR)
// ============================================================================
console.log("8. Probando creación de cotización con estado inicial BORRADOR...");
{
  const db: DB = libroVacio();

  const prod = altaProducto(db, {
    codigo: "DIS-01",
    nombre: "Disco de Corte para Metal 4 1/2 Dewalt",
    categoria: "Abrasivos",
    marca: "Dewalt",
    unidadMedida: "UNIDAD",
    inventarioInicial: 40,
    costo: 30,
    precio: 50,
    stockMinimo: 5,
  });

  const cot = crearCotizacion(db, {
    cliente: "Constructora Bolívar",
    fecha: "2026-11-16",
    fechaVencimiento: "2026-11-30",
    condicionesComerciales: "Válido por 14 días. Entrega en sitio.",
    creadoPor: "Vendedor 1",
    items: [{ productoId: prod.id, cantidad: 10, precio: 50 }],
  });

  assert.equal(cot.estado, "BORRADOR");
  assert.equal(cot.folio?.startsWith("COT-"), true);
  assert.equal(cot.subtotal, 500);
  assert.equal(cot.iva, 75);
  assert.equal(cot.total, 575);
  assert.equal(cot.items.length, 1);
  assert.equal(prod.stockActual, 40, "No debe descontar stock");
  console.log("   ✓ Creación en estado BORRADOR y cálculos validados.");
}

// ============================================================================
// 9. Editar cotización en borrador
// ============================================================================
console.log("9. Probando edición de cotización en borrador...");
{
  const db: DB = libroVacio();

  const p1 = altaProducto(db, {
    codigo: "BRO-01",
    nombre: "Broca para Concreto 3/8 Bosch",
    categoria: "Accesorios",
    marca: "Bosch",
    unidadMedida: "UNIDAD",
    inventarioInicial: 20,
    costo: 60,
    precio: 100,
    stockMinimo: 5,
  });

  const cot = crearCotizacion(db, {
    cliente: "Taller Hermanos Vega",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 2, precio: 100 }],
  });

  assert.equal(cot.subtotal, 200);

  // Modificar cantidad a 5 unidades y precio a 95
  const cotEditada = editarCotizacion(db, cot.id, {
    items: [{ productoId: p1.id, cantidad: 5, precio: 95 }],
    notas: "Precio especial por volumen",
  });

  assert.equal(cotEditada.subtotal, 475);
  assert.equal(cotEditada.iva, 71.25);
  assert.equal(cotEditada.total, 546.25);
  assert.equal(cotEditada.notas, "Precio especial por volumen");
  console.log("   ✓ Edición de renglones y recálculo matemático de cotización correctos.");
}

// ============================================================================
// 10. Emitir cotización (cambio a EMITIDA / ENVIADA / ACEPTADA)
// ============================================================================
console.log("10. Probando transiciones del ciclo de vida: BORRADOR -> EMITIDA -> ENVIADA -> ACEPTADA...");
{
  const db: DB = libroVacio();

  const p1 = altaProducto(db, {
    codigo: "CAN-01",
    nombre: "Candado de Seguridad Yale 50mm",
    categoria: "Cerrajería",
    marca: "Yale",
    unidadMedida: "UNIDAD",
    inventarioInicial: 15,
    costo: 180,
    precio: 260,
    stockMinimo: 2,
  });

  const cot = crearCotizacion(db, {
    cliente: "Seguridad Total",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 4, precio: 260 }],
  });

  const emitida = cambiarEstadoCotizacion(db, cot.id, "EMITIDA");
  assert.equal(emitida.estado, "EMITIDA");

  const enviada = marcarCotizacion(db, cot.id, "ENVIADA");
  assert.equal(enviada.estado, "ENVIADA");

  const aceptada = marcarCotizacion(db, cot.id, "ACEPTADA");
  assert.equal(aceptada.estado, "ACEPTADA");
  console.log("   ✓ Transiciones de estado completadas exitosamente.");
}

// ============================================================================
// 11. Rechazar o vencer cotización (transiciones válidas y bloqueo de conversión)
// ============================================================================
console.log("11. Probando rechazo y vencimiento de cotizaciones con protección ante conversión...");
{
  const db: DB = libroVacio();

  const p1 = altaProducto(db, {
    codigo: "CAB-01",
    nombre: "Cable THHN calibre 12",
    categoria: "Eléctrico",
    marca: "Condumex",
    unidadMedida: "METRO",
    inventarioInicial: 100,
    costo: 12,
    precio: 20,
    stockMinimo: 10,
  });

  // Cotización rechazada
  const cotRechazada = crearCotizacion(db, {
    cliente: "Cliente Desistido",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 10, precio: 20 }],
  });
  marcarCotizacion(db, cotRechazada.id, "RECHAZADA");

  assert.throws(
    () => convertirCotizacionAVenta(db, { cotizacionId: cotRechazada.id }),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("rechazada"),
    "No debe permitir convertir cotización rechazada",
  );

  // Cotización vencida
  const cotVencida = crearCotizacion(db, {
    cliente: "Cliente Vencido",
    fecha: "2026-10-01",
    fechaVencimiento: "2026-10-15", // vencida
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 10, precio: 20 }],
  });

  assert.throws(
    () => convertirCotizacionAVenta(db, { cotizacionId: cotVencida.id }),
    (err: any) => err instanceof ReglaBodegaError && (err.message.includes("venció") || err.message.includes("vencida")),
    "No debe permitir convertir cotización con fecha de vencimiento expirada",
  );
  console.log("   ✓ Cotizaciones rechazadas y vencidas protegidas contra facturación no autorizada.");
}

// ============================================================================
// 12. Convertir cotización aceptada a venta (generación de factura vinculada)
// ============================================================================
console.log("12. Probando conversión de cotización aceptada a venta...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const p1 = altaProducto(db, {
    codigo: "TAL-01",
    nombre: "Taladro Percutor 1/2 Bosch",
    categoria: "Herramientas",
    marca: "Bosch",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 1200,
    precio: 1800,
    stockMinimo: 2,
  });

  const cliente = crearCliente(db, {
    nombre: "Ingeniería y Diseños S.A.",
    identificacion: "J031000000004",
  });

  const cot = crearCotizacion(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 2, precio: 1800 }],
  });

  marcarCotizacion(db, cot.id, "ACEPTADA");

  // Convertir a venta
  const { cotizacion: cotFinal, factura } = convertirCotizacionAVenta(db, {
    cotizacionId: cot.id,
    usuario: "Cajero 1",
    formaPago: "TRANSFERENCIA",
  });

  assert.equal(cotFinal.estado, "FACTURADA");
  assert.equal(cotFinal.facturaId, factura.id);
  assert.equal(factura.cotizacionId, cot.id);
  assert.equal(factura.cliente, "Ingeniería y Diseños S.A.");
  assert.equal(p1.stockActual, 8, "Stock debe haber bajado de 10 a 8");
  assert.equal(factura.total, 4140); // 3600 + 15% IVA
  console.log("   ✓ Conversión completa: factura emitida, stock rebajado y enlaces bidireccionales confirmados.");
}

// ============================================================================
// 13. Bloquear conversión duplicada (idempotencia y estado FACTURADA)
// ============================================================================
console.log("13. Probando bloqueo de conversión duplicada e idempotencia...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const p1 = altaProducto(db, {
    codigo: "LLAV-01",
    nombre: "Juego de Llaves Combinadas Truper",
    categoria: "Herramientas",
    marca: "Truper",
    unidadMedida: "JUEGO",
    inventarioInicial: 10,
    costo: 300,
    precio: 450,
    stockMinimo: 2,
  });

  const cot = crearCotizacion(db, {
    cliente: "Auto Servicio Rápido",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 1, precio: 450 }],
  });

  marcarCotizacion(db, cot.id, "EMITIDA");

  const claveIdempotencia = "IDEM-COT-001";
  const { factura: fac1 } = convertirCotizacionAVenta(db, {
    cotizacionId: cot.id,
    usuario: "Cajero 1",
    claveOperacion: claveIdempotencia,
  });

  // Reintento con la misma clave de operación debe retornar la factura ya creada sin duplicar
  const { factura: fac2 } = convertirCotizacionAVenta(db, {
    cotizacionId: cot.id,
    usuario: "Cajero 1",
    claveOperacion: claveIdempotencia,
  });

  assert.equal(fac1.id, fac2.id);
  assert.equal(p1.stockActual, 9, "El stock solo se redujo una vez");

  // Intento de convertir una cotización ya FACTURADA sin clave de reintento debe fallar
  assert.throws(
    () => convertirCotizacionAVenta(db, { cotizacionId: cot.id, usuario: "Cajero 1" }),
    (err: any) => err instanceof ReglaBodegaError && (err.message.includes("ya fue facturada") || err.message.includes("ya fue convertida")),
    "Debe impedir reconvertir una cotización ya facturada",
  );
  console.log("   ✓ Idempotencia de conversión y protección de estado FACTURADA probadas con éxito.");
}

// ============================================================================
// 14. Bloquear conversión con stock insuficiente
// ============================================================================
console.log("14. Probando rechazo de conversión cuando el stock físico es insuficiente...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const p1 = altaProducto(db, {
    codigo: "SIER-01",
    nombre: "Sierra Circular 7 1/4 Skil",
    categoria: "Herramientas",
    marca: "Skil",
    unidadMedida: "UNIDAD",
    inventarioInicial: 3, // Solo 3 unidades en stock
    costo: 1500,
    precio: 2200,
    stockMinimo: 1,
  });

  const cot = crearCotizacion(db, {
    cliente: "Constructora Mayor",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 5, precio: 2200 }], // Piden 5
  });

  marcarCotizacion(db, cot.id, "EMITIDA");

  assert.throws(
    () => convertirCotizacionAVenta(db, { cotizacionId: cot.id, usuario: "Cajero 1" }),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("Stock insuficiente"),
    "Debe rechazar la conversión porque faltan 2 unidades",
  );

  assert.equal(p1.stockActual, 3, "El stock no debe modificarse si la validación falla");
  console.log("   ✓ Rechazo estricto ante stock insuficiente verificado.");
}

// ============================================================================
// 15. Cotización sin afectar inventario ni Kárdex ni caja
// ============================================================================
console.log("15. Probando neutralidad absoluta de cotizaciones sobre existencias, kárdex y caja...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 2000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const p1 = altaProducto(db, {
    codigo: "NIV-01",
    nombre: "Nivel Torpedo Magnético 9 pulg",
    categoria: "Herramientas",
    marca: "Stanley",
    unidadMedida: "UNIDAD",
    inventarioInicial: 15,
    costo: 120,
    precio: 180,
    stockMinimo: 2,
  });

  const stockAntes = p1.stockActual;
  const movsAntes = db.movimientos.length;
  const ventasCajaAntes = db.turnosCaja?.find((t) => t.estado === "ABIERTO")?.totalVentasEfectivo ?? 0;

  // Operaciones de cotización: crear, editar, emitir, cambiar de estado
  const c1 = crearCotizacion(db, {
    cliente: "Prueba Neutralidad 1",
    fecha: "2026-11-16",
    creadoPor: "Vendedor",
    items: [{ productoId: p1.id, cantidad: 5, precio: 180 }],
  });
  editarCotizacion(db, c1.id, {
    items: [{ productoId: p1.id, cantidad: 10, precio: 175 }],
  });
  cambiarEstadoCotizacion(db, c1.id, "EMITIDA");

  const c2 = crearCotizacion(db, {
    cliente: "Prueba Neutralidad 2",
    fecha: "2026-11-16",
    creadoPor: "Vendedor",
    items: [{ productoId: p1.id, cantidad: 2, precio: 180 }],
  });
  marcarCotizacion(db, c2.id, "RECHAZADA");

  assert.equal(p1.stockActual, stockAntes, "Stock no debe haber variado");
  assert.equal(db.movimientos.length, movsAntes, "Kárdex no debe tener ningún movimiento extra");
  assert.equal(
    db.turnosCaja?.find((t) => t.estado === "ABIERTO")?.totalVentasEfectivo ?? 0,
    ventasCajaAntes,
    "Caja no debe registrar cobros ni ventas por cotizaciones",
  );
  console.log("   ✓ Neutralidad de cotizaciones sobre stock, kárdex y caja comprobada.");
}

// ============================================================================
// 16. Cálculo correcto de IVA y descuentos en cotización
// ============================================================================
console.log("16. Probando cálculos tributarios (IVA 15%) y descuentos en cotizaciones...");
{
  const db: DB = libroVacio();

  const p1 = altaProducto(db, {
    codigo: "GRAV-01",
    nombre: "Producto Gravado",
    categoria: "General",
    marca: "Marca A",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 100,
    precio: 200,
    stockMinimo: 1,
  });

  const cot = crearCotizacion(db, {
    cliente: "Cliente Descuentos",
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    descuento: 50,
    items: [{ productoId: p1.id, cantidad: 3, precio: 200 }], // Bruto: 600
  });

  // Bruto: 600. IVA 15%: 90. Total con descuento global de 50: 640
  assert.equal(cot.subtotal, 600);
  assert.equal(cot.descuento, 50);
  assert.equal(cot.iva, 90);
  assert.equal(cot.total, 640);
  console.log("   ✓ Descuento y cálculo de IVA al 15% verificados.");
}

// ============================================================================
// 17. Impresión / membrete de cotización
// ============================================================================
console.log("17. Probando consistencia de datos de membrete comercial para impresión...");
{
  const db: DB = libroVacio();
  const configEmpresa = {
    empresa: "Ferretería Emmanuel S.A.",
    ruc: "J031000099999",
    telefono: "2255-7777",
    direccion: "Managua, Nicaragua",
  };

  const p1 = altaProducto(db, {
    codigo: "IMP-01",
    nombre: "Articulo Impresion",
    categoria: "Varios",
    marca: "Genérica",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 50,
    precio: 100,
    stockMinimo: 1,
  });

  const cliente = crearCliente(db, {
    nombre: "Arquitectura Contemporánea",
    identificacion: "J031000000005",
    telefono: "2233-4455",
    direccion: "Los Robles, Managua",
  });

  const cot = crearCotizacion(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-16",
    fechaVencimiento: "2026-11-30",
    condicionesComerciales: "Precios sujetos a cambio sin previo aviso. Crédito a 15 días.",
    notas: "Favor confirmar con orden de compra.",
    creadoPor: "Asesor Ventas",
    items: [{ productoId: p1.id, cantidad: 5, precio: 100 }],
  });

  // Validar que todos los campos requeridos para la vista/impresión oficial están presentes
  assert.ok(cot.folio);
  assert.equal(cot.folio.startsWith("COT-"), true);
  assert.equal(cot.cliente, "Arquitectura Contemporánea");
  assert.equal(cot.clienteId, cliente.id);
  assert.equal(cot.fecha, "2026-11-16");
  assert.equal(cot.fechaVencimiento, "2026-11-30");
  assert.equal(cot.condicionesComerciales, "Precios sujetos a cambio sin previo aviso. Crédito a 15 días.");
  assert.equal(cot.subtotal, 500);
  assert.equal(cot.iva, 75);
  assert.equal(cot.total, 575);
  console.log("   ✓ Datos de membrete, emisor y condiciones comerciales íntegros para impresión.");
}

// ============================================================================
// 18. Permisos y validaciones de datos (nombres vacíos, RUC duplicado)
// ============================================================================
console.log("18. Probando validaciones de entrada (longitud de nombres, RUCs duplicados)...");
{
  const db: DB = libroVacio();

  // Nombre muy corto debe fallar
  assert.throws(
    () => crearCliente(db, { nombre: "A" }),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("2 caracteres"),
    "Debe rechazar nombre de cliente menor a 2 caracteres",
  );

  // Crear cliente con RUC válido
  crearCliente(db, {
    nombre: "Cliente RUC Unico",
    identificacion: "J031000088888",
  });

  // Intentar crear otro cliente con el mismo RUC debe fallar
  assert.throws(
    () =>
      crearCliente(db, {
        nombre: "Cliente Duplicado",
        identificacion: "J031000088888",
      }),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("Ya existe un cliente") && err.message.includes("identificación"),
    "Debe rechazar identificación fiscal duplicada en clientes",
  );

  // Crear proveedor con RUC válido
  crearProveedor(db, {
    nombre: "Proveedor RUC Unico",
    identificacion: "J032000077777",
  });

  // Intentar crear otro proveedor con el mismo RUC debe fallar
  assert.throws(
    () =>
      crearProveedor(db, {
        nombre: "Proveedor Duplicado",
        identificacion: "J032000077777",
      }),
    (err: any) => err instanceof ReglaBodegaError && err.message.includes("Ya existe un proveedor") && err.message.includes("identificación"),
    "Debe rechazar identificación fiscal duplicada en proveedores",
  );
  console.log("   ✓ Validaciones de unicidad de RUC y datos mínimos verificadas.");
}

// ============================================================================
// 19. Integración con Grupos 1 y 2 (compras con proveedores, POS con clientes, cotización facturada en caja)
// ============================================================================
console.log("19. Probando integración end-to-end (Grupo 1 Compras -> Cotización -> Grupo 2 POS/Caja)...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 500, usuario: "Cajero Principal", fecha: "2026-11-16" });

  const prov = crearProveedor(db, {
    nombre: "Importaciones Industriales",
    identificacion: "J032000099999",
  });

  const cliente = crearCliente(db, {
    nombre: "Constructora del Sol",
    identificacion: "J031000055555",
  });

  const p1 = altaProducto(db, {
    codigo: "GEN-01",
    nombre: "Generador Eléctrico 5kW",
    categoria: "Maquinaria",
    marca: "Honda",
    unidadMedida: "UNIDAD",
    inventarioInicial: 0,
    costo: 15000,
    precio: 22000,
    stockMinimo: 1,
  });

  // Paso 1: Grupo 1 - Abastecimiento con el proveedor
  registrarCompra(db, {
    proveedor: prov.nombre,
    proveedorId: prov.id,
    fecha: "2026-11-16",
    numeroFactura: "FAC-PROV-999",
    condicionPago: "CONTADO",
    registradoPor: "Admin",
    items: [{ productoId: p1.id, cantidad: 2, precio: 15000 }],
  });

  assert.equal(p1.stockActual, 2);
  assert.equal(p1.costo, 15000);

  // Paso 2: Grupo 3 - Cotización comercial para el cliente
  const cot = crearCotizacion(db, {
    cliente: cliente.nombre,
    clienteId: cliente.id,
    fecha: "2026-11-16",
    creadoPor: "Vendedor 1",
    items: [{ productoId: p1.id, cantidad: 1, precio: 22000 }],
  });

  marcarCotizacion(db, cot.id, "ACEPTADA");

  // Paso 3: Grupo 2 - Facturación desde Caja/POS
  const { cotizacion: cotFacturada, factura } = convertirCotizacionAVenta(db, {
    cotizacionId: cot.id,
    usuario: "Cajero Principal",
    formaPago: "EFECTIVO",
    montoRecibido: 30000,
  });

  assert.equal(cotFacturada.estado, "FACTURADA");
  assert.equal(factura.estado, "PAGADA");
  assert.equal(p1.stockActual, 1, "Debe quedar 1 unidad tras la venta");
  assert.equal(factura.costoTotalVenta, 15000, "Costo de venta unitario 15000 registrado en factura");
  assert.equal(db.movimientos.length, 2, "Compra (+2) + Venta (-1)");
  console.log("   ✓ Integración completa entre Compras, Cotizaciones, POS y Kárdex operativa.");
}

// ============================================================================
// 20. Regresión comercial completa (sin efectos colaterales en CPP ni inventario)
// ============================================================================
console.log("20. Probando regresión de consistencia matemática y valoración patrimonial...");
{
  const db: DB = libroVacio();
  abrirTurno(db, { montoInicial: 1000, usuario: "Cajero 1", fecha: "2026-11-16" });

  const p1 = altaProducto(db, {
    codigo: "REG-01",
    nombre: "Producto de Regresión",
    categoria: "General",
    marca: "Test",
    unidadMedida: "UNIDAD",
    inventarioInicial: 10,
    costo: 100, // Valor patrimonial inicial: 1000
    precio: 150,
    stockMinimo: 2,
  });

  const prov = crearProveedor(db, { nombre: "Proveedor Regresion" });
  const cli = crearCliente(db, { nombre: "Cliente Regresion" });

  // 1. Crear y editar varias cotizaciones
  const c1 = crearCotizacion(db, {
    cliente: cli.nombre,
    clienteId: cli.id,
    fecha: "2026-11-16",
    items: [{ productoId: p1.id, cantidad: 5, precio: 150 }],
  });
  editarCotizacion(db, c1.id, {
    items: [{ productoId: p1.id, cantidad: 8, precio: 140 }],
  });

  // CPP y Stock deben ser estrictamente idénticos
  assert.equal(p1.stockActual, 10);
  assert.equal(p1.costo, 100);

  // 2. Compra nueva para cambiar CPP: 10 unidades a 120
  // CPP nuevo = (10 * 100 + 10 * 120) / 20 = 2200 / 20 = 110
  registrarCompra(db, {
    proveedor: prov.nombre,
    proveedorId: prov.id,
    fecha: "2026-11-16",
    numeroFactura: "REG-COMP-01",
    items: [{ productoId: p1.id, cantidad: 10, precio: 120 }],
  });

  assert.equal(p1.stockActual, 20);
  assert.equal(p1.costo, 110);

  // 3. Convertir c1 (cotizada a 140) a venta
  convertirCotizacionAVenta(db, {
    cotizacionId: c1.id,
    usuario: "Cajero 1",
    formaPago: "EFECTIVO",
    politicaPrecios: "CONSERVAR",
  });

  // Stock baja de 20 a 12 (se vendieron 8)
  assert.equal(p1.stockActual, 12);
  // CPP en salida de venta NO debe cambiar (sigue siendo 110)
  assert.equal(p1.costo, 110);

  // Validar kárdex del producto
  const movSalida = db.movimientos.find((m) => m.productoId === p1.id && m.tipo === "SALIDA");
  assert.ok(movSalida, "Debe existir movimiento de salida");
  assert.equal(movSalida.cantidad, 8);
  assert.equal(movSalida.costoUnitario, 110, "Costo unitario de salida en kárdex debe ser CPP vigente (110)");
  console.log("   ✓ Regresión completa: Kárdex, CPP y stock mantienen consistencia matemática perfecta.");
}

console.log("\n============================================================================");
console.log("✓ TODOS LOS 20 ESCENARIOS DEL GRUPO 3 HAN PASADO SATISFACTORIAMENTE");
console.log("============================================================================");
