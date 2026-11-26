import { r2 } from "@/lib/format";
import type { DatosPersona, DB, Proveedor } from "@/lib/types";
import { ReglaBodegaError, totalesLineas } from "./engine-core";
import { personaNueva } from "./engine-entities-common";

export function crearProveedor(db: DB, input: DatosPersona) {
  const proveedor = personaNueva(input) as Proveedor;
  if (proveedor.identificacion) {
    const yaExiste = db.proveedores.some(
      (p) => p.identificacion && p.identificacion.toLowerCase() === proveedor.identificacion!.toLowerCase()
    );
    if (yaExiste) {
      throw new ReglaBodegaError(`Ya existe un proveedor registrado con el RUC/identificación ${proveedor.identificacion}.`);
    }
  }
  db.proveedores.push(proveedor);
  return proveedor;
}

export function editarProveedor(db: DB, id: string, input: Partial<DatosPersona>) {
  const proveedor = db.proveedores.find((p) => p.id === id);
  if (!proveedor) throw new ReglaBodegaError("El proveedor no existe.");
  const datos = personaNueva({
    nombre: input.nombre ?? proveedor.nombre,
    telefono: input.telefono ?? proveedor.telefono,
    direccion: input.direccion ?? proveedor.direccion,
    notas: input.notas ?? proveedor.notas,
    identificacion: input.identificacion !== undefined ? input.identificacion : proveedor.identificacion,
    email: input.email !== undefined ? input.email : proveedor.email,
    contacto: input.contacto !== undefined ? input.contacto : proveedor.contacto,
    diasCredito: input.diasCredito !== undefined ? input.diasCredito : proveedor.diasCredito,
    activo: input.activo !== undefined ? input.activo : proveedor.activo,
  });
  if (datos.identificacion) {
    const colision = db.proveedores.some(
      (p) => p.id !== id && p.identificacion && p.identificacion.toLowerCase() === datos.identificacion!.toLowerCase()
    );
    if (colision) {
      throw new ReglaBodegaError(`Ya existe otro proveedor con el RUC/identificación ${datos.identificacion}.`);
    }
  }
  proveedor.nombre = datos.nombre;
  proveedor.telefono = datos.telefono;
  proveedor.direccion = datos.direccion;
  proveedor.notas = datos.notas;
  proveedor.identificacion = datos.identificacion;
  proveedor.email = datos.email;
  proveedor.contacto = datos.contacto;
  if (input.diasCredito !== undefined) proveedor.diasCredito = datos.diasCredito;
  if (input.activo !== undefined) proveedor.activo = input.activo;
  return proveedor;
}

export function desactivarProveedor(db: DB, id: string, activo?: boolean) {
  const proveedor = db.proveedores.find((p) => p.id === id);
  if (!proveedor) throw new ReglaBodegaError("El proveedor no existe.");
  proveedor.activo = activo !== undefined ? activo : !Boolean(proveedor.activo);
  return proveedor;
}

export function eliminarProveedor(db: DB, id: string) {
  const proveedor = db.proveedores.find((p) => p.id === id);
  if (!proveedor) throw new ReglaBodegaError("El proveedor no existe.");

  const tieneCompras = db.compras.some(
    (c) => c.proveedorId === id || c.proveedor.toLowerCase() === proveedor.nombre.toLowerCase()
  );
  const comprasIds = new Set(
    db.compras
      .filter((c) => c.proveedorId === id || c.proveedor.toLowerCase() === proveedor.nombre.toLowerCase())
      .map((c) => c.id)
  );
  const tienePedidos = (db.pedidosCompra ?? []).some((p) => p.proveedorId === id);
  const tieneRecepciones = (db.recepcionesCompra ?? []).some((r) => r.proveedorId === id);
  const tieneDevoluciones = (db.devolucionesProveedor ?? []).some((d) => d.proveedorId === id);
  const tienePagos = (db.pagosCompra ?? []).some((p) => p.proveedorId === id || comprasIds.has(p.compraId));

  if (tieneCompras || tienePedidos || tieneRecepciones || tieneDevoluciones || tienePagos) {
    throw new ReglaBodegaError(
      `No se puede eliminar el proveedor "${proveedor.nombre}" porque registra operaciones comerciales históricas (compras, pedidos, recepciones o cuentas). Puede desactivarlo.`
    );
  }
  db.proveedores = db.proveedores.filter((p) => p.id !== id);
}

export function buscarProveedores(db: DB, consulta: string) {
  const q = consulta.trim().toLowerCase();
  return db.proveedores
    .filter(
      (p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.identificacion && p.identificacion.toLowerCase().includes(q)) ||
        (p.contacto && p.contacto.toLowerCase().includes(q)) ||
        (p.notas && p.notas.toLowerCase().includes(q)) ||
        (p.telefono && p.telefono.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.direccion && p.direccion.toLowerCase().includes(q))
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function perfilProveedor(db: DB, id: string) {
  const proveedor = db.proveedores.find((p) => p.id === id);
  if (!proveedor) return null;

  const comprasProveedor = db.compras
    .filter((c) => c.proveedorId === id || c.proveedor.toLowerCase() === proveedor.nombre.toLowerCase())
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((c) => ({ compra: c, ...totalesLineas(c.items) }));

  const pedidos = (db.pedidosCompra ?? [])
    .filter((p) => p.proveedorId === id || p.proveedor.toLowerCase() === proveedor.nombre.toLowerCase())
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  const recepciones = (db.recepcionesCompra ?? [])
    .filter((r) => r.proveedorId === id || r.proveedor.toLowerCase() === proveedor.nombre.toLowerCase())
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const devoluciones = (db.devolucionesProveedor ?? [])
    .filter((d) => d.proveedorId === id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const comprasIds = new Set(comprasProveedor.map((c) => c.compra.id));
  const pagos = (db.pagosCompra ?? [])
    .filter((p) => (p.proveedorId && p.proveedorId === id) || comprasIds.has(p.compraId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const comprasValidas = comprasProveedor.filter((c) => !c.compra.anulada);
  const totalComprado = r2(comprasValidas.reduce((acc, c) => acc + c.total, 0));
  const cuentasPorPagar = comprasValidas.filter(
    (c) => c.compra.condicionPago === "CREDITO" && (c.compra.saldoPendiente === undefined || c.compra.saldoPendiente > 0)
  );
  const saldoTotalPendiente = r2(
    cuentasPorPagar.reduce((acc, c) => acc + (c.compra.saldoPendiente !== undefined ? c.compra.saldoPendiente : c.total), 0)
  );

  return {
    proveedor,
    compras: comprasProveedor,
    pedidos,
    recepciones,
    devoluciones,
    pagos,
    cuentasPorPagar,
    totalComprado,
    saldoTotalPendiente,
    totalDevoluciones: r2(devoluciones.reduce((acc, d) => acc + d.total, 0)),
    totalAbonado: r2(pagos.reduce((acc, p) => acc + p.monto, 0)),
    ultimaCompra: comprasValidas.length > 0 ? comprasValidas[0].compra.fecha : null,
  };
}
