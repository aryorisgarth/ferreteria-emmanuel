import type { EstadoSolicitud, OrigenMovimiento, ProductoVista, TipoMovimiento, TotalDia, UnidadMedida } from "@/lib/types";

export interface SolicitudFila {
  id: string;
  numero: string;
  estado: EstadoSolicitud;
  solicitante: string;
  destinatario: string;
  fecha: string;
  oficinaNombre: string;
  actaNumero: string | null;
  stockAplicado: boolean;
}

export interface LineaVista {
  id: string;
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  unidadMedida: UnidadMedida;
  observacion: string;
}

export interface SolicitudDetalle {
  id: string;
  numero: string;
  estado: EstadoSolicitud;
  solicitante: string;
  destinatario: string;
  observaciones: string;
  fecha: string;
  oficinaId: string;
  oficinaNombre: string;
  actaId: string | null;
  actaNumero: string | null;
  ejecutada: boolean;
  stockAplicado: boolean;
  items: LineaVista[];
}

export interface ActaFila {
  id: string;
  numero: string;
  fecha: string;
  destinatario: string;
  oficinaNombre: string;
  ejecutada: boolean;
  esSalidaDirecta: boolean;
  solicitudId: string | null;
  solicitudNumero: string | null;
}

export interface ActaDetalle extends ActaFila {
  concepto: string;
  items: LineaVista[];
}

export interface ResumenBodega {
  fecha: string;
  conteos: Record<EstadoSolicitud, number>;
  sinExistencia: ProductoVista[];
  despachos: TotalDia[];
}

export interface FiltroKardex {
  productoId?: string;
  codigo?: string;
  codigoBarras?: string;
  desde?: string;
  hasta?: string;
  tipo?: TipoMovimiento | "";
  origen?: OrigenMovimiento | "";
  referencia?: string;
  busqueda?: string;
  soloAuditoria?: boolean;
  page?: number | "ultima" | "todas";
}
