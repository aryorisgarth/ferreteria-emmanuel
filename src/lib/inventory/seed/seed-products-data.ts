import type { Movimiento, Oficina, UnidadMedida } from "@/lib/types";

export const PRODUCTOS_SEED: Array<[string, string, UnidadMedida, number]> = [
  ["FE-001", "Clavo de acero 2 pulgadas", "UNIDAD", 200],
  ["FE-002", "Clavo de acero 3 pulgadas", "UNIDAD", 150],
  ["FE-003", "Alambre galvanizado calibre 14", "METRO", 500],
  ["FE-004", "Cemento gris de uso general", "BOLSA", 40],
  ["FE-005", "Arena de río", "METRO_CUBICO", 18],
  ["FE-006", "Pintura látex blanca", "GALON", 24],
  ["FE-007", "Thinner estándar", "LITRO", 36],
  ["FE-008", "Cable THW calibre 12", "METRO", 400],
  ["FE-009", "Tornillo drywall 1 1/4", "UNIDAD", 800],
  ["FE-010", "Disco de corte 4 1/2", "UNIDAD", 80],
  ["FE-011", "Guantes de cuero", "PAR", 40],
  ["FE-012", "Casco de seguridad", "UNIDAD", 25],
  ["FE-013", "Candado de acero 40 mm", "UNIDAD", 30],
  ["FE-014", "Cadena galvanizada", "METRO", 120],
  ["FE-015", "Sellador de silicona", "UNIDAD", 48],
  ["FE-016", "Brocha de 3 pulgadas", "UNIDAD", 40],
  ["FE-017", "Lija de agua No. 80", "UNIDAD", 200],
  ["FE-018", "Pegamento para PVC", "LITRO", 15],
  ["FE-019", "Abrazadera de 1/2 pulgada", "UNIDAD", 100],
  ["FE-020", "Codo PVC 1/2 pulgada", "UNIDAD", 80],
  ["FE-021", "Tee PVC 1/2 pulgada", "UNIDAD", 60],
  ["FE-022", "Malla ciclón galvanizada", "METRO", 90],
  ["FE-023", "Cal hidratada", "BOLSA", 28],
  ["FE-024", "Varilla corrugada 3/8", "UNIDAD", 0],
];

export const OFICINAS_SEED: Oficina[] = [
  { id: "of-direccion", nombre: "Dirección Administrativa", tipo: "OFICINA" },
  { id: "of-compras", nombre: "Oficina de Compras", tipo: "OFICINA" },
  { id: "of-taller", nombre: "Taller de Mantenimiento", tipo: "DEPENDENCIA" },
  { id: "of-bodega", nombre: "Bodega Central", tipo: "DEPENDENCIA" },
  { id: "of-obras", nombre: "Jefatura de Obras", tipo: "OFICINA" },
  { id: "of-servicios", nombre: "Servicios Generales", tipo: "DEPENDENCIA" },
];

export const CATEGORIAS_SEED = [
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

export function idProducto(codigo: string) {
  return `p-${codigo.toLowerCase()}`;
}

export function baseMovimiento(
  parcial: Omit<Movimiento, "entradas" | "salidas" | "stockSaldo"> &
    Partial<Pick<Movimiento, "entradas" | "salidas" | "stockSaldo">>
): Movimiento {
  return {
    entradas: 0,
    salidas: 0,
    stockSaldo: 0,
    ...parcial,
  };
}
