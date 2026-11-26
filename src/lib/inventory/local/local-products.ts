import { paginar } from "@/lib/format";
import {
  altaProducto,
  buscarProductos,
  desactivarProducto,
  editarProducto,
  eliminarProducto,
  vistaProductos,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { DatosProducto } from "@/lib/types";

export function inventarioPaginado(filtros: {
  page?: number;
  limit?: number;
  q?: string;
  categoria?: string;
  marca?: string;
  estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
  soloStockBajo?: boolean;
}) {
  return consultar((db) => {
    const todos = vistaProductos(db);
    const totalArticulos = todos.length;
    const stockBajoCount = todos.filter((p) => p.stockActual <= p.stockMinimo).length;
    const valorInventario = todos.reduce((sum, p) => sum + p.stockActual * (p.costo || p.precio * 0.7), 0);

    const qTerm = (filtros.q || "").trim().toLowerCase();
    const filtrados = todos.filter((p) => {
      const matchTexto =
        !qTerm ||
        p.codigo.toLowerCase().includes(qTerm) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(qTerm)) ||
        p.nombre.toLowerCase().includes(qTerm) ||
        p.categoria.toLowerCase().includes(qTerm) ||
        (p.marca && p.marca.toLowerCase().includes(qTerm));
      const matchCat = !filtros.categoria || filtros.categoria === "TODAS" || p.categoria === filtros.categoria;
      const matchMarca = !filtros.marca || filtros.marca === "TODAS" || (p.marca || "Genérica") === filtros.marca;
      const matchEstado =
        !filtros.estado ||
        filtros.estado === "TODOS" ||
        (filtros.estado === "ACTIVOS" && p.activo !== false) ||
        (filtros.estado === "INACTIVOS" && p.activo === false);
      const matchBajo = !filtros.soloStockBajo || p.stockActual <= p.stockMinimo;
      return matchTexto && matchCat && matchMarca && matchEstado && matchBajo;
    });

    const limit = Math.max(1, Number(filtros.limit) || 50);
    const total = filtrados.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const pageNum = Math.max(1, Math.min(Number(filtros.page) || 1, pages));
    const offset = (pageNum - 1) * limit;
    const rows = filtrados.slice(offset, offset + limit);

    return {
      rows, items: rows, total, pages, totalPaginas: pages, page: pageNum, pagina: pageNum,
      metricas: { totalArticulos, stockBajoCount, valorInventario },
    };
  });
}

export function productos(q: string, page: number) {
  return consultar((db) => paginar(buscarProductos(db, q), page));
}

export function catalogo() {
  return consultar((db) => vistaProductos(db));
}

export function producto(id: string) {
  return consultar((db) => vistaProductos(db).find((p) => p.id === id) ?? null);
}

export function alta(input: DatosProducto) {
  transaccion((db) => altaProducto(db, input));
}

export function editarArticulo(id: string, input: DatosProducto) {
  transaccion((db) => editarProducto(db, id, input));
}

export function borrarArticulo(id: string) {
  transaccion((db) => eliminarProducto(db, id));
}

export function activarArticulo(id: string, activo: boolean) {
  transaccion((db) => desactivarProducto(db, id, activo));
}

export function categorias() {
  return consultar((db) => db.categorias);
}

export function marcas() {
  return consultar((db) => {
    const set = new Set<string>();
    (db.productos ?? []).forEach((p) => {
      if (p.marca && p.marca.trim()) set.add(p.marca.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });
}
