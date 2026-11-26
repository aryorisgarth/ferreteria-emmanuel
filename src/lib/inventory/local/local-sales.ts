import { paginar } from "@/lib/format";
import {
  anularFactura as anularFacturaEngine,
  detalleFactura,
  emitirFactura as emitirFacturaEngine,
  pagarFactura as pagarFacturaEngine,
  totalesLineas,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { FormaPago, OrigenFactura } from "@/lib/types";

export function facturas(page: number, q = "", estado = "") {
  return consultar((db) => {
    const query = q.trim().toLowerCase();
    const filtradas = db.facturas.filter((f) => {
      const matchQ = !query || f.numero.toLowerCase().includes(query) || f.cliente.toLowerCase().includes(query);
      const matchEstado = !estado || f.estado === estado;
      return matchQ && matchEstado;
    });
    return paginar(
      [...filtradas]
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero))
        .map((factura) => ({ factura, ...totalesLineas(factura.items) })),
      page,
    );
  });
}

export function cuentasPorCobrar(page: number = 1, q = "") {
  return consultar((db) => {
    const query = q.trim().toLowerCase();
    const filtradas = db.facturas.filter((f) => {
      const matchCredito = f.formaPago === "CREDITO";
      const matchEstado = f.estado === "EMITIDA";
      const matchQ = !query || f.numero.toLowerCase().includes(query) || f.cliente.toLowerCase().includes(query);
      return matchCredito && matchEstado && matchQ;
    });

    const ordenadas = [...filtradas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero));
    const items = ordenadas.map((factura) => {
      const totales = totalesLineas(factura.items);
      return {
        ...totales,
        id: factura.id, numero: factura.numero, cliente: factura.cliente, clienteId: factura.clienteId,
        fecha: factura.fecha, saldoPendiente: totales.total, abonosPrevios: 0,
        formaPago: factura.formaPago, estado: factura.estado, factura,
      };
    });

    if (page === 0) {
      return { items, rows: items, total: items.length, totalPaginas: 1, pages: 1, pagina: 1, page: 1 };
    }
    const res = paginar(items, page);
    return { ...res, items: res.rows, totalPaginas: res.pages, pagina: res.page };
  });
}

export function factura(id: string) {
  return consultar((db) => detalleFactura(db, id));
}

export function emitirFactura(input: {
  cliente: string; clienteId?: string | null; fecha: string; notas: string; creadoPor: string;
  cotizacionId?: string | null; formaPago?: FormaPago; origen?: OrigenFactura;
  items?: Array<{ productoId: string; cantidad: number; precio: number; observacion?: string; exentoIva?: boolean; descuento?: number }>;
  descuento?: number; exenta?: boolean; tasaIva?: number; montoRecibido?: number; claveIdempotencia?: string;
}) {
  return transaccion((db) => emitirFacturaEngine(db, input).id);
}
export const emitirFacturaLocal = emitirFactura;

export function pagarFactura(id: string) {
  transaccion((db) => pagarFacturaEngine(db, id));
}
export const pagarFacturaLocal = pagarFactura;

export function anularFactura(id: string, usuario: string, _motivo?: string) {
  transaccion((db) => anularFacturaEngine(db, id, usuario));
}
export const anularFacturaLocal = anularFactura;
