import type {
  AjusteInventario,
  ConteoFisico,
  ProductoVista,
  UnidadMedida,
} from "@/lib/types";

export type TabInventario = "productos" | "ajustes" | "conteos";

export interface InventarioCrudProps {
  productosIniciales: ProductoVista[];
  paginacionServidor?: {
    total: number;
    totalPaginas: number;
    paginaActual: number;
  };
  metricasServidor?: {
    totalArticulos: number;
    stockBajoCount: number;
    valorInventario: number;
  };
  filtrosServidor?: {
    q: string;
    categoria: string;
    marca: string;
    estado: "TODOS" | "ACTIVOS" | "INACTIVOS";
    soloStockBajo: boolean;
  };
  categoriasDisponibles: string[];
  marcasDisponibles?: string[];
  ajustesIniciales?: AjusteInventario[];
  conteosIniciales?: ConteoFisico[];
  tabInicial?: string;
  esAdmin?: boolean;
}

export interface LineaNuevoConteo {
  productoId: string;
  nombre: string;
  codigo: string;
  unidadMedida: UnidadMedida;
  stockSistema: number;
  conteoFisico: number;
  observacion: string;
}
