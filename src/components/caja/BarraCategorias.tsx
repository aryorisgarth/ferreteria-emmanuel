"use client";

import { Layers } from "lucide-react";

interface BarraCategoriasProps {
  categorias: string[];
  categoriaActiva: string;
  onSeleccionarCategoria: (categoria: string) => void;
}

export function BarraCategorias({
  categorias,
  categoriaActiva,
  onSeleccionarCategoria,
}: BarraCategoriasProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSeleccionarCategoria("TODAS")}
        className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-bold whitespace-nowrap transition border ${
          categoriaActiva === "TODAS"
            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
            : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
        }`}
        title="Ver catálogo completo de artículos"
      >
        <Layers size={13} className={categoriaActiva === "TODAS" ? "text-amber-400" : "text-slate-400"} />
        <span>Todas</span>
      </button>

      {categorias.map((cat) => {
        const activa = categoriaActiva === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSeleccionarCategoria(cat)}
            className={`h-8 px-3 rounded text-xs font-semibold whitespace-nowrap transition border ${
              activa
                ? "bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
