"use client";

import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import type { ProductoVista } from "@/lib/types";
import { FilaProducto } from "./FilaProducto";

interface TablaProductosProps {
  productosVisibles: ProductoVista[];
  esAdmin: boolean;
  totalArticulosFiltrados: number;
  totalPaginas: number;
  paginaActual: number;
  inicioPaginacion: number;
  itemsPorPagina: number;
  onEditar: (p: ProductoVista) => void;
  onActivarDesactivar: (p: ProductoVista) => void;
  onEliminar: (p: ProductoVista) => void;
  onCambioPagina: (pagina: number) => void;
}

export function TablaProductos({
  productosVisibles,
  esAdmin,
  totalArticulosFiltrados,
  totalPaginas,
  paginaActual,
  inicioPaginacion,
  itemsPorPagina,
  onEditar,
  onActivarDesactivar,
  onEliminar,
  onCambioPagina,
}: TablaProductosProps) {
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-5 sm:px-6">Artículo / Clasificación</th>
              <th className="py-3.5 px-4 text-right">Precio de Venta</th>
              <th className="py-3.5 px-4 text-center">Stock Disponible</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-5 sm:px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productosVisibles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400">
                  <Package size={36} className="mx-auto mb-2.5 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-600">No se encontraron artículos</p>
                  <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando la búsqueda o los filtros de categoría.</p>
                </td>
              </tr>
            ) : (
              productosVisibles.map((p) => (
                <FilaProducto
                  key={p.id}
                  p={p}
                  esAdmin={esAdmin}
                  onEditar={onEditar}
                  onActivarDesactivar={onActivarDesactivar}
                  onEliminar={onEliminar}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalArticulosFiltrados > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
          <span>
            Mostrando <strong className="text-slate-800 font-bold">{inicioPaginacion + 1}</strong>–
            <strong className="text-slate-800 font-bold">
              {Math.min(inicioPaginacion + itemsPorPagina, totalArticulosFiltrados)}
            </strong>{" "}
            de <strong className="text-slate-800 font-bold">{totalArticulosFiltrados}</strong> artículos en catálogo
          </span>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => onCambioPagina(Math.max(1, paginaActual - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="px-3 py-1 rounded bg-white border border-slate-200 font-mono font-bold text-slate-700">
                {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => onCambioPagina(Math.min(totalPaginas, paginaActual + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
