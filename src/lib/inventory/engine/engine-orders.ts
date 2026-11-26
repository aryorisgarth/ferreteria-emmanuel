import { r2, r3 } from "@/lib/format";
import type { DB, EstadoPedidoCompra, LineaPedidoCompra, PedidoCompra } from "@/lib/types";
import { fechaValida, ReglaBodegaError } from "./engine-core";
import { exigirProducto, siguiente } from "./engine-helpers";

export function crearPedidoCompra(
  db: DB,
  input: {
    proveedor: string;
    proveedorId?: string | null;
    fechaEmision: string;
    fechaEntregaEstimada?: string;
    notas?: string;
    creadoPor: string;
    estado?: EstadoPedidoCompra;
    items: Array<{ productoId: string; cantidadPedida: number; precioUnitario: number; observacion?: string }>;
  },
): PedidoCompra {
  const proveedor = input.proveedor.trim();
  if (proveedor.length < 2) throw new ReglaBodegaError("Indique el proveedor.");
  fechaValida(input.fechaEmision);
  if (!input.items?.length) throw new ReglaBodegaError("Agregue al menos un artículo al pedido.");

  if (!db.pedidosCompra) db.pedidosCompra = [];

  const items: LineaPedidoCompra[] = input.items.map((it) => {
    const prod = exigirProducto(db, it.productoId);
    if (!(it.cantidadPedida > 0)) throw new ReglaBodegaError("La cantidad solicitada debe ser mayor que cero.");
    if (!Number.isFinite(it.precioUnitario) || it.precioUnitario < 0) {
      throw new ReglaBodegaError("El precio unitario no es válido.");
    }
    return {
      id: crypto.randomUUID(),
      productoId: prod.id,
      cantidadPedida: r3(it.cantidadPedida),
      cantidadRecibida: 0,
      precioUnitario: r2(it.precioUnitario),
      observacion: (it.observacion ?? "").trim(),
    };
  });

  const estado = input.estado ?? "EMITIDO";
  const pedido: PedidoCompra = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "pedido", input.fechaEmision),
    proveedorId: input.proveedorId ?? null,
    proveedor,
    fechaEmision: input.fechaEmision,
    fechaEntregaEstimada: input.fechaEntregaEstimada,
    estado,
    notas: (input.notas ?? "").trim(),
    creadoPor: input.creadoPor,
    items,
    createdAt: new Date().toISOString(),
  };

  db.pedidosCompra.push(pedido);
  return pedido;
}

export function cambiarEstadoPedidoCompra(
  db: DB,
  id: string,
  nuevoEstado: EstadoPedidoCompra,
) {
  if (!db.pedidosCompra) db.pedidosCompra = [];
  const pedido = db.pedidosCompra.find((p) => p.id === id);
  if (!pedido) throw new ReglaBodegaError("El pedido de compra no existe.");

  if (nuevoEstado === "CANCELADO") {
    const tieneRecepciones = (db.recepcionesCompra ?? []).some((r) => r.pedidoId === pedido.id);
    if (tieneRecepciones) {
      throw new ReglaBodegaError("No se puede cancelar un pedido que ya cuenta con recepciones de mercancía.");
    }
  }

  pedido.estado = nuevoEstado;
  return pedido;
}

export function detallePedidoCompra(db: DB, id: string) {
  if (!db.pedidosCompra) db.pedidosCompra = [];
  const pedido = db.pedidosCompra.find((p) => p.id === id);
  if (!pedido) return null;

  const items = pedido.items.map((linea) => {
    const producto = exigirProducto(db, linea.productoId);
    const pendiente = Math.max(0, r3(linea.cantidadPedida - linea.cantidadRecibida));
    const subtotal = r2(linea.cantidadPedida * linea.precioUnitario);
    return {
      ...linea,
      codigo: producto.codigo,
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      cantidadPendiente: pendiente,
      subtotal,
    };
  });

  const total = r2(items.reduce((acc, it) => acc + it.subtotal, 0));
  const recepciones = (db.recepcionesCompra ?? []).filter((r) => r.pedidoId === pedido.id);

  return { pedido, items, total, recepciones };
}

export function listarPedidosCompra(db: DB, filtros?: { estado?: EstadoPedidoCompra; proveedorId?: string }) {
  let pedidos = [...(db.pedidosCompra ?? [])];
  if (filtros?.estado) {
    pedidos = pedidos.filter((p) => p.estado === filtros.estado);
  }
  if (filtros?.proveedorId) {
    pedidos = pedidos.filter((p) => p.proveedorId === filtros.proveedorId);
  }
  return pedidos.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
}
