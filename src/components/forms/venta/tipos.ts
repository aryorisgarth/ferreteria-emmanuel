import type { Cliente, UnidadMedida } from "@/lib/types";

export interface OpcionVenta {
  id: string;
  codigo: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  unidadMedida: UnidadMedida;
  stockActual: number;
  precio: number;
}

export interface FilaVenta {
  productoId: string;
  cantidad: number;
  precio: number;
  observacion: string;
}

export interface FormularioVentaProps {
  catalogo: OpcionVenta[];
  fecha: string;
  modo: "cotizacion" | "factura";
  clientes?: Cliente[];
  simboloMoneda?: string;
  porcentajeImpuesto?: number;
}

export type FormaPagoFactura = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO";
