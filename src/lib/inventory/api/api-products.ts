import * as local from "@/lib/inventory/local";
import * as remoto from "@/lib/inventory/supabase-bodega";
import { getStorageProvider } from "@/lib/repositories";
import type { DatosProducto, FilaExcel } from "@/lib/types";
import { conexion, getRepo } from "./api-core";

export async function productos(q: string = "", page: number = 1) {
  const sb = conexion();
  if (sb) return remoto.productos(sb, q, page);
  return getRepo().productos(q, page);
}

export async function catalogo() {
  const sb = conexion();
  if (sb) return remoto.catalogo(sb);
  return getRepo().catalogo();
}

export async function inventarioPaginado(filtros: {
  page?: number;
  limit?: number;
  q?: string;
  categoria?: string;
  marca?: string;
  estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
  soloStockBajo?: boolean;
}) {
  if (getStorageProvider() === "postgres") {
    const repo = getRepo() as any;
    if (typeof repo.inventarioPaginado === "function") {
      return repo.inventarioPaginado(filtros);
    }
  }
  return local.inventarioPaginado(filtros);
}

export async function producto(id: string) {
  const sb = conexion();
  if (sb) return remoto.producto(sb, id);
  return getRepo().producto(id);
}

export async function alta(input: DatosProducto) {
  const sb = conexion();
  if (sb) return remoto.alta(sb, input);
  return getRepo().alta(input);
}

export async function editarArticulo(id: string, input: DatosProducto) {
  return getRepo().editarArticulo(id, input);
}

export async function borrarArticulo(id: string) {
  return getRepo().borrarArticulo(id);
}

export async function activarArticulo(id: string, activo: boolean) {
  if (activo) {
    return (getRepo() as any).activarArticulo(id, true);
  }
  return (getRepo() as any).desactivarArticulo ? (getRepo() as any).desactivarArticulo(id) : (getRepo() as any).borrarArticulo(id);
}

export async function categorias() {
  if (getStorageProvider() === "postgres") {
    const prods = await getRepo().catalogo();
    const set = new Set<string>(prods.map((p: any) => p.categoria).filter(Boolean));
    if (set.size === 0) return ["General", "Herramientas", "Construcción", "Pinturas", "Plomería", "Eléctrico"];
    return Array.from(set).sort();
  }
  return local.categorias();
}

export async function marcas() {
  if (getStorageProvider() === "postgres") {
    const prods = await getRepo().catalogo();
    const set = new Set<string>(prods.map((p: any) => p.marca || "Genérica").filter(Boolean));
    return Array.from(set).sort();
  }
  return local.marcas();
}

export async function importar(filas: FilaExcel[], usuario: string) {
  const sb = conexion();
  if (sb) return remoto.importar(sb, filas, usuario);
  return getRepo().importar(filas, usuario);
}
