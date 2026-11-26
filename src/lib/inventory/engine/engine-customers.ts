import { r2 } from "@/lib/format";
import type { DatosPersona, DB } from "@/lib/types";
import { ReglaBodegaError, totalesLineas } from "./engine-core";
import { personaNueva } from "./engine-entities-common";

export function crearCliente(db: DB, input: DatosPersona) {
  const cliente = personaNueva(input);
  if (cliente.identificacion) {
    const yaExiste = db.clientes.some(
      (c) => c.identificacion && c.identificacion.toLowerCase() === cliente.identificacion!.toLowerCase()
    );
    if (yaExiste) {
      throw new ReglaBodegaError(`Ya existe un cliente registrado con la identificación ${cliente.identificacion}.`);
    }
  }
  db.clientes.push(cliente);
  return cliente;
}

export function editarCliente(db: DB, id: string, input: Partial<DatosPersona>) {
  const cliente = db.clientes.find((c) => c.id === id);
  if (!cliente) throw new ReglaBodegaError("El cliente no existe.");
  const datos = personaNueva({
    nombre: input.nombre ?? cliente.nombre,
    telefono: input.telefono ?? cliente.telefono,
    direccion: input.direccion ?? cliente.direccion,
    notas: input.notas ?? cliente.notas,
    identificacion: input.identificacion !== undefined ? input.identificacion : cliente.identificacion,
    email: input.email !== undefined ? input.email : cliente.email,
    tipo: input.tipo ?? cliente.tipo,
    limiteCredito: input.limiteCredito !== undefined ? input.limiteCredito : cliente.limiteCredito,
    activo: input.activo !== undefined ? input.activo : cliente.activo,
  });
  if (datos.identificacion) {
    const colision = db.clientes.some(
      (c) => c.id !== id && c.identificacion && c.identificacion.toLowerCase() === datos.identificacion!.toLowerCase()
    );
    if (colision) {
      throw new ReglaBodegaError(`Ya existe otro cliente con la identificación ${datos.identificacion}.`);
    }
  }
  cliente.nombre = datos.nombre;
  cliente.telefono = datos.telefono;
  cliente.direccion = datos.direccion;
  cliente.notas = datos.notas;
  cliente.identificacion = datos.identificacion;
  cliente.email = datos.email;
  cliente.tipo = datos.tipo;
  if (input.limiteCredito !== undefined) cliente.limiteCredito = datos.limiteCredito;
  if (input.activo !== undefined) cliente.activo = input.activo;
  return cliente;
}

export function desactivarCliente(db: DB, id: string, activo?: boolean) {
  const cliente = db.clientes.find((c) => c.id === id);
  if (!cliente) throw new ReglaBodegaError("El cliente no existe.");
  cliente.activo = activo !== undefined ? activo : !Boolean(cliente.activo);
  return cliente;
}

export function eliminarCliente(db: DB, id: string) {
  if (!db.clientes.some((c) => c.id === id)) throw new ReglaBodegaError("El cliente no existe.");
  const cliente = db.clientes.find((c) => c.id === id);
  if (!cliente) throw new ReglaBodegaError("El cliente no existe.");

  const tieneFacturas = db.facturas.some(
    (f) => f.clienteId === id || f.cliente.toLowerCase() === cliente.nombre.toLowerCase()
  );
  const tieneCotizaciones = db.cotizaciones.some(
    (c) => c.clienteId === id || c.cliente.toLowerCase() === cliente.nombre.toLowerCase()
  );
  if (tieneFacturas || tieneCotizaciones) {
    throw new ReglaBodegaError(
      `No se puede eliminar el cliente "${cliente.nombre}" porque tiene comprobantes o historial comercial registrado. Puede desactivarlo para que no aparezca en nuevas operaciones.`
    );
  }
  db.clientes = db.clientes.filter((c) => c.id !== id);
}

export function buscarClientes(db: DB, consulta: string) {
  const q = consulta.trim().toLowerCase();
  return db.clientes
    .filter(
      (c) =>
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.identificacion && c.identificacion.toLowerCase().includes(q)) ||
        (c.notas && c.notas.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function perfilCliente(db: DB, id: string) {
  const cliente = db.clientes.find((c) => c.id === id);
  if (!cliente) return null;

  const facturasCliente = db.facturas
    .filter((f) => f.clienteId === id || f.cliente.toLowerCase() === cliente.nombre.toLowerCase())
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((f) => ({ factura: f, ...totalesLineas(f.items) }));

  const cotizacionesCliente = db.cotizaciones
    .filter((c) => c.clienteId === id || c.cliente.toLowerCase() === cliente.nombre.toLowerCase())
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((c) => ({ cotizacion: c, ...totalesLineas(c.items) }));

  const facturasValidas = facturasCliente.filter((f) => f.factura.estado !== "ANULADA");
  const totalComprado = r2(facturasValidas.reduce((acc, f) => acc + f.total, 0));
  const saldoPendiente = r2(
    facturasCliente
      .filter((f) => f.factura.formaPago === "CREDITO" && f.factura.estado === "EMITIDA")
      .reduce((acc, f) => acc + f.total, 0)
  );
  const ultimaCompra = facturasValidas.length > 0 ? facturasValidas[0].factura.fecha : null;

  return {
    cliente,
    facturas: facturasCliente,
    cotizaciones: cotizacionesCliente,
    totalComprado,
    saldoPendiente,
    ultimaCompra,
  };
}
