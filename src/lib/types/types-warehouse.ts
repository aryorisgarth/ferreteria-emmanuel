import type {
  EstadoAuditoria,
  EstadoSolicitud,
  OrigenMovimiento,
  TipoMovimiento,
  UnidadMedida,
} from "./types-core";

export type TipoAjusteInventario = "SOBRANTE" | "FALTANTE" | "DANO" | "MERMA" | "CORRECCION";

export interface AjusteInventario {
  id: string;
  numero: string;
  productoId: string;
  tipo: TipoAjusteInventario;
  cantidad: number;
  signo: 1 | -1;
  stockPrevio: number;
  stockNuevo: number;
  costoUnitario: number;
  valorTotal: number;
  motivo: string;
  fecha: string;
  usuario: string;
  conteoId?: string | null;
  createdAt: string;
}

export interface ConteoFisicoItem {
  productoId: string;
  stockSistema: number;
  conteoFisico: number;
  diferencia: number;
  observacion?: string;
}

export interface ConteoFisico {
  id: string;
  numero: string;
  fecha: string;
  usuario: string;
  notas: string;
  estado: "BORRADOR" | "APLICADO";
  items: ConteoFisicoItem[];
  createdAt: string;
}

export interface LineaDocumento {
  id: string;
  productoId: string;
  cantidad: number;
  unidadMedida: UnidadMedida;
  observacion: string;
  solicitudItemId?: string | null;
}

export interface SolicitudItem {
  id: string;
  productoId: string;
  cantidad: number;
  unidadMedida: UnidadMedida;
  observacion: string;
}

export interface Solicitud {
  id: string;
  numero: string;
  estado: EstadoSolicitud;
  solicitante: string;
  oficinaId: string;
  destinatario: string;
  observaciones: string;
  fecha: string;
  actaId: string | null;
  stockAplicado: boolean;
  creadoPor: string;
  items: SolicitudItem[];
}

export interface Acta {
  id: string;
  numero: string;
  solicitudId: string | null;
  esSalidaDirecta: boolean;
  oficinaId: string;
  destinatario: string;
  fecha: string;
  concepto: string;
  ejecutada: boolean;
  items: LineaDocumento[];
}

export interface Movimiento {
  id: string;
  productoId: string;
  fecha: string;
  tipo: TipoMovimiento;
  cantidad: number;
  entradas: number;
  salidas: number;
  stockSaldo: number;
  unidadMedida: UnidadMedida;
  destinatario: string;
  oficinaId: string | null;
  actaId: string | null;
  actaItemId: string | null;
  solicitudId: string | null;
  solicitudItemId: string | null;
  numeroReferencia: string;
  concepto: string;
  usuario: string;
  esAuditoria: boolean;
  estadoAuditoria: EstadoAuditoria;
  origen: OrigenMovimiento;
  idempotencyKey: string | null;
  secuencia: number;
  createdAt: string;
  costoUnitario?: number | null;
  valorEntrada?: number | null;
  valorSalida?: number | null;
  saldoValorado?: number | null;
}

export interface MovimientoVista extends Movimiento {
  codigo: string;
  nombre: string;
  codigoBarras?: string;
  oficinaNombre: string;
}

export interface MovimientoValorado extends MovimientoVista {
  costoUnitario?: number | null;
  valorEntrada?: number | null;
  valorSalida?: number | null;
  saldoValorado?: number | null;
}
