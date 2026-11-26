import { r3 } from "@/lib/format";
import type { DB, Movimiento } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";

export function ordenKardex(a: Movimiento, b: Movimiento) {
  return (
    a.fecha.localeCompare(b.fecha) ||
    a.secuencia - b.secuencia ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

export function exigirProducto(db: DB, id: string) {
  const producto = db.productos.find((p) => p.id === id);
  if (!producto) throw new ReglaBodegaError("Artículo inexistente.");
  return producto;
}

export function exigirOficina(db: DB, id: string) {
  const oficina = db.oficinas.find((o) => o.id === id);
  if (!oficina) throw new ReglaBodegaError("La dependencia de destino no existe.");
  return oficina;
}

export function exigirSolicitud(db: DB, id: string) {
  const solicitud = db.solicitudes.find((s) => s.id === id);
  if (!solicitud) throw new ReglaBodegaError("La solicitud no existe.");
  return solicitud;
}

export function agrupar(items: Array<{ productoId: string; cantidad: number }>) {
  return items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad }));
}

export function siguiente(
  db: DB,
  tipo: "solicitud" | "acta" | "cotizacion" | "factura" | "compra" | "turno" | "ajuste" | "conteo" | "pedido" | "recepcion" | "devolucion" | "devolucionCliente" | "pago",
  fecha: string,
) {
  if (db.folios[tipo] === undefined) (db.folios as any)[tipo] = 0;
  (db.folios as any)[tipo] += 1;
  const prefijo: Record<string, string> = {
    solicitud: "SM",
    acta: "AE",
    cotizacion: "COT",
    factura: "FAC",
    compra: "COM",
    turno: "TRN",
    ajuste: "AJU",
    conteo: "CNT",
    pedido: "PED",
    recepcion: "REC",
    devolucion: "DEV",
    devolucionCliente: "DEV",
    pago: "PAG",
  };
  return `${prefijo[tipo] || "FOL"}-${fecha.slice(0, 4)}-${String((db.folios as any)[tipo]).padStart(5, "0")}`;
}

export function movimientoNuevo(
  db: DB,
  campos: Omit<Movimiento, "id" | "entradas" | "salidas" | "stockSaldo" | "unidadMedida" | "secuencia" | "createdAt" | "estadoAuditoria"> & {
    esAuditoria: boolean;
  },
): Movimiento {
  const producto = exigirProducto(db, campos.productoId);
  const secuencia = db.movimientos.filter((m) => m.productoId === producto.id).reduce((max, m) => Math.max(max, m.secuencia), 0) + 1;
  return {
    ...campos,
    id: crypto.randomUUID(),
    entradas: 0,
    salidas: 0,
    stockSaldo: 0,
    unidadMedida: producto.unidadMedida,
    estadoAuditoria: campos.esAuditoria ? "EN_AUDITORIA" : "NORMAL",
    secuencia,
    createdAt: new Date().toISOString(),
  };
}

export function asegurarDisponible(db: DB, lineas: Array<{ productoId: string; cantidad: number }>) {
  const necesidad = new Map<string, number>();
  for (const linea of lineas) {
    necesidad.set(linea.productoId, r3((necesidad.get(linea.productoId) ?? 0) + linea.cantidad));
  }
  for (const [productoId, cantidad] of necesidad) {
    const p = db.productos.find((pr) => pr.id === productoId);
    if (!p) throw new ReglaBodegaError("Hay un artículo que no existe en el libro.");
    if (p.stockActual + 0.0001 < cantidad) {
      throw new ReglaBodegaError(
        `Stock insuficiente de ${p.nombre}: disponible ${p.stockActual} ${p.unidadMedida}, solicitado ${cantidad}.`,
      );
    }
  }
}

export function conStock(db: DB, productoIds: string[], mutar: () => void, recalcularFn?: (db: DB, id: string) => void) {
  const movs = structuredClone(db.movimientos);
  const actas = structuredClone(db.actas);
  const solicitudes = structuredClone(db.solicitudes);
  const cotizaciones = structuredClone(db.cotizaciones);
  const facturas = structuredClone(db.facturas);
  const compras = structuredClone(db.compras);
  const pedidos = structuredClone(db.pedidosCompra ?? []);
  const recepciones = structuredClone(db.recepcionesCompra ?? []);
  const devoluciones = structuredClone(db.devolucionesProveedor ?? []);
  const devolucionesCliente = structuredClone(db.devolucionesCliente ?? []);
  const turnosCaja = structuredClone(db.turnosCaja ?? []);
  const movimientosCaja = structuredClone(db.movimientosCaja ?? []);
  const pagos = structuredClone(db.pagosCompra ?? []);
  const ajustes = structuredClone(db.ajustesInventario ?? []);
  const conteos = structuredClone(db.conteosFisicos ?? []);
  const folios = structuredClone(db.folios);
  const stocks = db.productos.map((p) => [p.id, p.stockActual] as const);
  const costos = db.productos.map((p) => [p.id, p.costo] as const);
  try {
    mutar();
    if (recalcularFn) {
      for (const id of new Set(productoIds)) recalcularFn(db, id);
    }
  } catch (error) {
    db.movimientos = movs;
    db.actas = actas;
    db.solicitudes = solicitudes;
    db.cotizaciones = cotizaciones;
    db.facturas = facturas;
    db.compras = compras;
    db.pedidosCompra = pedidos;
    db.recepcionesCompra = recepciones;
    db.devolucionesProveedor = devoluciones;
    db.devolucionesCliente = devolucionesCliente;
    db.turnosCaja = turnosCaja;
    db.movimientosCaja = movimientosCaja;
    db.pagosCompra = pagos;
    db.ajustesInventario = ajustes;
    db.conteosFisicos = conteos;
    db.folios = folios;
    for (const [id, stock] of stocks) {
      const producto = db.productos.find((p) => p.id === id);
      if (producto) producto.stockActual = stock;
    }
    for (const [id, costo] of costos) {
      const producto = db.productos.find((p) => p.id === id);
      if (producto) producto.costo = costo;
    }
    throw error;
  }
}
