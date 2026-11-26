import { r2 } from "@/lib/format";
import type { Cotizacion, DB, EstadoCotizacion } from "@/lib/types";
import { fechaValida, IVA, ReglaBodegaError, totalesLineas } from "./engine-core";
import { siguiente } from "./engine-helpers";
import { prepararLineas, vistaLineas } from "./engine-lines";

export function crearCotizacion(
  db: DB,
  input: {
    cliente?: string;
    clienteNombre?: string;
    clienteId?: string | null;
    clienteRuc?: string;
    fecha?: string;
    notas?: string;
    creadoPor?: string;
    items: Array<{ productoId: string; cantidad: number; precio?: number; precioUnitario?: number; observacion?: string; descuento?: number; exentoIva?: boolean }>;
    fechaVencimiento?: string;
    condicionesComerciales?: string;
    descuento?: number;
    exenta?: boolean;
    tasaIva?: number;
    estado?: EstadoCotizacion;
    validezDias?: number;
  },
) {
  const clienteFinal = (input.cliente ?? input.clienteNombre ?? "").trim();
  if (clienteFinal.length < 2) throw new ReglaBodegaError("Indique el cliente (mínimo 2 caracteres).");
  const fechaDoc = input.fecha ?? new Date().toISOString().slice(0, 10);
  fechaValida(fechaDoc);
  if (input.fechaVencimiento) fechaValida(input.fechaVencimiento);
  const itemsNormalizados = (input.items || []).map((it) => ({
    productoId: it.productoId,
    cantidad: it.cantidad,
    precio: it.precio ?? it.precioUnitario ?? 0,
    observacion: it.observacion,
    descuento: it.descuento,
    exentoIva: it.exentoIva,
  }));
  const items = prepararLineas(db, itemsNormalizados);
  const tasaImpuesto = input.exenta ? 0 : (input.tasaIva !== undefined ? input.tasaIva : IVA);
  const { subtotal, iva, total } = totalesLineas(items, tasaImpuesto);
  const descuento = input.descuento ? r2(input.descuento) : 0;
  const totalConDescuento = r2(Math.max(0, total - descuento));

  const numero = siguiente(db, "cotizacion", fechaDoc);
  const cotizacion: Cotizacion = {
    id: crypto.randomUUID(),
    numero,
    folio: numero,
    cliente: clienteFinal,
    clienteId: input.clienteId ?? null,
    fecha: fechaDoc,
    fechaVencimiento: input.fechaVencimiento || undefined,
    estado: input.estado || "BORRADOR",
    notas: (input.notas ?? "").trim(),
    condicionesComerciales: input.condicionesComerciales?.trim() || undefined,
    creadoPor: input.creadoPor ?? "Vendedor",
    facturaId: null,
    items,
    subtotal,
    descuento,
    iva,
    total: totalConDescuento,
  };
  db.cotizaciones.push(cotizacion);
  return cotizacion;
}

export function cambiarEstadoCotizacion(
  db: DB,
  id: string,
  estado: EstadoCotizacion,
  motivo?: string
) {
  const cotizacion = db.cotizaciones.find((c) => c.id === id);
  if (!cotizacion) throw new ReglaBodegaError("La cotización no existe.");
  if (cotizacion.estado === "FACTURADA") {
    throw new ReglaBodegaError("La cotización ya fue facturada y su estado no puede modificarse.");
  }
  if (estado === "FACTURADA") {
    throw new ReglaBodegaError("Para marcar como facturada debe procesar la venta formalmente.");
  }
  cotizacion.estado = estado;
  if (motivo) {
    cotizacion.notas = cotizacion.notas ? `${cotizacion.notas} [${motivo}]` : motivo;
  }
  return cotizacion;
}

export function marcarCotizacion(db: DB, id: string, estado: EstadoCotizacion) {
  return cambiarEstadoCotizacion(db, id, estado);
}

export function editarCotizacion(
  db: DB,
  id: string,
  input: {
    cliente?: string;
    clienteId?: string | null;
    fecha?: string;
    fechaVencimiento?: string;
    notas?: string;
    condicionesComerciales?: string;
    items?: Array<{ productoId: string; cantidad: number; precio: number; observacion?: string; descuento?: number; exentoIva?: boolean }>;
    descuento?: number;
    exenta?: boolean;
    tasaIva?: number;
  },
) {
  const cotizacion = db.cotizaciones.find((c) => c.id === id);
  if (!cotizacion) throw new ReglaBodegaError("La cotización no existe.");
  if (cotizacion.estado === "FACTURADA") throw new ReglaBodegaError("No se edita una cotización ya facturada.");
  if (cotizacion.estado === "RECHAZADA" || cotizacion.estado === "VENCIDA") {
    throw new ReglaBodegaError(`No se puede editar una cotización en estado ${cotizacion.estado}.`);
  }
  const cliente = input.cliente !== undefined ? input.cliente.trim() : cotizacion.cliente;
  if (cliente.length < 2) throw new ReglaBodegaError("Indique el cliente.");
  const fecha = input.fecha ?? cotizacion.fecha;
  fechaValida(fecha);
  if (input.fechaVencimiento) fechaValida(input.fechaVencimiento);
  const items = input.items ? prepararLineas(db, input.items) : cotizacion.items;
  const tasaImpuesto = input.exenta ? 0 : (input.tasaIva !== undefined ? input.tasaIva : IVA);
  const { subtotal, iva, total } = totalesLineas(items, tasaImpuesto);
  const descuento = input.descuento !== undefined ? r2(input.descuento) : (cotizacion.descuento ?? 0);
  const totalConDescuento = r2(Math.max(0, total - descuento));

  cotizacion.cliente = cliente;
  cotizacion.clienteId = input.clienteId !== undefined ? input.clienteId : cotizacion.clienteId;
  cotizacion.fecha = fecha;
  if (input.fechaVencimiento !== undefined) cotizacion.fechaVencimiento = input.fechaVencimiento;
  if (input.notas !== undefined) cotizacion.notas = input.notas.trim();
  if (input.condicionesComerciales !== undefined) cotizacion.condicionesComerciales = input.condicionesComerciales.trim();
  cotizacion.items = items;
  cotizacion.subtotal = subtotal;
  cotizacion.descuento = descuento;
  cotizacion.iva = iva;
  cotizacion.total = totalConDescuento;
  return cotizacion;
}

export function eliminarCotizacion(db: DB, id: string) {
  const cotizacion = db.cotizaciones.find((c) => c.id === id);
  if (!cotizacion) throw new ReglaBodegaError("La cotización no existe.");
  if (cotizacion.estado === "FACTURADA") throw new ReglaBodegaError("No se borra una cotización facturada.");
  db.cotizaciones = db.cotizaciones.filter((c) => c.id !== id);
}

export function detalleCotizacion(db: DB, id: string) {
  const cotizacion = db.cotizaciones.find((c) => c.id === id);
  if (!cotizacion) return null;
  return { ...cotizacion, items: vistaLineas(db, cotizacion.items) };
}
