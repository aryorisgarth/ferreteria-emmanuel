import { r2 } from "@/lib/format";
import type { DB } from "@/lib/types";

export class ReglaBodegaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReglaBodegaError";
  }
}

export const CATEGORIAS_INICIALES = [
  "Ferretería",
  "Herramientas",
  "Pintura",
  "Eléctrico",
  "Plomería",
  "Construcción",
  "Seguridad",
  "Jardín",
  "Otros",
];

export function libroVacio(): DB {
  return {
    productos: [],
    oficinas: [
      { id: "of-direccion", nombre: "Dirección Administrativa", tipo: "OFICINA" },
      { id: "of-compras", nombre: "Oficina de Compras", tipo: "OFICINA" },
      { id: "of-taller", nombre: "Taller de Mantenimiento", tipo: "DEPENDENCIA" },
      { id: "of-bodega", nombre: "Bodega Central", tipo: "DEPENDENCIA" },
      { id: "of-obras", nombre: "Jefatura de Obras", tipo: "OFICINA" },
      { id: "of-servicios", nombre: "Servicios Generales", tipo: "DEPENDENCIA" },
    ],
    solicitudes: [],
    actas: [],
    movimientos: [],
    cotizaciones: [],
    facturas: [],
    clientes: [],
    proveedores: [],
    compras: [],
    gastos: [],
    turnosCaja: [],
    movimientosCaja: [],
    ajustesInventario: [],
    conteosFisicos: [],
    pedidosCompra: [],
    recepcionesCompra: [],
    devolucionesProveedor: [],
    devolucionesCliente: [],
    pagosCompra: [],
    categorias: [...CATEGORIAS_INICIALES],
    folios: {
      solicitud: 0,
      acta: 0,
      excel: 0,
      cotizacion: 0,
      factura: 0,
      compra: 0,
      turno: 0,
      ajuste: 0,
      conteo: 0,
      pedido: 0,
      recepcion: 0,
      devolucion: 0,
      devolucionCliente: 0,
      pago: 0,
    },
  };
}

export function fechaDelLibro(db: DB) {
  const mov = db.movimientos[db.movimientos.length - 1];
  return mov ? mov.fecha : new Date().toISOString();
}

export const IVA = 0.15;
export const ISV = IVA; // Compatibilidad retroactiva

export function totalesLineas(
  items: Array<{ cantidad: number; precio: number; exentoIva?: boolean }>,
  tasaImpuesto: number = IVA,
) {
  const subtotal = r2(items.reduce((suma, item) => suma + item.cantidad * item.precio, 0));
  const subtotalGravado = r2(
    items.reduce((suma, item) => (item.exentoIva ? suma : suma + item.cantidad * item.precio), 0)
  );
  const iva = r2(subtotalGravado * tasaImpuesto);
  const total = r2(subtotal + iva);
  return { subtotal, iva, isv: iva, total };
}

export function fechaValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new ReglaBodegaError("La fecha no es válida.");
}
