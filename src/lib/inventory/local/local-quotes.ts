import { paginar } from "@/lib/format";
import {
  cambiarEstadoCotizacion,
  convertirCotizacionAVenta,
  crearCotizacion,
  detalleCotizacion,
  editarCotizacion,
  eliminarCotizacion,
  totalesLineas,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { EstadoCotizacion } from "@/lib/types";

export function cotizaciones(page: number, q = "", estado = "") {
  return consultar((db) => {
    const query = q.trim().toLowerCase();
    const filtradas = db.cotizaciones.filter((c) => {
      const matchQ = !query || c.numero.toLowerCase().includes(query) || c.cliente.toLowerCase().includes(query);
      const matchEstado = !estado || c.estado === estado;
      return matchQ && matchEstado;
    });
    return paginar(
      [...filtradas]
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero))
        .map((cotizacion) => ({ cotizacion, ...totalesLineas(cotizacion.items) })),
      page,
    );
  });
}

export function cotizacion(id: string) {
  return consultar((db) => detalleCotizacion(db, id));
}

export function crearCotizacionLocal(input: Parameters<typeof crearCotizacion>[1]) {
  return transaccion((db) => crearCotizacion(db, input).id);
}

export function marcarCotizacionLocal(id: string, estado: EstadoCotizacion, motivo?: string) {
  transaccion((db) => cambiarEstadoCotizacion(db, id, estado, motivo));
}

export function editarCotizacionLocal(id: string, input: Parameters<typeof editarCotizacion>[2]) {
  transaccion((db) => editarCotizacion(db, id, input));
}

export function borrarCotizacion(id: string) {
  transaccion((db) => eliminarCotizacion(db, id));
}

export function convertirCotizacionAVentaLocal(input: Parameters<typeof convertirCotizacionAVenta>[1]) {
  return transaccion((db) => convertirCotizacionAVenta(db, input).factura.id);
}
