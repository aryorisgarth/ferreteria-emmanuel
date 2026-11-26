import type { UnidadMedida } from "./types-core";

export interface Producto {
  id: string;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  marca?: string;
  unidadMedida: UnidadMedida;
  inventarioInicial: number;
  stockActual: number;
  precio: number;
  costo: number;
  categoria: string;
  stockMinimo: number;
  activo: boolean;
}

export interface ProductoVista extends Producto {
  totalEntradas: number;
  totalSalidas: number;
}

export interface Oficina {
  id: string;
  nombre: string;
  tipo: "OFICINA" | "DEPENDENCIA" | "PERSONA";
}

export interface DatosProducto {
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  marca?: string;
  unidadMedida: UnidadMedida;
  inventarioInicial: number;
  precio: number;
  costo: number;
  categoria: string;
  stockMinimo: number;
}
