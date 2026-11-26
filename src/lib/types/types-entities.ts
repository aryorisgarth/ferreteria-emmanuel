export interface Persona {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  identificacion?: string;
  email?: string;
  tipo?: "PARTICULAR" | "EMPRESA";
  contacto?: string;
  diasCredito?: number;
  limiteCredito?: number;
  saldoPendiente?: number;
  activo?: boolean;
}

export type Cliente = Persona;
export type Proveedor = Persona;

export interface DatosPersona {
  nombre: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  identificacion?: string;
  email?: string;
  tipo?: "PARTICULAR" | "EMPRESA";
  contacto?: string;
  diasCredito?: number;
  limiteCredito?: number;
  activo?: boolean;
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
  notas: string;
  creadoPor: string;
}
